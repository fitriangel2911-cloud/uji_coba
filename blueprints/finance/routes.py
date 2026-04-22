from flask import Blueprint, render_template, request, session
from decorators import admin_required
from models.finance_model import FinanceModel

finance_bp = Blueprint('finance', __name__)

@finance_bp.route('/finance')
@admin_required
def index():
    journals = FinanceModel.get_recent_journals()
    return render_template('finance/index.html', journals=journals)

@finance_bp.route('/api/finance/entry', methods=['POST'])
@admin_required
def create_entry():
    desc = request.form.get("description")
    amount = request.form.get("amount")
    type = request.form.get("type")
    
    res = FinanceModel.log_journal(desc, amount, type)
    
    if res:
        journals = FinanceModel.get_recent_journals()
        table = render_template('finance/journal_rows.html', journals=journals)
        toast = f'<div hx-swap-oob="innerHTML:#toast-container"><div class="alert-success">Transaksi berhasil dicatat!</div></div>'
        return table + toast
    return '<div class="alert-error">Gagal mencatat transaksi.</div>'
