// Koperasi Syariah Digital (KSD) - Mock Database & SAK EP Ledger Service
// File: src/services/db.ts

import { supabase } from './supabaseClient';

export type Role = 'jamaah' | 'takmir' | 'dps' | 'admin';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export interface Member {
  id: string;
  userId: string;
  fullName: string;
  nik: string;
  address: string;
  phone: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export interface Account {
  id: string;
  memberId: string;
  accountType: 'pokok' | 'wajib' | 'wadiah' | 'mudharabah';
  balance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  transactionType: 'deposit' | 'withdrawal';
  amount: number;
  referenceNumber: string;
  createdAt: string;
}

export interface FinancingContract {
  id: string;
  memberId: string;
  contractType: 'murabahah' | 'qard';
  principalAmount: number;
  marginAmount: number; // 0 for Qard
  installmentPeriod: number; // months
  remainingBalance: number;
  installmentsPaid: number;
  status: 'draft' | 'verified_by_takmir' | 'approved_by_dps' | 'active' | 'paid_off' | 'rejected';
  itemName?: string; // only for Murabahah
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  transactionId: string; // references transaction or financing
  codeCoa: string; // 101, 102, 201, 202, 301, 401, 501
  debit: number;
  credit: number;
  description: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetTable: string;
  ipAddress: string;
  createdAt: string;
}

// -------------------------------------------------------------
// Default Mock Data Definition
// -------------------------------------------------------------

const DEFAULT_USERS: User[] = [
  { id: 'usr-1', email: 'ahmad@gmail.com', role: 'jamaah', name: 'Ahmad Rafiq' },
  { id: 'usr-2', email: 'hasan@gmail.com', role: 'jamaah', name: 'Hasan Basri' },
  { id: 'usr-3', email: 'takmir.masjid@gmail.com', role: 'takmir', name: 'Ustadz Sulaiman (Takmir)' },
  { id: 'usr-4', email: 'dps.sharia@gmail.com', role: 'dps', name: 'K.H. Ma\'ruf Amin (DPS)' },
  { id: 'usr-5', email: 'coop.manager@gmail.com', role: 'admin', name: 'Zulkifli Lubis (Admin)' }
];

const DEFAULT_MEMBERS: Member[] = [
  {
    id: 'mbr-1',
    userId: 'usr-1',
    fullName: 'Ahmad Rafiq',
    nik: '3273012345678901',
    address: 'Jl. Masjid Agung No. 12, Bandung',
    phone: '081234567890',
    status: 'verified',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'mbr-2',
    userId: 'usr-2',
    fullName: 'Hasan Basri',
    nik: '3273029876543210',
    address: 'Jl. Taqwa Raya No. 45, Bandung',
    phone: '089988776655',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  }
];

// Initial accounts for Ahmad (mbr-1)
const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc-1-pokok', memberId: 'mbr-1', accountType: 'pokok', balance: 500000, createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
  { id: 'acc-1-wajib', memberId: 'mbr-1', accountType: 'wajib', balance: 200000, createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
  { id: 'acc-1-wadiah', memberId: 'mbr-1', accountType: 'wadiah', balance: 1500000, createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
  { id: 'acc-1-mudharabah', memberId: 'mbr-1', accountType: 'mudharabah', balance: 5000000, createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() }
];

// -------------------------------------------------------------
// Database Ledger Controller (Local Storage / State Memory)
// -------------------------------------------------------------

class Database {
  private isClient = typeof window !== 'undefined';

  private get<T>(key: string, defaultValue: T): T {
    if (!this.isClient) return defaultValue;
    const value = localStorage.getItem(`ksd_${key}`);
    return value ? JSON.parse(value) : defaultValue;
  }

  private set<T>(key: string, value: T): void {
    if (this.isClient) {
      localStorage.setItem(`ksd_${key}`, JSON.stringify(value));
    }
  }

  public async loadSupabaseData(): Promise<boolean> {
    try {
      const { data: dbUsers, error: usersErr } = await supabase.from('users').select('*');
      if (!usersErr && dbUsers && dbUsers.length > 0) {
        this.set('users', dbUsers.map(u => ({
          id: u.id,
          email: u.email,
          role: u.role as any,
          name: u.email.split('@')[0].toUpperCase()
        })));
      }

      const { data: dbMembers, error: membersErr } = await supabase.from('members').select('*');
      if (!membersErr && dbMembers) {
        this.set('members', dbMembers.map(m => ({
          id: m.id,
          userId: m.user_id,
          fullName: m.full_name,
          nik: m.nik,
          address: m.address,
          phone: m.phone,
          status: m.status as any,
          createdAt: m.created_at
        })));
      }

      const { data: dbAccounts, error: accErr } = await supabase.from('accounts').select('*');
      if (!accErr && dbAccounts) {
        this.set('accounts', dbAccounts.map(a => ({
          id: a.id,
          memberId: a.member_id,
          accountType: a.account_type as any,
          balance: Number(a.balance),
          createdAt: a.created_at
        })));
      }

      const { data: dbTransactions, error: txErr } = await supabase.from('transactions').select('*');
      if (!txErr && dbTransactions) {
        this.set('transactions', dbTransactions.map(t => ({
          id: t.id,
          accountId: t.account_id,
          transactionType: t.transaction_type as any,
          amount: Number(t.amount),
          referenceNumber: t.reference_number,
          createdAt: t.created_at
        })));
      }

      const { data: dbContracts, error: cErr } = await supabase.from('financing_contracts').select('*');
      if (!cErr && dbContracts) {
        this.set('financing', dbContracts.map(c => ({
          id: c.id,
          memberId: c.member_id,
          contractType: c.contract_type as any,
          principalAmount: Number(c.principal_amount),
          marginAmount: Number(c.margin_amount),
          installmentPeriod: c.installment_period,
          remainingBalance: Number(c.remaining_balance),
          installmentsPaid: 0,
          status: c.status as any,
          itemName: c.item_details || '',
          createdAt: c.created_at
        })));
      }

      const { data: dbJournals, error: jErr } = await supabase.from('journal_entries').select('*');
      if (!jErr && dbJournals) {
        this.set('journals', dbJournals.map(j => ({
          id: j.id,
          transactionId: j.transaction_id || '',
          codeCoa: j.code_coa,
          debit: Number(j.debit),
          credit: Number(j.credit),
          description: j.description,
          createdAt: j.created_at
        })));
      }

      const { data: dbLogs, error: lErr } = await supabase.from('audit_logs').select('*');
      if (!lErr && dbLogs) {
        this.set('audit_logs', dbLogs.map(l => ({
          id: l.id,
          userId: l.user_id,
          action: l.action,
          targetTable: l.module,
          ipAddress: 'Supabase Cloud',
          createdAt: l.created_at
        })));
      }

      return true;
    } catch (e) {
      console.warn("Supabase fetch failed, fallback to local storage:", e);
      return false;
    }
  }

  public getUsers(): User[] {
    return this.get<User[]>('users', DEFAULT_USERS);
  }

  public getMembers(): Member[] {
    return this.get<Member[]>('members', DEFAULT_MEMBERS);
  }

  public getAccounts(): Account[] {
    return this.get<Account[]>('accounts', DEFAULT_ACCOUNTS);
  }

  public getTransactions(): Transaction[] {
    return this.get<Transaction[]>('transactions', []);
  }

  public getFinancingContracts(): FinancingContract[] {
    return this.get<FinancingContract[]>('financing', []);
  }

  public getJournalEntries(): JournalEntry[] {
    // Generate initial capital injection ledger to make standard balances look good
    const initialJournals: JournalEntry[] = [
      {
        id: 'j-init-1',
        transactionId: 't-init',
        codeCoa: '101', // Kas
        debit: 100000000, // Rp 100.000.000 Initial Cash Injection
        credit: 0,
        description: 'Setoran Modal Pendirian Koperasi KSD',
        createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'j-init-2',
        transactionId: 't-init',
        codeCoa: '301', // Modal Koperasi
        debit: 0,
        credit: 100000000,
        description: 'Setoran Modal Pendirian Koperasi KSD',
        createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString()
      },
      // Accounts for mbr-1 (Ahmad) balances
      {
        id: 'j-init-mbr1-1',
        transactionId: 't-mbr1-pokok',
        codeCoa: '101',
        debit: 500000 + 200000 + 1500000 + 5000000, // Pokok + Wajib + Wadiah + Mudharabah
        credit: 0,
        description: 'Setoran Awal Keanggotaan Ahmad Rafiq (mbr-1)',
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'j-init-mbr1-2',
        transactionId: 't-mbr1-pokok',
        codeCoa: '301', // Pokok/Wajib Modal
        debit: 0,
        credit: 500000 + 200000,
        description: 'Simpanan Pokok & Wajib Ahmad Rafiq (mbr-1)',
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'j-init-mbr1-3',
        transactionId: 't-mbr1-wadiah',
        codeCoa: '201', // Wadiah Liability
        debit: 0,
        credit: 1500000,
        description: 'Simpanan Wadiah Ahmad Rafiq (mbr-1)',
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'j-init-mbr1-4',
        transactionId: 't-mbr1-mudharabah',
        codeCoa: '202', // Mudharabah Liability
        debit: 0,
        credit: 5000000,
        description: 'Simpanan Mudharabah Ahmad Rafiq (mbr-1)',
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      }
    ];
    return this.get<JournalEntry[]>('journals', initialJournals);
  }

  public getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>('audit_logs', []);
  }

  // -------------------------------------------------------------
  // Data Mutation Methods
  // -------------------------------------------------------------

  public logAudit(userId: string, action: string, targetTable: string): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      targetTable,
      ipAddress: '127.0.0.1 (Local Simulation)',
      createdAt: new Date().toISOString()
    };
    logs.unshift(newLog); // Show most recent first
    this.set('audit_logs', logs);
  }

  public updateMemberStatus(memberId: string, status: 'verified' | 'rejected', adminUserId: string): void {
    const members = this.getMembers();
    const idx = members.findIndex(m => m.id === memberId);
    if (idx !== -1) {
      members[idx].status = status;
      this.set('members', members);

      // If verified, initialize their 4 types of standard accounts automatically
      if (status === 'verified') {
        const accounts = this.getAccounts();
        const accountTypes: Array<'pokok' | 'wajib' | 'wadiah' | 'mudharabah'> = ['pokok', 'wajib', 'wadiah', 'mudharabah'];
        
        accountTypes.forEach(type => {
          const newAccount: Account = {
            id: `acc-${memberId}-${type}`,
            memberId: memberId,
            accountType: type,
            balance: 0,
            createdAt: new Date().toISOString()
          };
          accounts.push(newAccount);
        });
        
        this.set('accounts', accounts);
      }

      this.logAudit(adminUserId, `KYC_VERIFICATION_${status.toUpperCase()}`, 'members');
    }
  }

  public createTransaction(
    accountId: string, 
    type: 'deposit' | 'withdrawal', 
    amount: number, 
    userId: string,
    paymentMethod: 'tunai' | 'virtual_account' = 'tunai'
  ): boolean {
    const accounts = this.getAccounts();
    const accIdx = accounts.findIndex(a => a.id === accountId);
    if (accIdx === -1) return false;

    const account = accounts[accIdx];
    
    // Balance check for withdrawals
    if (type === 'withdrawal' && account.balance < amount) {
      return false;
    }

    // Update account balance
    if (type === 'deposit') {
      account.balance += amount;
    } else {
      account.balance -= amount;
    }
    this.set('accounts', accounts);

    // Save transaction
    const transactions = this.getTransactions();
    const txId = `tx-${Math.random().toString(36).substr(2, 9)}`;
    const newTx: Transaction = {
      id: txId,
      accountId,
      transactionType: type,
      amount,
      referenceNumber: `${paymentMethod === 'virtual_account' ? 'VA' : 'REF'}-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString()
    };
    transactions.push(newTx);
    this.set('transactions', transactions);

    // Write standard double-entry journal logs
    const journals = this.getJournalEntries();
    const journalIdBase = `j-${txId}`;
    
    let targetCoa = '201'; // Default: Wadiah Savings Liability
    if (account.accountType === 'mudharabah') targetCoa = '202';
    else if (account.accountType === 'pokok' || account.accountType === 'wajib') targetCoa = '301'; // Equity Capital

    const methodDesc = paymentMethod === 'virtual_account' ? 'via Virtual Account Gateway' : 'Tunai';

    if (type === 'deposit') {
      // Debit: Kas (101), Credit: Simpanan / Modal (201/202/301)
      journals.push({
        id: `${journalIdBase}-debit`,
        transactionId: txId,
        codeCoa: '101',
        debit: amount,
        credit: 0,
        description: `Setoran Tabungan ${account.accountType.toUpperCase()} ${methodDesc} - Account ID ${accountId}`,
        createdAt: new Date().toISOString()
      });
      journals.push({
        id: `${journalIdBase}-credit`,
        transactionId: txId,
        codeCoa: targetCoa,
        debit: 0,
        credit: amount,
        description: `Setoran Tabungan ${account.accountType.toUpperCase()} ${methodDesc} - Account ID ${accountId}`,
        createdAt: new Date().toISOString()
      });
    } else {
      // Debit: Simpanan (201/202), Credit: Kas (101)
      journals.push({
        id: `${journalIdBase}-debit`,
        transactionId: txId,
        codeCoa: targetCoa,
        debit: amount,
        credit: 0,
        description: `Penarikan Tabungan ${account.accountType.toUpperCase()} ${methodDesc} - Account ID ${accountId}`,
        createdAt: new Date().toISOString()
      });
      journals.push({
        id: `${journalIdBase}-credit`,
        transactionId: txId,
        codeCoa: '101',
        debit: 0,
        credit: amount,
        description: `Penarikan Tabungan ${account.accountType.toUpperCase()} ${methodDesc} - Account ID ${accountId}`,
        createdAt: new Date().toISOString()
      });
    }

    this.set('journals', journals);
    this.logAudit(userId, `SAVINGS_${type.toUpperCase()}_AMOUNT_${amount}_METODE_${paymentMethod.toUpperCase()}`, 'transactions');
    return true;
  }

  public createPPOBTransaction(
    memberId: string,
    accountId: string,
    ppobType: 'listrik' | 'pulsa' | 'air',
    customerNo: string,
    amount: number,
    fee: number,
    userId: string
  ): boolean {
    const accounts = this.getAccounts();
    const accIdx = accounts.findIndex(a => a.id === accountId);
    if (accIdx === -1) return false;

    const account = accounts[accIdx];
    const totalDeducted = amount + fee;

    // Balance check
    if (account.balance < totalDeducted) {
      return false;
    }

    // Deduct total balance
    account.balance -= totalDeducted;
    this.set('accounts', accounts);

    // Save transaction
    const transactions = this.getTransactions();
    const txId = `ppob-${Math.random().toString(36).substr(2, 9)}`;
    const newTx: Transaction = {
      id: txId,
      accountId,
      transactionType: 'withdrawal',
      amount: totalDeducted,
      referenceNumber: `PPOB-${ppobType.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString()
    };
    transactions.push(newTx);
    this.set('transactions', transactions);

    // Write Journal entry:
    // Debit: Simpanan Wadiah (201) / Mudharabah (202) - Rp amount + fee
    // Credit: Kas (101) - Rp amount (Cost to provider)
    // Credit: Pendapatan Margin/Fee Koperasi (401) - Rp fee (Revenue gain!)
    const journals = this.getJournalEntries();
    let targetCoa = '201';
    if (account.accountType === 'mudharabah') targetCoa = '202';
    else if (account.accountType === 'pokok' || account.accountType === 'wajib') targetCoa = '301';

    journals.push({
      id: `j-${txId}-debit-savings`,
      transactionId: txId,
      codeCoa: targetCoa,
      debit: totalDeducted,
      credit: 0,
      description: `Pembelian PPOB ${ppobType.toUpperCase()} (ID: ${customerNo}) oleh Anggota`,
      createdAt: new Date().toISOString()
    });

    journals.push({
      id: `j-${txId}-credit-kas`,
      transactionId: txId,
      codeCoa: '101',
      debit: 0,
      credit: amount,
      description: `Pembayaran Kas ke Provider PPOB ${ppobType.toUpperCase()} (ID: ${customerNo})`,
      createdAt: new Date().toISOString()
    });

    journals.push({
      id: `j-${txId}-credit-fee`,
      transactionId: txId,
      codeCoa: '401',
      debit: 0,
      credit: fee,
      description: `Pendapatan Admin Fee Layanan PPOB ${ppobType.toUpperCase()}`,
      createdAt: new Date().toISOString()
    });

    this.set('journals', journals);
    this.logAudit(userId, `PPOB_PURCHASE_${ppobType.toUpperCase()}_TOTAL_${totalDeducted}_CUSTOMER_${customerNo}`, 'transactions');
    return true;
  }

  public applyFinancing(
    memberId: string, 
    type: 'murabahah' | 'qard', 
    principal: number, 
    margin: number, 
    period: number, 
    itemName?: string
  ): FinancingContract {
    const contracts = this.getFinancingContracts();
    const newContract: FinancingContract = {
      id: `fc-${Math.random().toString(36).substr(2, 9)}`,
      memberId,
      contractType: type,
      principalAmount: principal,
      marginAmount: type === 'qard' ? 0 : margin,
      installmentPeriod: period,
      remainingBalance: principal + (type === 'qard' ? 0 : margin),
      installmentsPaid: 0,
      status: 'draft',
      itemName: type === 'murabahah' ? (itemName || 'Barang Serbaguna') : undefined,
      createdAt: new Date().toISOString()
    };
    contracts.push(newContract);
    this.set('financing', contracts);
    return newContract;
  }

  public updateFinancingStatus(
    contractId: string, 
    status: 'verified_by_takmir' | 'approved_by_dps' | 'rejected', 
    userId: string
  ): void {
    const contracts = this.getFinancingContracts();
    const idx = contracts.findIndex(c => c.id === contractId);
    if (idx === -1) return;

    const contract = contracts[idx];
    contract.status = status;
    this.set('financing', contracts);

    // If fully approved by DPS, disburse the financing and create double-entry journal entries!
    if (status === 'approved_by_dps') {
      contract.status = 'active';
      this.set('financing', contracts);

      // Increase member savings balance with disbursed principal
      const accounts = this.getAccounts();
      const wadiahAccIdx = accounts.findIndex(a => a.memberId === contract.memberId && a.accountType === 'wadiah');
      
      if (wadiahAccIdx !== -1) {
        accounts[wadiahAccIdx].balance += contract.principalAmount;
        this.set('accounts', accounts);
      }

      // Write double-entry journal entries
      const journals = this.getJournalEntries();
      const totalReceivable = contract.principalAmount + contract.marginAmount;

      if (contract.contractType === 'murabahah') {
        // Journal 1: Pembentukan Piutang Pembiayaan Murabahah
        // Debit: Piutang Murabahah (102) - Total Selling Price (Principal + Margin)
        // Credit: Kas & Setara Kas (101) - Purchase / Disbursement Cost
        // Credit: Pendapatan Margin Ditangguhkan / Margin Murabahah (401) - Margin Gain
        journals.push({
          id: `j-disb-${contractId}-debit-piutang`,
          transactionId: contractId,
          codeCoa: '102',
          debit: totalReceivable,
          credit: 0,
          description: `Pembentukan Piutang Pembiayaan Murabahah - Contract ID ${contractId}`,
          createdAt: new Date().toISOString()
        });
        journals.push({
          id: `j-disb-${contractId}-credit-kas`,
          transactionId: contractId,
          codeCoa: '101',
          debit: 0,
          credit: contract.principalAmount,
          description: `Pencairan Dana Pembiayaan Murabahah ke Kas Anggota`,
          createdAt: new Date().toISOString()
        });
        journals.push({
          id: `j-disb-${contractId}-credit-margin`,
          transactionId: contractId,
          codeCoa: '401',
          debit: 0,
          credit: contract.marginAmount,
          description: `Margin Keuntungan Pembiayaan Murabahah Ditangguhkan`,
          createdAt: new Date().toISOString()
        });
      } else {
        // Qardhul Hasan (Interest-free loan)
        // Debit: Piutang Murabahah / Lainnya (102) - Pokok Qard
        // Credit: Kas (101) - Pokok Qard
        journals.push({
          id: `j-disb-${contractId}-debit-qard`,
          transactionId: contractId,
          codeCoa: '102',
          debit: contract.principalAmount,
          credit: 0,
          description: `Penyaluran Piutang Qardhul Hasan - Contract ID ${contractId}`,
          createdAt: new Date().toISOString()
        });
        journals.push({
          id: `j-disb-${contractId}-credit-qard-kas`,
          transactionId: contractId,
          codeCoa: '101',
          debit: 0,
          credit: contract.principalAmount,
          description: `Pencairan Pinjaman Kebajikan Qardhul Hasan`,
          createdAt: new Date().toISOString()
        });
      }

      this.set('journals', journals);
    }

    this.logAudit(userId, `FINANCING_APPROVAL_STATUS_${status.toUpperCase()}_CONTRACT_${contractId}`, 'financing');
  }

  public payInstallment(contractId: string, amount: number, userId: string): boolean {
    const contracts = this.getFinancingContracts();
    const idx = contracts.findIndex(c => c.id === contractId);
    if (idx === -1) return false;

    const contract = contracts[idx];
    if (contract.remainingBalance <= 0 || contract.status !== 'active') return false;

    // Deduct remaining balance
    contract.remainingBalance = Math.max(0, contract.remainingBalance - amount);
    contract.installmentsPaid += 1;

    if (contract.remainingBalance <= 0) {
      contract.status = 'paid_off';
    }
    this.set('financing', contracts);

    // Write Journal entry:
    // Debit: Kas (101) - Rp Amount Paid
    // Credit: Piutang Murabahah / Pembiayaan (102) - Rp Amount Paid
    const journals = this.getJournalEntries();
    const payTxId = `pay-${contractId}-${contract.installmentsPaid}`;

    journals.push({
      id: `j-pay-${payTxId}-debit`,
      transactionId: payTxId,
      codeCoa: '101',
      debit: amount,
      credit: 0,
      description: `Penerimaan Angsuran Ke-${contract.installmentsPaid} Pembiayaan ${contract.contractType.toUpperCase()}`,
      createdAt: new Date().toISOString()
    });

    journals.push({
      id: `j-pay-${payTxId}-credit`,
      transactionId: payTxId,
      codeCoa: '102',
      debit: 0,
      credit: amount,
      description: `Pengurangan Piutang Angsuran Ke-${contract.installmentsPaid} Pembiayaan ${contract.contractType.toUpperCase()}`,
      createdAt: new Date().toISOString()
    });

    this.set('journals', journals);
    this.logAudit(userId, `PAID_INSTALLMENT_${contract.installmentsPaid}_AMOUNT_${amount}`, 'financing');
    return true;
  }

  public createOperationalExpense(amount: number, description: string, userId: string): void {
    const journals = this.getJournalEntries();
    const expenseTxId = `exp-${Math.random().toString(36).substr(2, 9)}`;

    // Debit: Beban Operasional (501)
    // Credit: Kas & Setara Kas (101)
    journals.push({
      id: `j-${expenseTxId}-debit`,
      transactionId: expenseTxId,
      codeCoa: '501',
      debit: amount,
      credit: 0,
      description: `Beban Operasional: ${description}`,
      createdAt: new Date().toISOString()
    });

    journals.push({
      id: `j-${expenseTxId}-credit`,
      transactionId: expenseTxId,
      codeCoa: '101',
      debit: 0,
      credit: amount,
      description: `Pembayaran Kas Beban Operasional: ${description}`,
      createdAt: new Date().toISOString()
    });

    this.set('journals', journals);
    this.logAudit(userId, `OPERATIONAL_EXPENSE_${amount}_DESC_${description}`, 'journals');
  }

  // -------------------------------------------------------------
  // Nisbah Profit Sharing Engine
  // -------------------------------------------------------------

  public distributeNisbah(userId: string): { success: boolean; totalDistributed: number } {
    // 1. Calculate Coop Net Profit for the month (Revenues 401 minus Expenses 501)
    const phu = this.generatePHU();
    const netProfit = phu.labaBersih;

    if (netProfit <= 0) {
      return { success: false, totalDistributed: 0 };
    }

    // 2. Mudharabah Pool is 40% of net profits
    const mudharabahPool = netProfit * 0.40;

    // 3. Find all Mudharabah accounts and total Mudharabah balance
    const accounts = this.getAccounts();
    const mudharabahAccounts = accounts.filter(a => a.accountType === 'mudharabah');
    const totalMudharabahBalance = mudharabahAccounts.reduce((sum, a) => sum + a.balance, 0);

    if (totalMudharabahBalance <= 0) {
      return { success: false, totalDistributed: 0 };
    }

    // 4. Distribute profit proportionally to each saver
    const journals = this.getJournalEntries();
    const nisbahTxId = `nisbah-${Date.now()}`;
    let totalDistributed = 0;

    mudharabahAccounts.forEach(account => {
      const shareRatio = account.balance / totalMudharabahBalance;
      const profitShare = Math.floor(mudharabahPool * shareRatio);

      if (profitShare > 0) {
        account.balance += profitShare;
        totalDistributed += profitShare;

        // Journal Entry for each member distribution:
        // Debit: Beban Operasional / Bagi Hasil (501)
        // Credit: Simpanan Mudharabah (202)
        journals.push({
          id: `j-${nisbahTxId}-${account.id}-debit`,
          transactionId: nisbahTxId,
          codeCoa: '501',
          debit: profitShare,
          credit: 0,
          description: `Penyaluran Bagi Hasil Nisbah Mudharabah ke Akun ${account.id}`,
          createdAt: new Date().toISOString()
        });

        journals.push({
          id: `j-${nisbahTxId}-${account.id}-credit`,
          transactionId: nisbahTxId,
          codeCoa: '202',
          debit: 0,
          credit: profitShare,
          description: `Penerimaan Bagi Hasil Nisbah Mudharabah`,
          createdAt: new Date().toISOString()
        });
      }
    });

    this.set('accounts', accounts);
    this.set('journals', journals);
    this.logAudit(userId, `NISBAH_PROFIT_SHARING_DISTRIBUTED_TOTAL_${totalDistributed}`, 'accounts');

    return { success: true, totalDistributed };
  }

  // -------------------------------------------------------------
  // Real-Time SAK EP Financial Report Generation
  // -------------------------------------------------------------

  public getCoaBalance(codeCoa: string): number {
    const journals = this.getJournalEntries();
    const entries = journals.filter(j => j.codeCoa === codeCoa);
    
    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

    // Normal debit balance for Asset accounts (1xx) and Expense accounts (5xx)
    if (codeCoa.startsWith('1') || codeCoa.startsWith('5')) {
      return totalDebit - totalCredit;
    }
    // Normal credit balance for Liabilities (2xx), Equity (3xx), and Revenues (4xx)
    return totalCredit - totalDebit;
  }

  public generateNeraca(): {
    kas: number;
    piutang: number;
    totalAset: number;
    wadiah: number;
    mudharabah: number;
    totalLiabilitas: number;
    modal: number;
    labaBerjalan: number;
    totalEkuitas: number;
    totalPasiva: number;
    isBalanced: boolean;
  } {
    const kas = this.getCoaBalance('101');
    const piutang = this.getCoaBalance('102');
    const totalAset = kas + piutang;

    const wadiah = this.getCoaBalance('201');
    const mudharabah = this.getCoaBalance('202');
    const totalLiabilitas = wadiah + mudharabah;

    const modal = this.getCoaBalance('301');
    
    // Sisa Hasil Usaha / Laba Berjalan is Revenue (401) - Expenses (501)
    const phu = this.generatePHU();
    const labaBerjalan = phu.labaBersih;

    const totalEkuitas = modal + labaBerjalan;
    const totalPasiva = totalLiabilitas + totalEkuitas;

    // Check if balanced (difference less than 1 unit due to rounding)
    const isBalanced = Math.abs(totalAset - totalPasiva) < 1;

    return {
      kas,
      piutang,
      totalAset,
      wadiah,
      mudharabah,
      totalLiabilitas,
      modal,
      labaBerjalan,
      totalEkuitas,
      totalPasiva,
      isBalanced
    };
  }

  public generatePHU(): {
    pendapatanMargin: number;
    bebanOperasional: number;
    labaBersih: number;
  } {
    const pendapatanMargin = this.getCoaBalance('401');
    const bebanOperasional = this.getCoaBalance('501');
    const labaBersih = pendapatanMargin - bebanOperasional;

    return {
      pendapatanMargin,
      bebanOperasional,
      labaBersih
    };
  }

  public generateArusKas(): {
    inflows: Array<{ desc: string; val: number }>;
    outflows: Array<{ desc: string; val: number }>;
    totalInflow: number;
    totalOutflow: number;
    netFlow: number;
  } {
    const journals = this.getJournalEntries();
    // Inflows (Transactions writing debit to Kas 101)
    const debitEntries = journals.filter(j => j.codeCoa === '101' && j.debit > 0);
    const inflows = debitEntries.map(e => ({
      desc: e.description,
      val: e.debit
    }));
    const totalInflow = inflows.reduce((sum, i) => sum + i.val, 0);

    // Outflows (Transactions writing credit to Kas 101)
    const creditEntries = journals.filter(j => j.codeCoa === '101' && j.credit > 0);
    const outflows = creditEntries.map(e => ({
      desc: e.description,
      val: e.credit
    }));
    const totalOutflow = outflows.reduce((sum, o) => sum + o.val, 0);

    return {
      inflows,
      outflows,
      totalInflow,
      totalOutflow,
      netFlow: totalInflow - totalOutflow
    };
  }
}

export const db = new Database();
export default db;
