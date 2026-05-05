import os
import sys
# Add current dir to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.ai_model import ShariaAI
from config import Config

def test_rag():
    try:
        print("Inisialisasi AI...")
        ai = ShariaAI()
        
        print("\nMeminta rekomendasi AI...")
        # Simulasi data pengajuan pembiayaan
        simulated_data = "{'member_name': 'Budi', 'amount': 15000000, 'purpose': 'Modal Usaha Toko Kelontong'}"
        recommendation = ai.get_contract_recommendation(simulated_data)
        
        print("\n===============================")
        print("🤖 HASIL REKOMENDASI AI:")
        print("===============================")
        print(recommendation)
        
        print("\n\nMenguji Chatbot...")
        chat_resp = ai.get_chatbot_response("Apa itu akad Mudharabah?")
        print("\n===============================")
        print("🤖 JAWABAN CHATBOT:")
        print("===============================")
        print(chat_resp['answer'])
        print("\nSumber Dokumen:", chat_resp['sources'])
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_rag()
