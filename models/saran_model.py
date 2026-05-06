import json
import os

SARAN_FILE = os.path.join(os.path.dirname(__file__), '..', 'saran.json')

class SaranModel:
    @staticmethod
    def get_all_saran():
        if not os.path.exists(SARAN_FILE):
            return []
        with open(SARAN_FILE, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []

    @staticmethod
    def add_saran(member_id, saran_text, dps_name):
        saran_list = SaranModel.get_all_saran()
        saran_list.append({
            "member_id": member_id,
            "saran_text": saran_text,
            "dps_name": dps_name,
            "timestamp": __import__('datetime').datetime.now().isoformat()
        })
        with open(SARAN_FILE, 'w') as f:
            json.dump(saran_list, f, indent=4)
        return True

    @staticmethod
    def get_saran_by_member(member_id):
        saran_list = SaranModel.get_all_saran()
        return [s for s in saran_list if s['member_id'] == member_id]
    
    @staticmethod
    def delete_saran(member_id):
        saran_list = SaranModel.get_all_saran()
        saran_list = [s for s in saran_list if s['member_id'] != member_id]
        with open(SARAN_FILE, 'w') as f:
            json.dump(saran_list, f, indent=4)
        return True
