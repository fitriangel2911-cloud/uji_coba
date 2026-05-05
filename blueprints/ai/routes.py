from flask import Blueprint, request, jsonify, render_template, current_app, session
from models.ai_model import ShariaAI
import os
from werkzeug.utils import secure_filename
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore
from supabase.client import create_client
from decorators import login_required

def manager_required(f):
    from functools import wraps
    from flask import session, redirect, url_for, flash
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if str(session.get('role', '')).lower() != 'manager':
            flash("Akses ditolak: Hanya Manager yang dapat mengelola Pengetahuan AI.", "error")
            return redirect(url_for('dashboard.index'))
        return f(*args, **kwargs)
    return decorated_function

ai_bp = Blueprint('ai', __name__, url_prefix='/ai')

@ai_bp.route('/knowledge')
@login_required
@manager_required
def knowledge_page():
    return render_template('ai/knowledge.html')

@ai_bp.route('/upload', methods=['POST'])
@login_required
@manager_required
def upload_knowledge():
    try:
        if 'file' not in request.files:
            return "<div class='text-red-500'>Tidak ada file yang dipilih</div>"
        
        file = request.files['file']
        if file.filename == '':
            return "<div class='text-red-500'>Nama file kosong</div>"

        filename = secure_filename(file.filename)
        # Create temp dir if not exists
        temp_dir = os.path.join(os.getcwd(), 'temp_uploads')
        os.makedirs(temp_dir, exist_ok=True)
        
        file_path = os.path.join(temp_dir, filename)
        file.save(file_path)

        # Start Ingestion Logic (same as ingest_pdf.py)
        if filename.endswith('.pdf'):
            loader = PyPDFLoader(file_path)
        else:
            loader = TextLoader(file_path, encoding='utf-8')
        
        import time
        documents = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
        docs = text_splitter.split_documents(documents)

        # Initialize AI tools
        api_key = os.getenv("GOOGLE_API_KEY")
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=api_key)
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        supabase = create_client(supabase_url, supabase_key)
        
        # Process in batches to avoid 429 Rate Limit (Free Tier: 100 RPM)
        batch_size = 15
        vector_store = None
        
        for i in range(0, len(docs), batch_size):
            batch = docs[i:i + batch_size]
            if i == 0:
                vector_store = SupabaseVectorStore.from_documents(
                    batch,
                    embeddings,
                    client=supabase,
                    table_name="documents",
                    query_name="match_documents",
                )
            else:
                vector_store.add_documents(batch)
            
            # Wait a bit to stay safe under 100 RPM limit
            if i + batch_size < len(docs):
                time.sleep(10) # 10 seconds pause every 15 chunks

        # Cleanup
        os.remove(file_path)

        return f"""
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; color: #10b981; padding: 1rem; border-radius: 12px;" hx-trigger="load" hx-get="/ai/documents" hx-target="#documents-list">
                ✅ Berhasil! File '{filename}' telah dipelajari oleh AI.
            </div>
        """
    except Exception as e:
        return f"<div style='background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #ef4444; padding: 1rem; border-radius: 12px;'>❌ Gagal: {str(e)}</div>"

@ai_bp.route('/documents')
@login_required
@manager_required
def list_documents():
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        supabase = create_client(supabase_url, supabase_key)
        
        # Get unique source filenames from metadata
        # We'll use a raw RPC or just select all and filter in Python for simplicity in this case
        res = supabase.table('documents').select('metadata').execute()
        
        sources = set()
        for doc in res.data:
            source = doc['metadata'].get('source', 'Unknown')
            # Clean up the path to just show filename
            sources.add(os.path.basename(source))
        
        if not sources:
            return "<div style='text-align: center; color: var(--text-muted); padding: 2rem;'>Belum ada dokumen yang diunggah.</div>"
            
        html = '<div style="display: grid; gap: 1rem;">'
        for src in sorted(list(sources)):
            html += f"""
                <div id="doc-{src.replace('.', '-')}" style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem; border: 1px solid var(--glass-border);">
                    <div style="background: rgba(251, 191, 36, 0.1); padding: 8px; border-radius: 8px; color: var(--accent-gold);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div style="flex: 1;">
                        <div style="color: #fff; font-weight: 600; font-size: 0.9rem;">{src}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Aktif sebagai referensi AI</div>
                    </div>
                    <button hx-post="/ai/delete" 
                            hx-vals='{{"filename": "{src}"}}'
                            hx-target="#doc-{src.replace('.', '-')}"
                            hx-swap="outerHTML"
                            hx-confirm="Hapus dokumen ini dari memori AI?"
                            style="background: transparent; border: none; color: #fca5a5; cursor: pointer; padding: 0.5rem; border-radius: 8px;"
                            onmouseover="this.style.background='rgba(239, 68, 68, 0.1)'"
                            onmouseout="this.style.background='transparent'">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </div>
            """
        html += '</div>'
        return html
    except Exception as e:
        return f"<div style='color: #ef4444;'>Gagal memuat daftar dokumen: {str(e)}</div>"

