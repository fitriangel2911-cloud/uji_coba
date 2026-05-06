import os
try:
    from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
    from langchain_community.vectorstores import SupabaseVectorStore
    from langchain_classic.chains import create_retrieval_chain, create_history_aware_retriever
    from langchain_classic.chains.combine_documents import create_stuff_documents_chain
    from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
except ImportError as e:
    print(f"\n❌ ERROR: Library pendukung AI tidak lengkap! ({str(e)})")
    print("💡 SILAKAN JALANKAN: pip install langchain langchain-community langchain-google-genai pypdf google-generativeai\n")
    # Re-raise for traceback
    raise e

from supabase.client import create_client

class ShariaAI:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not found")
            
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-flash-latest",
            google_api_key=self.api_key,
            temperature=0.3
        )
        
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=self.api_key
        )
        
        self.supabase = create_client(self.supabase_url, self.supabase_key)
        self.vector_store = SupabaseVectorStore(
            client=self.supabase,
            embedding=self.embeddings,
            table_name="documents",
            query_name="match_documents"
        )

    def get_chatbot_response(self, query, chat_history=None):
        if chat_history is None:
            chat_history = []

        # 1. Contextualize Question: Re-phrase the question to be standalone given the history
        contextualize_q_system_prompt = (
            "Mengingat riwayat obrolan dan pertanyaan terbaru pengguna "
            "yang mungkin merujuk pada konteks dalam riwayat obrolan, "
            "rumuskan pertanyaan mandiri yang dapat dipahami tanpa riwayat obrolan. "
            "JANGAN menjawab pertanyaan, cukup rumuskan ulang jika perlu dan jika tidak, kembalikan apa adanya."
        )
        contextualize_q_prompt = ChatPromptTemplate.from_messages([
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])
        
        # Base retriever, only fetch top 2 most relevant chunks to speed up processing
        base_retriever = self.vector_store.as_retriever(search_kwargs={"k": 2})
        
        history_aware_retriever = create_history_aware_retriever(
            self.llm, base_retriever, contextualize_q_prompt
        )

        # 2. Answer Question: Use retrieved context to answer the standalone question
        system_prompt = (
            "Anda adalah asisten Sharia Compliance untuk Koperasi Digital IQ-RA. "
            "Gunakan potongan konteks berikut untuk menjawab pertanyaan pengguna secara ramah dan profesional. "
            "Jika Anda tidak tahu jawabannya, katakan saja Anda tidak tahu. "
            "ATURAN FORMATING SANGAT PENTING: "
            "1. JANGAN gunakan Markdown (seperti **tebal** atau *miring*). "
            "2. GUNAKAN tag HTML murni untuk styling: gunakan <b>untuk tebal</b>, <br> untuk baris baru, dan <ul><li> untuk list. "
            "3. Jaga agar jawaban tetap ringkas namun informatif (maksimal 4-5 kalimat).\n\n"
            "Konteks:\n{context}"
        )
        
        qa_prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])
        
        question_answer_chain = create_stuff_documents_chain(self.llm, qa_prompt)
        
        if len(chat_history) == 0:
            # Sangat krusial untuk kecepatan: Jika baru chat pertama, JANGAN gunakan history_aware
            # Ini memangkas 50% waktu respon!
            rag_chain = create_retrieval_chain(base_retriever, question_answer_chain)
        else:
            rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
            
        result = rag_chain.invoke({"input": query, "chat_history": chat_history})
        
        # Extract unique sources
        sources = []
        if "context" in result:
            for doc in result["context"]:
                source_name = os.path.basename(doc.metadata.get("source", "Unknown"))
                if source_name not in sources:
                    sources.add(source_name) if isinstance(sources, set) else sources.append(source_name)
        
        return {
            "answer": result["answer"],
            "sources": list(set(sources))
        }

    def get_contract_recommendation(self, application_data):
        query = f"Rekomendasi akad untuk pengajuan pembiayaan: {application_data}"
        
        system_prompt = (
            "Analisis data pengajuan pembiayaan berikut dan berikan rekomendasi akad syariah yang paling tepat berdasarkan pedoman koperasi. "
            "Konteks Pedoman Syariah:\n{context}\n\n"
            "ATURAN FORMAT SANGAT PENTING: Anda HARUS mengembalikan struktur HTML murni (tanpa tag pembungkus ```html). "
            "Format jawaban Anda tepat seperti template ini:\n"
            "<div style='margin-bottom: 1rem;'>\n"
            "   <div style='font-size: 0.8rem; color: var(--text-muted);'>Rekomendasi Akad:</div>\n"
            "   <div style='font-size: 1.2rem; font-weight: 800; color: #10b981;'>[NAMA AKAD (misal: MURABAHAH)]</div>\n"
            "</div>\n"
            "<div style='margin-bottom: 1rem;'>\n"
            "   <b>Alasan Pemilihan:</b><br>\n"
            "   <span style='color: var(--text-muted);'>[Jelaskan mengapa akad ini cocok untuk tujuan dan nominal tersebut]</span>\n"
            "</div>\n"
            "<div style='background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px; border-left: 3px solid var(--accent-gold);'>\n"
            "   <b>Syarat Utama & Peringatan:</b>\n"
            "   <ul style='margin-top: 0.5rem; margin-bottom: 0; padding-left: 1.2rem; color: var(--text-muted);'>\n"
            "       <li>[Syarat 1]</li>\n"
            "       <li>[Syarat 2]</li>\n"
            "   </ul>\n"
            "</div>"
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}"),
        ])
        
        question_answer_chain = create_stuff_documents_chain(self.llm, prompt)
        rag_chain = create_retrieval_chain(self.vector_store.as_retriever(), question_answer_chain)
        
        result = rag_chain.invoke({"input": query})
        return result["answer"]

    def analyze_member_profile(self, profile_data):
        """Menganalisis biodata calon anggota untuk memberikan saran kepatuhan & risiko syariah"""
        query = f"Analisis profil calon anggota untuk kelayakan keanggotaan syariah: {profile_data}"
        
        system_prompt = (
            "Anda adalah auditor Syariah. Analisis biodata calon anggota berikut berdasarkan prinsip koperasi syariah. "
            "Konteks Pedoman Syariah:\n{context}\n\n"
            "TUGAS: Berikan ringkasan singkat (2-3 kalimat) tentang kelayakan atau catatan penting. "
            "Gunakan tag HTML <b> dan <small>. Fokus pada aspek pekerjaan/penghasilan dan kesesuaian akad yang dipilih. "
            "Jawab langsung ke intinya, sangat ringkas (maks 30 kata)."
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}"),
        ])
        
        question_answer_chain = create_stuff_documents_chain(self.llm, prompt)
        rag_chain = create_retrieval_chain(self.vector_store.as_retriever(search_kwargs={"k": 2}), question_answer_chain)
        
        result = rag_chain.invoke({"input": query})
        return result["answer"]
