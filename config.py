import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "iqra-secret-key-999")
    DEBUG = os.getenv("FLASK_DEBUG", "True") == "True"
    PORT = int(os.getenv("PORT", 5000))
