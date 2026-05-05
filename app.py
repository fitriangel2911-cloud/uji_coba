from flask import Flask
from config import Config
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Register Blueprints
    from blueprints.auth.routes import auth_bp
    from blueprints.dashboard.routes import dashboard_bp
    from blueprints.kyc.routes import kyc_bp
    from blueprints.finance.routes import finance_bp
    from blueprints.ai.routes import ai_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(kyc_bp)
    app.register_blueprint(finance_bp)
    app.register_blueprint(ai_bp)
    
    @app.context_processor
    def inject_globals():
        return {
            "app_name": "IQ-RA System"
        }

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=app.config['DEBUG'], port=app.config['PORT'])
