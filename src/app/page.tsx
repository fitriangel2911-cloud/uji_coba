'use client';

import React, { useState, useEffect } from 'react';
import { db, User, Member, Account, Transaction, FinancingContract, JournalEntry, AuditLog } from '../services/db';
import { queryShariaAssistant } from '../services/ai';

export default function Home() {
  // --- Hydration Protection State ---
  const [isMounted, setIsMounted] = useState(false);

  // --- Active Session Role Switching ---
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // --- Core State Management ---
  const [members, setMembers] = useState<Member[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contracts, setContracts] = useState<FinancingContract[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // --- Financial Report Tab Toggles ---
  const [reportTab, setReportTab] = useState<'neraca' | 'phu' | 'arus_kas'>('neraca');

  // --- Transactions & Form States ---
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositType, setDepositType] = useState<'wadiah' | 'mudharabah'>('wadiah');
  const [depositMethod, setDepositMethod] = useState<'tunai' | 'virtual_account'>('tunai');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawType, setWithdrawType] = useState<'wadiah' | 'mudharabah'>('wadiah');

  // --- PPOB Form States ---
  const [ppobType, setPpobType] = useState<'listrik' | 'pulsa' | 'air'>('listrik');
  const [ppobCustomerNo, setPpobCustomerNo] = useState<string>('');
  const [ppobAmount, setPpobAmount] = useState<string>('50000');
  const ppobFee = 2500;

  // --- New Financing Request Form States ---
  const [finType, setFinType] = useState<'murabahah' | 'qard'>('murabahah');
  const [finPrincipal, setFinPrincipal] = useState<string>('');
  const [finPeriod, setFinPeriod] = useState<string>('12');
  const [finItem, setFinItem] = useState<string>('');
  const [finMargin, setFinMargin] = useState<number>(0);
  const [finCalculatedInstallment, setFinCalculatedInstallment] = useState<number>(0);

  // --- Operational Expense Form States ---
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseDesc, setExpenseDesc] = useState<string>('');

  // --- AI Assistant Toggle & State ---
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Assalamualaikum! Saya adalah **Asisten Kepatuhan Syariah IQ-RA**. Ada yang bisa saya bantu terkait hukum transaksi syariah, akad Murabahah, atau simpanan Mudharabah hari ini?' }
  ]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // -------------------------------------------------------------
  // Data Fetching & Syncing Engine
  // -------------------------------------------------------------
  const syncState = () => {
    setMembers(db.getMembers());
    setAccounts(db.getAccounts());
    setContracts(db.getFinancingContracts());
    setJournals(db.getJournalEntries());
    setAuditLogs(db.getAuditLogs());
  };

  useEffect(() => {
    const initData = async () => {
      // Pull latest tables from Supabase cloud database, fallback to localStorage if offline
      await db.loadSupabaseData();

      // Initialize users
      const allUsers = db.getUsers();
      setUsers(allUsers);
      
      // Use Ahmad (usr-1) or first seeded user as default active session
      const defaultUser = allUsers.find(u => u.email === 'ahmad@ksd.id') || allUsers[0];
      setCurrentUser(defaultUser || null);
      
      syncState();
      setIsMounted(true);
    };
    initData();
  }, []);

  // Recalculate financing calculator on inputs
  useEffect(() => {
    const principalNum = parseFloat(finPrincipal) || 0;
    const periodNum = parseInt(finPeriod) || 12;

    if (finType === 'qard') {
      setFinMargin(0);
      setFinCalculatedInstallment(principalNum / periodNum);
    } else {
      // 10% annual margin profit rate for Murabahah
      const calculatedMargin = principalNum * 0.10 * (periodNum / 12);
      setFinMargin(Math.floor(calculatedMargin));
      setFinCalculatedInstallment((principalNum + calculatedMargin) / periodNum);
    }
  }, [finPrincipal, finPeriod, finType]);

  // Handle role switching
  const handleUserSwitch = (userId: string) => {
    const selected = users.find(u => u.id === userId);
    if (selected) {
      setCurrentUser(selected);
      db.logAudit(selected.id, `ROLE_SWITCH_TO_${selected.role.toUpperCase()}`, 'users');
      syncState();
    }
  };

  // -------------------------------------------------------------
  // Action Handlers
  // -------------------------------------------------------------

  const handleKYCApproval = (memberId: string, status: 'verified' | 'rejected') => {
    if (!currentUser) return;
    db.updateMemberStatus(memberId, status, currentUser.id);
    syncState();
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const amountNum = parseFloat(depositAmount);
    if (!amountNum || amountNum <= 0) return;

    // Ahmad's member account finder
    const member = members.find(m => m.userId === currentUser.id);
    if (!member) return;

    const acc = accounts.find(a => a.memberId === member.id && a.accountType === depositType);
    if (!acc) return;

    const success = db.createTransaction(acc.id, 'deposit', amountNum, currentUser.id, depositMethod);
    if (success) {
      setDepositAmount('');
      syncState();
      if (depositMethod === 'virtual_account') {
        alert(`Virtual Account BSI Syariah #8810-08${Math.floor(1000000000 + Math.random() * 9000000000)} berhasil dibuat. Pembayaran Rp ${amountNum.toLocaleString('id-ID')} via Virtual Account Gateway terdeteksi sukses seketika!`);
      } else {
        alert(`Setoran tunai Rp ${amountNum.toLocaleString('id-ID')} berhasil didebet ke akun simpanan ${depositType.toUpperCase()}.`);
      }
    }
  };

  const handlePPOBSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const amountNum = parseFloat(ppobAmount);
    if (!amountNum || amountNum <= 0 || !ppobCustomerNo) return;

    const member = members.find(m => m.userId === currentUser.id);
    if (!member) return;

    // Debit PPOB transaction from their Wadiah account
    const acc = accounts.find(a => a.memberId === member.id && a.accountType === 'wadiah');
    if (!acc) return;

    const success = db.createPPOBTransaction(member.id, acc.id, ppobType, ppobCustomerNo, amountNum, ppobFee, currentUser.id);
    if (success) {
      setPpobCustomerNo('');
      syncState();
      alert(`Transaksi PPOB ${ppobType.toUpperCase()} berhasil dibayarkan dari saldo Wadiah Anda! Admin fee Rp ${ppobFee.toLocaleString('id-ID')} disalurkan sebagai pendapatan koperasi.`);
    } else {
      alert("Maaf, saldo Wadiah Anda tidak mencukupi untuk membayar transaksi PPOB ini (termasuk biaya admin).");
    }
  };

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum <= 0) return;

    const member = members.find(m => m.userId === currentUser.id);
    if (!member) return;

    const acc = accounts.find(a => a.memberId === member.id && a.accountType === withdrawType);
    if (!acc) return;

    const success = db.createTransaction(acc.id, 'withdrawal', amountNum, currentUser.id);
    if (success) {
      setWithdrawAmount('');
      syncState();
    } else {
      alert("Maaf, saldo tabungan Anda tidak mencukupi untuk melakukan penarikan.");
    }
  };

  const handleApplyFinancing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const principalNum = parseFloat(finPrincipal);
    const periodNum = parseInt(finPeriod);
    if (!principalNum || principalNum <= 0 || !periodNum) return;

    const member = members.find(m => m.userId === currentUser.id);
    if (!member) return;

    db.applyFinancing(member.id, finType, principalNum, finMargin, periodNum, finItem);
    db.logAudit(currentUser.id, `FINANCING_APPLIED_TYPE_${finType.toUpperCase()}`, 'financing');
    
    setFinPrincipal('');
    setFinItem('');
    syncState();
    alert("Pengajuan pembiayaan berhasil diajukan! Menunggu verifikasi awal oleh Takmir Masjid.");
  };

  const handleVerificationFlow = (contractId: string, action: 'verify' | 'approve' | 'reject') => {
    if (!currentUser) return;
    let targetStatus: 'verified_by_takmir' | 'approved_by_dps' | 'rejected' = 'rejected';
    
    if (action === 'verify') targetStatus = 'verified_by_takmir';
    else if (action === 'approve') targetStatus = 'approved_by_dps';

    db.updateFinancingStatus(contractId, targetStatus, currentUser.id);
    syncState();
  };

  const handlePayInstallment = (contractId: string, amount: number) => {
    if (!currentUser) return;
    const success = db.payInstallment(contractId, amount, currentUser.id);
    if (success) {
      syncState();
      alert("Pembayaran angsuran berhasil didebet dari Kas dan mengurangi Piutang Anda.");
    }
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const amountNum = parseFloat(expenseAmount);
    if (!amountNum || amountNum <= 0 || !expenseDesc) return;

    db.createOperationalExpense(amountNum, expenseDesc, currentUser.id);
    setExpenseAmount('');
    setExpenseDesc('');
    syncState();
    alert("Beban operasional berhasil dibayarkan dan dicatat pada Jurnal Umum.");
  };

  const handleNisbahExecution = () => {
    if (!currentUser) return;
    const res = db.distributeNisbah(currentUser.id);
    if (res.success) {
      syncState();
      alert(`Bagi hasil Nisbah Mudharabah bulanan berhasil didistribusikan! Total Rp ${res.totalDistributed.toLocaleString('id-ID')} disalurkan ke anggota.`);
    } else {
      alert("Distribusi Nisbah dibatalkan. Koperasi tidak memiliki keuntungan bersih positif bulan ini.");
    }
  };

  // -------------------------------------------------------------
  // AI Bot Chat Executor
  // -------------------------------------------------------------

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    // Add user message
    const history = [...chatHistory, { sender: 'user' as const, text: query }];
    setChatHistory(history);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await queryShariaAssistant(query);
      setChatHistory([...history, { sender: 'ai' as const, text: response }]);
    } catch (e) {
      setChatHistory([...history, { sender: 'ai' as const, text: 'Maaf, terjadi kendala teknis saat menghubungi asisten AI syariah. Silakan ajukan pertanyaan lain.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Financial Calculators & Aggregations
  // -------------------------------------------------------------

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-emerald-400 animate-pulse tracking-wide">IQ-RA Sharia Digital Cooperative</h2>
          <p className="text-xs text-slate-400 mt-2">Sinkronisasi data aman dengan Supabase Cloud...</p>
        </div>
      </div>
    );
  }

  const neraca = db.generateNeraca();
  const phu = db.generatePHU();
  const arusKas = db.generateArusKas();

  // Find active member savings (Wadiah and Mudharabah) for the current logged-in user
  const activeMember = currentUser ? members.find(m => m.userId === currentUser.id) : null;
  const activeAccounts = activeMember ? accounts.filter(a => a.memberId === activeMember.id) : [];
  const activeContracts = activeMember ? contracts.filter(c => c.memberId === activeMember.id) : [];

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 relative">
      
      {/* 1. Header & Role Switching panel */}
      <header className="glass-panel rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-800 text-emerald-100 p-3 rounded-2xl">
            {/* Mosque logo icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-emerald-950 dark:text-emerald-50 tracking-tight">Koperasi Syariah Digital (KSD)</h1>
            <p className="text-sm text-slate-500 font-medium">IQ-RA System • SAK EP & DSN-MUI Compliant</p>
          </div>
        </div>

        {/* Dynamic Simulator Role Selector */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Simulasi Peran:</span>
          <select 
            value={currentUser?.id || ''} 
            onChange={(e) => handleUserSwitch(e.target.value)}
            className="bg-emerald-50 border border-emerald-100 text-emerald-900 text-sm font-semibold rounded-2xl focus:ring-emerald-500 focus:border-emerald-500 block p-3 pr-8 shadow-sm cursor-pointer outline-none"
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* 2. Unified Premium Cooperative Stats Dashboard */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Total Assets KPI */}
        <div className="glass-panel glass-panel-hover rounded-3xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Aset Koperasi</span>
            <div className="bg-emerald-100 text-emerald-800 p-2 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5m-18 0a2.25 2.25 0 0 0-2.25 2.25v10.5a2.25 2.25 0 0 0 2.25 2.25h15m-15-15v15m15-15v15M21.75 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white">
            Rp {neraca.totalAset.toLocaleString('id-ID')}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">Aktiva: Kas + Piutang Anggota</p>
        </div>

        {/* Outstanding Murabahah KPI */}
        <div className="glass-panel glass-panel-hover rounded-3xl p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Piutang Pembiayaan</span>
            <div className="bg-amber-100 text-amber-800 p-2 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white">
            Rp {neraca.piutang.toLocaleString('id-ID')}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">Realisasi Akad Murabahah & Qard</p>
        </div>

        {/* Member Savings KPI */}
        <div className="glass-panel glass-panel-hover rounded-3xl p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Simpanan Anggota</span>
            <div className="bg-blue-100 text-blue-800 p-2 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6m18 0V3.75A1.5 1.5 0 0 0 19.5 2.25H4.5A1.5 1.5 0 0 0 3 3.75V6m18 0v3M3 6v3" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white">
            Rp {neraca.totalLiabilitas.toLocaleString('id-ID')}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">Dana Simpanan Wadiah & Mudharabah</p>
        </div>

        {/* Cooperative Net Profit KPI */}
        <div className="glass-panel glass-panel-hover rounded-3xl p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Laba Bersih Berjalan</span>
            <div className="bg-purple-100 text-purple-800 p-2 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white">
            Rp {phu.labaBersih.toLocaleString('id-ID')}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">Realisasi Margin PHU Bulan Berjalan</p>
        </div>
      </section>

      {/* 3. Main Workspace Area split: Left (Financials & Dynamic Portal Views) | Right (Audit logs or specific cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Left Columns (occupies 2/3 of grid space) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* A. SAK EP REAL-TIME REPORTS TAB PANEL */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Laporan Keuangan Akrual (SAK EP)</h2>
                <p className="text-xs text-slate-400 font-medium">Dijurnalkan secara otomatis ganda berpasangan (*double-entry*)</p>
              </div>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                <button 
                  onClick={() => setReportTab('neraca')} 
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition ${reportTab === 'neraca' ? 'bg-white shadow text-emerald-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Neraca
                </button>
                <button 
                  onClick={() => setReportTab('phu')} 
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition ${reportTab === 'phu' ? 'bg-white shadow text-emerald-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  PHU (Laba Rugi)
                </button>
                <button 
                  onClick={() => setReportTab('arus_kas')} 
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition ${reportTab === 'arus_kas' ? 'bg-white shadow text-emerald-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Arus Kas
                </button>
              </div>
            </div>

            {/* Tab 1: NERACA (BALANCE SHEET) */}
            {reportTab === 'neraca' && (
              <div className="pt-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Aktiva (Assets) */}
                  <div className="flex flex-col bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">AKTIVA (ASET)</span>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                      <span className="text-sm font-semibold text-slate-600">101 - Kas & Setara Kas</span>
                      <span className="text-sm font-extrabold text-slate-800">Rp {neraca.kas.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                      <span className="text-sm font-semibold text-slate-600">102 - Piutang Pembiayaan Murabahah</span>
                      <span className="text-sm font-extrabold text-slate-800">Rp {neraca.piutang.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 mt-auto">
                      <span className="text-sm font-black text-slate-800">TOTAL AKTIVA (A)</span>
                      <span className="text-sm font-black text-emerald-700">Rp {neraca.totalAset.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Pasiva (Liabilities & Equity) */}
                  <div className="flex flex-col bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">PASIVA (KEWAJIBAN & EKUITAS)</span>
                    
                    {/* Liabilitas */}
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-150">
                      <span className="text-xs font-semibold text-slate-400">LIABILITAS (KEWAJIBAN)</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-sm font-semibold text-slate-600">201 - Simpanan Wadiah</span>
                      <span className="text-sm font-extrabold text-slate-800">Rp {neraca.wadiah.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-sm font-semibold text-slate-600">202 - Simpanan Mudharabah</span>
                      <span className="text-sm font-extrabold text-slate-800">Rp {neraca.mudharabah.toLocaleString('id-ID')}</span>
                    </div>

                    {/* Ekuitas */}
                    <div className="flex justify-between items-center py-1.5 mt-2 border-b border-slate-150">
                      <span className="text-xs font-semibold text-slate-400">EKUITAS (MODAL)</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-sm font-semibold text-slate-600">301 - Modal Pokok & Wajib</span>
                      <span className="text-sm font-extrabold text-slate-800">Rp {neraca.modal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-sm font-semibold text-slate-600">Sisa Hasil Usaha (SHU) Berjalan</span>
                      <span className="text-sm font-extrabold text-slate-800">Rp {neraca.labaBerjalan.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex justify-between items-center pt-4 mt-auto">
                      <span className="text-sm font-black text-slate-800">TOTAL PASIVA (B)</span>
                      <span className="text-sm font-black text-emerald-700">Rp {neraca.totalPasiva.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* SAK EP double-entry validation checker tag */}
                <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 p-4 rounded-2xl mt-4 font-bold text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </span>
                    <span>STANDAR AKUNTANSI KOPERASI SAK EP TERKONFIRMASI SEIMBANG</span>
                  </div>
                  <span>ASET = PASIVA ({neraca.isBalanced ? 'OK' : 'MISMATCH'})</span>
                </div>
              </div>
            )}

            {/* Tab 2: PHU (INCOME STATEMENT) */}
            {reportTab === 'phu' && (
              <div className="pt-6 animate-fade-in">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">LAPORAN PERHITUNGAN HASIL USAHA (PHU)</span>
                  
                  <div className="flex justify-between items-center py-3 border-b border-slate-200">
                    <span className="text-sm font-bold text-slate-700">401 - PENDAPATAN OPERASIONAL MARGIN MURABAHAH</span>
                    <span className="text-sm font-extrabold text-emerald-700">Rp {phu.pendapatanMargin.toLocaleString('id-ID')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-slate-200">
                    <span className="text-sm font-bold text-slate-700">501 - BEBAN OPERASIONAL (Beban Kantor & Bagi Hasil)</span>
                    <span className="text-sm font-extrabold text-amber-700">(Rp {phu.bebanOperasional.toLocaleString('id-ID')})</span>
                  </div>

                  <div className="flex justify-between items-center pt-4 mt-6">
                    <span className="text-base font-black text-slate-800">SISA HASIL USAHA (LABA BERSIH)</span>
                    <span className="text-base font-black text-emerald-800">Rp {phu.labaBersih.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: ARUS KAS (CASH FLOW) */}
            {reportTab === 'arus_kas' && (
              <div className="pt-6 animate-fade-in flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Arus Kas Masuk */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-3">ARUS KAS MASUK (INFLOWS)</span>
                    <div className="max-h-[160px] overflow-y-auto flex flex-col gap-2">
                      {arusKas.inflows.map((i, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 text-xs border-b border-slate-100">
                          <span className="text-slate-500 truncate max-w-[160px]">{i.desc}</span>
                          <span className="font-semibold text-slate-700">Rp {i.val.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-3 font-bold text-xs text-slate-700">
                      <span>Total Kas Masuk</span>
                      <span>Rp {arusKas.totalInflow.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Arus Kas Keluar */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-3">ARUS KAS KELUAR (OUTFLOWS)</span>
                    <div className="max-h-[160px] overflow-y-auto flex flex-col gap-2">
                      {arusKas.outflows.map((o, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 text-xs border-b border-slate-100">
                          <span className="text-slate-500 truncate max-w-[160px]">{o.desc}</span>
                          <span className="font-semibold text-slate-700">(Rp {o.val.toLocaleString('id-ID')})</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-3 font-bold text-xs text-slate-700">
                      <span>Total Kas Keluar</span>
                      <span>Rp {arusKas.totalOutflow.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-100 p-4 rounded-2xl font-bold text-sm text-slate-800">
                  <span>SALDO KAS BERSIH BULANAN</span>
                  <span>Rp {arusKas.netFlow.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}
          </div>

          {/* B. JAMAAH PORTAL DYNAMIC VIEWS */}
          {currentUser?.role === 'jamaah' && (
            <div className="flex flex-col gap-8 animate-slide-up">
              
              {/* Savings Dashboard (Credit-Card simulations) */}
              <div className="glass-panel rounded-3xl p-6">
                <h2 className="text-lg font-extrabold text-slate-800 mb-6">Rekening Simpanan Koperasi Anda</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeAccounts.map(a => (
                    <div key={a.id} className="sharia-card rounded-3xl p-6 text-white flex flex-col justify-between min-h-[180px] shadow-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-200">
                          Simpanan {a.accountType.toUpperCase()}
                        </span>
                        <span className="text-[10px] bg-emerald-900 bg-opacity-40 border border-emerald-500 rounded-full px-2 py-0.5 font-bold">
                          Syariah Patuh
                        </span>
                      </div>
                      <h4 className="text-2xl font-black mt-4">
                        Rp {a.balance.toLocaleString('id-ID')}
                      </h4>
                      <div className="flex justify-between items-end mt-4 pt-2 border-t border-emerald-800 text-[10px] text-emerald-200">
                        <span>{currentUser.name}</span>
                        <span>{a.id}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Simulated Deposit & Withdrawal forms side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  {/* Deposit Form */}
                  <form onSubmit={handleDeposit} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col gap-4">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Simulasi Setoran Mandiri</span>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <select 
                          value={depositType} 
                          onChange={(e) => setDepositType(e.target.value as any)}
                          className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl p-2.5 outline-none w-1/2"
                        >
                          <option value="wadiah">Wadiah (Titipan)</option>
                          <option value="mudharabah">Mudharabah (Investasi)</option>
                        </select>
                        <select 
                          value={depositMethod} 
                          onChange={(e) => setDepositMethod(e.target.value as any)}
                          className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl p-2.5 outline-none w-1/2"
                        >
                          <option value="tunai">Kas Tunai</option>
                          <option value="virtual_account">Virtual Account</option>
                        </select>
                      </div>
                      <input 
                        type="number" 
                        placeholder="Jumlah Setoran (Rp)" 
                        value={depositAmount} 
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl p-2.5 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <button type="submit" className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs py-3 rounded-xl transition shadow-md">
                      Setor {depositMethod === 'virtual_account' ? 'via VA Gateway' : 'Tunai'} Ke Rekening
                    </button>
                  </form>

                  {/* Withdrawal Form */}
                  <form onSubmit={handleWithdrawal} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col gap-4">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Simulasi Penarikan Mandiri</span>
                    <div className="flex gap-2">
                      <select 
                        value={withdrawType} 
                        onChange={(e) => setWithdrawType(e.target.value as any)}
                        className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl p-2.5 outline-none"
                      >
                        <option value="wadiah">Wadiah (Titipan)</option>
                        <option value="mudharabah">Mudharabah (Investasi)</option>
                      </select>
                      <input 
                        type="number" 
                        placeholder="Jumlah Penarikan (Rp)" 
                        value={withdrawAmount} 
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl p-2.5 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <button type="submit" className="bg-amber-700 hover:bg-amber-900 text-white font-bold text-xs py-3 rounded-xl transition shadow-md">
                      Tarik Dana Dari Rekening
                    </button>
                  </form>
                </div>

                {/* Simulated PPOB Card */}
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col gap-4 mt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Simulasi Pembelian PPOB Syariah (VA/Biller)</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Fee Rp 2.500</span>
                  </div>
                  <form onSubmit={handlePPOBSubmit} className="flex flex-col sm:flex-row gap-2 items-end">
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400">Jenis Layanan</label>
                        <select 
                          value={ppobType} 
                          onChange={(e) => setPpobType(e.target.value as any)}
                          className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl p-2.5 outline-none"
                        >
                          <option value="listrik">Listrik PLN (Token)</option>
                          <option value="pulsa">Pulsa Seluler</option>
                          <option value="air">Air PDAM Syariah</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400">No. Pelanggan / HP</label>
                        <input 
                          type="text" 
                          placeholder="misal: 12109823476"
                          value={ppobCustomerNo} 
                          onChange={(e) => setPpobCustomerNo(e.target.value)}
                          className="bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-2.5 outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400">Nominal Tagihan / Pulsa</label>
                        <select 
                          value={ppobAmount} 
                          onChange={(e) => setPpobAmount(e.target.value)}
                          className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl p-2.5 outline-none"
                        >
                          <option value="20000">Rp 20.000</option>
                          <option value="50000">Rp 50.000</option>
                          <option value="100000">Rp 100.000</option>
                          <option value="200000">Rp 200.000</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="bg-blue-800 hover:bg-blue-950 text-white font-bold text-xs py-3 px-6 rounded-xl transition shadow-md w-full sm:w-auto h-[41px]">
                      Beli & Debet Wadiah
                    </button>
                  </form>
                  <p className="text-[10px] text-slate-400 font-medium">
                    *Membeli PPOB akan memotong saldo Wadiah Anda sebesar nominal + fee Rp 2.500. Margin fee dicatat otomatis ke Buku Besar COA 401.
                  </p>
                </div>
              </div>

              {/* Financing Center (Kalkulator & Application) */}
              <div className="glass-panel rounded-3xl p-6">
                <h2 className="text-lg font-extrabold text-slate-800 mb-6">Ajukan Pembiayaan Syariah Baru</h2>
                
                <form onSubmit={handleApplyFinancing} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Input Fields */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Pilih Jenis Akad Pembiayaan</label>
                      <select 
                        value={finType} 
                        onChange={(e) => setFinType(e.target.value as any)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl p-3 outline-none"
                      >
                        <option value="murabahah">Murabahah (Jual Beli Barang)</option>
                        <option value="qard">Qardhul Hasan (Sosial / Bebas Margin)</option>
                      </select>
                    </div>

                    {finType === 'murabahah' && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase">Nama Barang yang Dibelikan Koperasi</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: Laptop Kerja, Motor Matic" 
                          value={finItem} 
                          onChange={(e) => setFinItem(e.target.value)}
                          className="bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl p-3 outline-none focus:border-emerald-500"
                          required={finType === 'murabahah'}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase">Nominal Pokok (Rp)</label>
                        <input 
                          type="number" 
                          placeholder="Nominal" 
                          value={finPrincipal} 
                          onChange={(e) => setFinPrincipal(e.target.value)}
                          className="bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl p-3 outline-none focus:border-emerald-500"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase">Tenor Angsuran</label>
                        <select 
                          value={finPeriod} 
                          onChange={(e) => setFinPeriod(e.target.value)}
                          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl p-3 outline-none"
                        >
                          <option value="3">3 Bulan</option>
                          <option value="6">6 Bulan</option>
                          <option value="12">12 Bulan</option>
                          <option value="24">24 Bulan</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Sharia Pricing Calculator Preview */}
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between gap-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Rincian Kalkulator Akad</span>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs py-1 border-b border-slate-200">
                        <span className="text-slate-500">Harga Perolehan Pokok</span>
                        <span className="font-semibold text-slate-800">Rp {(parseFloat(finPrincipal) || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-xs py-1 border-b border-slate-200">
                        <span className="text-slate-500">Margin Koperasi ({finType === 'qard' ? '0%' : '10%'})</span>
                        <span className="font-semibold text-emerald-700">Rp {finMargin.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-slate-200 font-bold">
                        <span className="text-slate-700">Total Harga Jual Akhir</span>
                        <span className="text-slate-800">Rp {((parseFloat(finPrincipal) || 0) + finMargin).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-slate-500">Angsuran / Bulan</span>
                        <span className="font-extrabold text-emerald-800">Rp {Math.floor(finCalculatedInstallment).toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs py-3 rounded-xl transition shadow-md mt-auto">
                      Ajukan Akad Pembiayaan Syariah
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Installments Ledger */}
              <div className="glass-panel rounded-3xl p-6">
                <h2 className="text-lg font-extrabold text-slate-800 mb-6">Histori Pembiayaan & Angsuran Aktif</h2>
                {activeContracts.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold italic text-center py-4 bg-slate-50 rounded-2xl">
                    Anda tidak memiliki kontrak pembiayaan syariah aktif saat ini.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {activeContracts.map(c => {
                      const totalOriginal = c.principalAmount + c.marginAmount;
                      const monthlyPayment = totalOriginal / c.installmentPeriod;
                      return (
                        <div key={c.id} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase text-slate-800">
                                {c.contractType.toUpperCase()} - {c.itemName || 'Qardhul Hasan'}
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                c.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                c.status === 'paid_off' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {c.status.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">ID Kontrak: {c.id}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-6 text-center">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-400 uppercase font-bold">Total Nilai</span>
                              <span className="text-xs font-bold text-slate-700">Rp {totalOriginal.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-400 uppercase font-bold">Sisa Tagihan</span>
                              <span className="text-xs font-bold text-amber-700">Rp {c.remainingBalance.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-400 uppercase font-bold">Angsuran</span>
                              <span className="text-xs font-bold text-slate-700">{c.installmentsPaid} / {c.installmentPeriod}</span>
                            </div>
                          </div>

                          {c.status === 'active' && c.remainingBalance > 0 && (
                            <button 
                              onClick={() => handlePayInstallment(c.id, monthlyPayment)}
                              className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-[10px] px-4 py-2.5 rounded-xl transition shadow"
                            >
                              Bayar Angsuran (Rp {Math.floor(monthlyPayment).toLocaleString('id-ID')})
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* C. TAKMIR & DPS MAKER-CHECKER VIEWS */}
          {(currentUser?.role === 'takmir' || currentUser?.role === 'dps') && (
            <div className="flex flex-col gap-8 animate-slide-up">
              
              {/* Member KYC list (Takmir verified, DPS views) */}
              <div className="glass-panel rounded-3xl p-6">
                <h2 className="text-lg font-extrabold text-slate-800 mb-6">Verifikasi KYC & Identitas Anggota</h2>
                <div className="flex flex-col gap-4">
                  {members.map(m => (
                    <div key={m.id} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-sm font-bold text-slate-800">{m.fullName}</h4>
                        <span className="text-xs text-slate-400 font-medium">NIK: {m.nik} | Telp: {m.phone}</span>
                        <span className="text-xs text-slate-500 font-medium italic mt-1">Alamat: {m.address}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          m.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                          m.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {m.status.toUpperCase()}
                        </span>

                        {m.status === 'pending' && currentUser.role === 'takmir' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleKYCApproval(m.id, 'verified')}
                              className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-[10px] px-3 py-2 rounded-xl transition shadow"
                            >
                              Setujui KYC
                            </button>
                            <button 
                              onClick={() => handleKYCApproval(m.id, 'rejected')}
                              className="bg-red-700 hover:bg-red-900 text-white font-bold text-[10px] px-3 py-2 rounded-xl transition shadow"
                            >
                              Tolak
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maker-Checker Financing Approval workflow */}
              <div className="glass-panel rounded-3xl p-6">
                <h2 className="text-lg font-extrabold text-slate-800 mb-6">Persetujuan Pembiayaan Syariah (Maker-Checker Hub)</h2>
                {contracts.filter(c => c.status !== 'paid_off' && c.status !== 'rejected').length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold italic text-center py-4 bg-slate-50 rounded-2xl">
                    Tidak ada pengajuan pembiayaan syariah aktif saat ini.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {contracts.filter(c => c.status !== 'paid_off' && c.status !== 'rejected').map(c => {
                      const totalSum = c.principalAmount + c.marginAmount;
                      const memberObj = members.find(m => m.id === c.memberId);
                      return (
                        <div key={c.id} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase text-slate-800">
                              {c.contractType.toUpperCase()} - {c.itemName || 'Qardhul Hasan'}
                            </span>
                            <span className="text-xs text-slate-500 font-semibold">Diajukan oleh: {memberObj?.fullName || 'Anggota'}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400 font-medium">ID: {c.id}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                c.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {c.status.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-6 text-center">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-400 uppercase font-bold">Pokok Akad</span>
                              <span className="text-xs font-bold text-slate-700">Rp {c.principalAmount.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-400 uppercase font-bold">Total Margin</span>
                              <span className="text-xs font-bold text-emerald-700">Rp {c.marginAmount.toLocaleString('id-ID')}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Takmir (Maker) Approval stage */}
                            {c.status === 'draft' && currentUser.role === 'takmir' && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleVerificationFlow(c.id, 'verify')}
                                  className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-[10px] px-3.5 py-2.5 rounded-xl transition shadow"
                                >
                                  Verifikasi Akad (Maker)
                                </button>
                                <button 
                                  onClick={() => handleVerificationFlow(c.id, 'reject')}
                                  className="bg-red-700 hover:bg-red-900 text-white font-bold text-[10px] px-3.5 py-2.5 rounded-xl transition shadow"
                                >
                                  Tolak
                                </button>
                              </div>
                            )}

                            {/* DPS (Checker) Final Approval stage */}
                            {c.status === 'verified_by_takmir' && currentUser.role === 'dps' && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleVerificationFlow(c.id, 'approve')}
                                  className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-[10px] px-3.5 py-2.5 rounded-xl transition shadow"
                                >
                                  Setujui & Cairkan (Checker)
                                </button>
                                <button 
                                  onClick={() => handleVerificationFlow(c.id, 'reject')}
                                  className="bg-red-700 hover:bg-red-900 text-white font-bold text-[10px] px-3.5 py-2.5 rounded-xl transition shadow"
                                >
                                  Tolak
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* D. ADMIN PORTAL VIEWS */}
          {currentUser?.role === 'admin' && (
            <div className="flex flex-col gap-8 animate-slide-up">
              
              {/* Nisbah Trigger & Expense Form side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Nisbah monthly distributor */}
                <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 mb-2">Bagi Hasil Nisbah Mudharabah</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Menghitung realisasi profit bulanan koperasi (Revenues - Expenses) dan mendistribusikan porsi bagi hasil 40% secara proposional ke seluruh saldo akun Mudharabah anggota.
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Laba Bersih Koperasi Tersedia</span>
                    <span className="text-lg font-black text-emerald-800">Rp {phu.labaBersih.toLocaleString('id-ID')}</span>
                  </div>

                  <button 
                    onClick={handleNisbahExecution}
                    className="w-full bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-md"
                  >
                    Eksekusi Bagi Hasil Bulanan (Nisbah)
                  </button>
                </div>

                {/* Expense input Form */}
                <form onSubmit={handleExpenseSubmit} className="glass-panel rounded-3xl p-6 flex flex-col justify-between gap-4">
                  <h3 className="text-base font-extrabold text-slate-800 mb-1">Catat Beban Operasional Kantor</h3>
                  
                  <div className="flex flex-col gap-3">
                    <input 
                      type="number" 
                      placeholder="Nominal Biaya (Rp)" 
                      value={expenseAmount} 
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl p-3 outline-none focus:border-emerald-500"
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Keterangan Beban (misal: Sewa Listrik, Gaji Staf)" 
                      value={expenseDesc} 
                      onChange={(e) => setExpenseDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl p-3 outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <button type="submit" className="w-full bg-amber-700 hover:bg-amber-950 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-md">
                    Bayar & Catat Beban Kas
                  </button>
                </form>
              </div>

              {/* Direct Relational General Ledger Entries */}
              <div className="glass-panel rounded-3xl p-6">
                <h2 className="text-lg font-extrabold text-slate-800 mb-6">Jurnal Buku Besar Umum (*Double-entry Ledger*)</h2>
                <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">COA</th>
                        <th className="p-3">Keterangan Jurnal</th>
                        <th className="p-3 text-right">Debet</th>
                        <th className="p-3 text-right">Kredit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journals.map((j, idx) => (
                        <tr key={j.id || idx} className="border-b border-slate-50 hover:bg-slate-50 font-medium">
                          <td className="p-3 text-slate-400">{new Date(j.createdAt).toLocaleDateString('id-ID')}</td>
                          <td className="p-3 font-semibold text-slate-700">{j.codeCoa}</td>
                          <td className="p-3 text-slate-600">{j.description}</td>
                          <td className="p-3 text-right font-semibold text-slate-700">{j.debit > 0 ? `Rp ${j.debit.toLocaleString('id-ID')}` : '-'}</td>
                          <td className="p-3 text-right font-semibold text-slate-700">{j.credit > 0 ? `Rp ${j.credit.toLocaleString('id-ID')}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (occupies 1/3 of grid space) */}
        <div className="flex flex-col gap-8">
          
          {/* Mosque compliance / info card */}
          <div className="glass-panel rounded-3xl p-6 bg-gradient-to-br from-emerald-950 to-emerald-900 text-emerald-100">
            <h3 className="text-base font-extrabold mb-3">🕌 Status Kepatuhan Syariah (KSD)</h3>
            <p className="text-xs text-emerald-200 leading-relaxed font-medium mb-6">
              Koperasi Simpan Pinjam Syariah didirikan secara terintegrasi dengan Dewan Pengawas Syariah (DPS) untuk menjaga keabsahan transaksi.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-emerald-900 bg-opacity-45 p-3 rounded-2xl border border-emerald-800">
                <span className="text-emerald-400 font-extrabold text-sm">Fatwa 02</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white">Akad Murabahah</span>
                  <span className="text-[9px] text-emerald-300">Harga Jual Jelas & Dikunci</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-900 bg-opacity-45 p-3 rounded-2xl border border-emerald-800">
                <span className="text-emerald-400 font-extrabold text-sm">Fatwa 19</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white">Akad Qardhul Hasan</span>
                  <span className="text-[9px] text-emerald-300">Pinjaman Sosial 0% Riba</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-900 bg-opacity-45 p-3 rounded-2xl border border-emerald-800">
                <span className="text-emerald-400 font-extrabold text-sm">Fatwa 07</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white">Akad Mudharabah</span>
                  <span className="text-[9px] text-emerald-300">Bagi Hasil Nisbah Proporsional</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit trail logging history */}
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-base font-extrabold text-slate-800 mb-4">Jejak Audit Aktivitas (Audit Trail)</h3>
            <div className="max-h-[320px] overflow-y-auto flex flex-col gap-3">
              {auditLogs.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-semibold italic text-center py-4 bg-slate-50 rounded-xl">
                  Belum ada log aktivitas operasional tercatat.
                </p>
              ) : (
                auditLogs.map(log => (
                  <div key={log.id} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex flex-col gap-1 text-[10px]">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700">{log.action.replace(/_/g, ' ')}</span>
                      <span className="text-slate-400">{new Date(log.createdAt).toLocaleTimeString('id-ID')}</span>
                    </div>
                    <span className="text-slate-500 font-medium">User: {log.userId} | Tabel: {log.targetTable}</span>
                    <span className="text-slate-400 font-medium">IP: {log.ipAddress}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. SHARIA AI ASSISTANT CHATBOT FLOATING MODULE */}
      <div className="fixed bottom-6 right-6 z-50">
        
        {/* Toggle Chat button */}
        <button 
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-emerald-800 hover:bg-emerald-950 text-white rounded-full p-4.5 shadow-2xl transition-transform hover:scale-105 outline-none flex items-center justify-center border border-emerald-700 cursor-pointer"
        >
          {chatOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6 animate-pulse-subtle">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
              <span className="text-xs font-black pr-1">Asisten Syariah AI</span>
            </div>
          )}
        </button>

        {/* Chat Window Panel */}
        {chatOpen && (
          <div className="absolute bottom-16 right-0 w-[350px] md:w-[400px] h-[500px] glass-panel rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-emerald-600 bg-white">
            
            {/* Chat header */}
            <div className="bg-gradient-to-r from-emerald-950 to-emerald-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white p-1.5 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l3.594-4.493m0 0a.75.75 0 0 1 1.08-.09l4.57 3.828a.75.75 0 0 0 1.223-.564V3.75c0-.621-.504-1.125-1.125-1.125h-15a1.125 1.125 0 0 0-1.125 1.125v12.75c0 .621.504 1.125 1.125 1.125h11.233z" />
                  </svg>
                </span>
                <div>
                  <h4 className="text-xs font-black">Asisten Syariah IQ-RA</h4>
                  <span className="text-[9px] text-emerald-300 font-medium">Bimbingan Fatwa DSN-MUI Real-Time</span>
                </div>
              </div>
              <span className="bg-emerald-800 text-emerald-300 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                RAG Pipeline Active
              </span>
            </div>

            {/* Chat body containing history */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50">
              {chatHistory.map((chat, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[80%] ${chat.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                >
                  <div 
                    className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                      chat.sender === 'user' 
                        ? 'bg-emerald-800 text-white rounded-br-none' 
                        : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                    }`}
                  >
                    {/* Render simple formatting for markdown bolding/bullets locally */}
                    {chat.text.split('\n').map((line, lIdx) => {
                      let processed = line;
                      // Replace **bold** with actual React elements or bold text
                      const parts = processed.split('**');
                      return (
                        <p key={lIdx} className={line.startsWith('*') ? 'pl-2 py-0.5' : 'py-0.5'}>
                          {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-extrabold text-emerald-950 dark:text-emerald-400">{part}</strong> : part)}
                        </p>
                      );
                    })}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="mr-auto items-start max-w-[80%] flex flex-col gap-1">
                  <div className="bg-white border border-slate-100 text-slate-500 rounded-2xl rounded-bl-none p-3 text-xs font-semibold shadow-sm animate-pulse">
                    Mencari fragmen Fatwa DSN-MUI dan menyintesis jawaban...
                  </div>
                </div>
              )}
            </div>

            {/* Suggestion Chips Panel */}
            <div className="px-4 py-2 bg-slate-100 flex gap-2 overflow-x-auto border-t border-slate-200 scrollbar-none whitespace-nowrap">
              <button 
                onClick={() => handleSendMessage("Bagaimana ketentuan akad Murabahah?")}
                className="text-[9px] font-bold bg-white text-emerald-800 border border-emerald-100 px-3 py-1.5 rounded-full transition shadow-sm hover:bg-emerald-50 cursor-pointer"
              >
                Akad Murabahah Fatwa No. 02
              </button>
              <button 
                onClick={() => handleSendMessage("Jelaskan akad Qardhul Hasan")}
                className="text-[9px] font-bold bg-white text-emerald-800 border border-emerald-100 px-3 py-1.5 rounded-full transition shadow-sm hover:bg-emerald-50 cursor-pointer"
              >
                Qardhul Hasan Fatwa No. 19
              </button>
              <button 
                onClick={() => handleSendMessage("Bagi hasil Mudharabah")}
                className="text-[9px] font-bold bg-white text-emerald-800 border border-emerald-100 px-3 py-1.5 rounded-full transition shadow-sm hover:bg-emerald-50 cursor-pointer"
              >
                Nisbah Mudharabah Fatwa No. 07
              </button>
            </div>

            {/* Chat footer input bar */}
            <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
              <input 
                type="text" 
                placeholder="Tanyakan fatwa atau akad syariah..." 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-2.5 outline-none focus:border-emerald-500"
                disabled={chatLoading}
              />
              <button 
                onClick={() => handleSendMessage()}
                className="bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl p-2.5 outline-none transition shadow cursor-pointer flex items-center justify-center"
                disabled={chatLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </div>

          </div>
        )}
      </div>

    </main>
  );
}
