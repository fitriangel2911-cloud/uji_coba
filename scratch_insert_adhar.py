from extensions import sp

def run():
    print("\n=== INSERTING ADHAR RAMADHAN ===")
    user_id = '9d4815d6-03b9-4b4d-a687-8df3edd1881c'
    insert_data = {
        "user_id": user_id,
        "full_name": "Adhar Ramadhan",
        "identity_number": "3171012345678901",
        "address": "Jl. Tazkia No. 1, Bogor",
        "phone_number": "085713473576",
        "contract_type": "Musyarakah",
        "is_contract_accepted": True,
        "status": "active"
    }
    try:
        res = sp.db_admin.table("members").insert(insert_data).execute()
        print("Success!", res.data)
    except Exception as e:
        print("Error inserting:", e)

if __name__ == "__main__":
    run()