@ai_bp.route('/delete', methods=['POST'])
@login_required
@manager_required
def delete_knowledge():
    try:
        filename = request.form.get('filename')
        if not filename:
            return "Filename missing"
            
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        supabase = create_client(supabase_url, supabase_key)
        
        # Deleting all chunks that match this source filename in metadata
        # Since 'source' in metadata is a full path, we use ILIKE with wildcards
        # Note: metadata is a JSONB column, so we use the ->> operator
        res = supabase.table('documents').delete().filter('metadata->>source', 'ilike', f'%{filename}%').execute()
        
        return "" # Return empty to remove the element via HTMX outerHTML swap
    except Exception as e:
        return f"<div style='color: #ef4444; font-size: 0.8rem;'>Gagal menghapus: {str(e)}</div>"

@ai_bp.route('/chat', methods=['POST'])
def chat():
    try:
        user_msg = request.form.get('message')
        if not user_msg:
            return ""
            
        # Get history from session
        if 'ai_chat_history' not in session:
            session['ai_chat_history'] = []
            
        # Convert simple session history to LangChain messages if needed
        # But ShariaAI.get_chatbot_response now handles conversion or expects specific format
        # Let's pass it as list of tuples (role, content) for simplicity
        history = []
        for msg in session['ai_chat_history'][-10:]: # Keep last 10 messages
            history.append((msg['role'], msg['content']))
            
        ai = ShariaAI()
        result = ai.get_chatbot_response(user_msg, chat_history=history)
        
        response_text = result["answer"]
        sources = result.get("sources", [])
        
        # Update session history
        session['ai_chat_history'].append({"role": "human", "content": user_msg})
        session['ai_chat_history'].append({"role": "ai", "content": response_text})
        session.modified = True
        
        # Render both user message and AI response
        user_html = render_template('components/ai_message.html', message=user_msg, is_ai=False)
        ai_html = render_template('components/ai_message.html', message=response_text, sources=sources, is_ai=True)
        
        return user_html + ai_html
    except Exception as e:
        return f"<div style='color: #fca5a5; padding: 1rem;'>Error: {str(e)}</div>"

@ai_bp.route('/chat/clear', methods=['POST'])
def clear_chat():
    session.pop('ai_chat_history', None)
    return """
        <div class="mb-4 text-left">
            <div class="inline-block p-3 rounded-lg bg-emerald-900/40 text-white max-w-[80%] shadow-sm border border-emerald-500/20">
                <p class="text-sm">Riwayat dihapus. Ada lagi yang bisa saya bantu?</p>
            </div>
        </div>
    """

@ai_bp.route('/recommend/modal', methods=['POST'])
def recommend_modal():
    try:
        # Get data from HTMX request
        amount = request.form.get('amount')
        purpose = request.form.get('purpose')
        member = request.form.get('member')
        
        data = {
            "amount": amount,
            "purpose": purpose,
            "member_name": member
        }
        
        ai = ShariaAI()
        recommendation = ai.get_contract_recommendation(data)
        
        # Return simple HTML content for the modal body
        return f"""
            <div class="animate-up">
                <div style="background: rgba(251, 191, 36, 0.05); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid rgba(251, 191, 36, 0.2);">
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Pengajuan Dari:</div>
                    <div style="font-weight: 700; color: #fff;">{member}</div>
                    <div style="font-size: 1.1rem; color: var(--accent-gold); font-weight: 800; margin-top: 0.25rem;">Rp {amount}</div>
                    <div style="font-size: 0.85rem; color: var(--text-main); margin-top: 0.5rem;">Tujuan: {purpose}</div>
                </div>
                
                <div style="white-space: pre-wrap;">{recommendation}</div>
                
                <div style="margin-top: 2rem; display: flex; justify-content: flex-end;">
                    <button @click="aiModalOpen = false" class="btn-gold" style="padding: 0.6rem 1.5rem; font-size: 0.85rem;">Tutup</button>
                </div>
            </div>
        """
    except Exception as e:
        return f"<div style='color: #fca5a5;'>Gagal mendapatkan rekomendasi: {str(e)}</div>"

@ai_bp.route('/recommend/inline', methods=['POST'])
def recommend_inline():
    try:
        data = {
            "amount": request.form.get('amount'),
            "purpose": request.form.get('purpose'),
            "member_name": request.form.get('member')
        }
        ai = ShariaAI()
        recommendation = ai.get_contract_recommendation(data)
        return f"<div style='white-space: pre-wrap;'>{recommendation}</div>"
    except Exception as e:
        return f"<div style='color: #fca5a5; font-size: 0.75rem;'>Error: {str(e)}</div>"

@ai_bp.route('/analyze-member', methods=['POST'])
def analyze_member():
    try:
        user_id = request.form.get('user_id')
        from models.member_model import MemberModel
        member = MemberModel.get_member_by_user_id(user_id)
        
        if not member:
            return "<span style='color: #fca5a5;'>Data tidak ditemukan</span>"
            
        ai = ShariaAI()
        analysis = ai.analyze_member_profile(member)
        return f"<div class='animate-up' style='font-size: 0.75rem; color: #fff; line-height: 1.4;'>{analysis}</div>"
    except Exception as e:
        return f"<span style='color: #fca5a5;'>Error AI: {str(e)}</span>"
