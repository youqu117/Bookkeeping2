
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, SortOption, TAGS_PACK_TEXT, Tag, AppTheme, Account, INITIAL_ACCOUNTS, Language, LayoutMode } from './types';
import { TransactionCard } from './components/TransactionCard';
import { TransactionForm } from './components/TransactionForm';
import { StatsView } from './components/StatsView';
import { TagManager } from './components/TagManager';
import { GeminiChat } from './components/GeminiChat';
import { Plus, LayoutList, PieChart, ArrowUpDown, Settings, Download, Upload, X, Filter, Wallet, Database, ShieldCheck, ChevronDown, ChevronUp, Smartphone, Tablet, Sparkles, Key } from 'lucide-react';

const TRANSLATIONS = {
  en: {
    appName: 'Bookkeeping', netAssets: 'Net Assets', transactions: 'Transactions', sort: 'Sort', settings: 'Settings', save: 'Save', edit: 'Edit', delete: 'Delete', newLabel: 'New Label', newRecord: 'New Record', editRecord: 'Edit Record', confirm: 'Confirm', pending: 'Pending', cancel: 'Cancel', create: 'Create', category: 'Category', note: 'Note...', receipt: 'Receipt', expense: 'Expense', income: 'Income', transfer: 'Transfer', assetStatus: 'Asset Status', budgetControl: 'Budget Control', cashFlow: 'Cash Flow', totalAssets: 'Total Assets', liabilities: 'Liabilities', language: 'Language', dataPrivacy: 'Data Privacy', backup: 'Backup (JSON)', restore: 'Restore (JSON)', exportCsv: 'Export Excel/CSV', theme: 'Theme', appearance: 'Appearance', tagStyle: 'Tag Style', modern: 'Modern', minimal: 'Minimal', resetPack: 'Reset to Default', sortNewest: 'Newest', sortOldest: 'Oldest', sortHigh: 'High Amount', sortLow: 'Low Amount', all: 'All', noRecords: 'No records', budgetExceeded: 'Budget Exceeded', nearLimit: 'Near Limit', unsorted: 'Unsorted', transferTo: 'Transfer to', from: 'Account', to: 'To', snap: 'Snap', upload: 'Upload', totalWallet: 'Total Wallet', accounts: 'Accounts', addAccount: 'Add Account', accountName: 'Account Name', initialBalance: 'Initial Balance', layout: 'Layout', mobile: 'Mobile', tablet: 'Tablet', apiKey: 'Gemini API Key'
  },
  cn: {
    appName: 'Bookkeeping', netAssets: '净资产', transactions: '交易记录', sort: '排序', settings: '设置', save: '保存', edit: '编辑', delete: '删除', newLabel: '新建标签', newRecord: '记一笔', editRecord: '编辑记录', confirm: '已确认', pending: '待确认', cancel: '取消', create: '创建', category: '分类', note: '备注...', receipt: '凭证', expense: '支出', income: '收入', transfer: '转账', assetStatus: '资产概况', budgetControl: '预算控制', cashFlow: '收支趋势', totalAssets: '总资产', liabilities: '负债', language: '语言 / Language', dataPrivacy: '数据管理', backup: '备份数据 (JSON)', restore: '恢复数据 (JSON)', exportCsv: '导出表格 (Excel)', theme: '主题', appearance: '外观', tagStyle: '标签样式', modern: '现代', minimal: '极简', resetPack: '重置默认标签', sortNewest: '日期最新', sortOldest: '日期最早', sortHigh: '金额最高', sortLow: '金额最低', all: '全部', noRecords: '暂无记录', budgetExceeded: '超支预警', nearLimit: '接近预算', unsorted: '未分类', transferTo: '转账至', from: '账户', to: '转入账户', snap: '拍照', upload: '相册', totalWallet: '总资产', accounts: '账户管理', addAccount: '添加账户', accountName: '账户名称', initialBalance: '初始余额', layout: '布局', mobile: '手机', tablet: '平板', apiKey: 'Gemini API Key'
  }
};

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('zenledger_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('zenledger_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });
  const [tags, setTags] = useState<Tag[]>(() => {
    const saved = localStorage.getItem('zenledger_tags');
    return saved ? JSON.parse(saved) : TAGS_PACK_TEXT;
  });
  const [theme, setTheme] = useState<AppTheme>(() => (localStorage.getItem('zenledger_theme') as AppTheme) || 'zen');
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('zenledger_lang') as Language) || 'cn');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => (localStorage.getItem('zenledger_layout') as LayoutMode) || 'mobile');
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('zenledger_api_key') || '');
  
  const [showForm, setShowForm] = useState(false);
  const [showGeminiChat, setShowGeminiChat] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState<'list' | 'stats'>('list');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string | null>(null);
  const [showAccounts, setShowAccounts] = useState(true);
  const [isEditingAccounts, setIsEditingAccounts] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [showTagManager, setShowTagManager] = useState(false);
  const [tagManagerInitialId, setTagManagerInitialId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Swipe logic
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 100) setView('stats'); // Swipe Left -> Stats
    if (diff < -100) setView('list'); // Swipe Right -> List
  };

  useEffect(() => { localStorage.setItem('zenledger_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('zenledger_accounts', JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem('zenledger_tags', JSON.stringify(tags)); }, [tags]);
  useEffect(() => { localStorage.setItem('zenledger_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('zenledger_lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('zenledger_layout', layoutMode); }, [layoutMode]);
  useEffect(() => { localStorage.setItem('zenledger_api_key', customApiKey); }, [customApiKey]);

  useEffect(() => {
    const newAccounts = accounts.map(acc => ({ ...acc, balance: acc.initialBalance }));
    const sortedTx = [...transactions].sort((a, b) => a.date - b.date);
    sortedTx.forEach(tx => {
      const accIndex = newAccounts.findIndex(a => a.id === tx.accountId);
      if (accIndex === -1) return;
      if (tx.type === 'expense') newAccounts[accIndex].balance -= tx.amount;
      else if (tx.type === 'income') newAccounts[accIndex].balance += tx.amount;
      else if (tx.type === 'transfer' && tx.toAccountId) {
        newAccounts[accIndex].balance -= tx.amount;
        const toIndex = newAccounts.findIndex(a => a.id === tx.toAccountId);
        if (toIndex !== -1) newAccounts[toIndex].balance += tx.amount;
      }
    });
    setAccounts(newAccounts);
  }, [transactions]);

  const getThemeStyles = () => {
    switch(theme) {
      // Obsidian Gold (Premium Midnight)
      case 'midnight': return { 
          bg: 'bg-[#050505]', 
          text: 'text-[#FDFBF7]', 
          card: 'bg-[#121212] border-[#D4AF37]/15', 
          accent: 'bg-gradient-to-tr from-[#8E6E2E] via-[#D4AF37] to-[#F9E076] text-[#050505] shadow-[0_0_15px_rgba(212,175,55,0.2)]', 
          secondary: 'text-[#D4AF37]/50' 
      };
      case 'sunset': return { bg: 'bg-orange-50', text: 'text-slate-800', card: 'bg-white border-orange-100', accent: 'bg-orange-500 text-white', secondary: 'text-slate-500' };
      case 'ocean': return { bg: 'bg-cyan-50', text: 'text-slate-800', card: 'bg-white border-cyan-100', accent: 'bg-cyan-600 text-white', secondary: 'text-slate-500' };
      case 'zen': default: return { bg: 'bg-slate-50', text: 'text-slate-800', card: 'bg-white border-slate-200', accent: 'bg-slate-900 text-white', secondary: 'text-slate-500' };
    }
  };
  const T = getThemeStyles();
  const TEXT = TRANSLATIONS[lang];

  const addOrUpdateTransaction = (txData: Omit<Transaction, 'id'>, existingId?: string) => {
    if (existingId) setTransactions(prev => prev.map(t => t.id === existingId ? { ...txData, id: existingId } : t));
    else setTransactions(prev => [{ ...txData, id: crypto.randomUUID() }, ...prev]);
    setEditingTransaction(null);
  };
  const handleDeleteTransaction = (id: string) => { if(window.confirm(TEXT.delete + "?")) setTransactions(prev => prev.filter(t => t.id !== id)); };
  const handleEditRequest = (tx: Transaction) => { setEditingTransaction(tx); setShowForm(true); };
  const handleAddTag = (tag: Tag) => setTags(prev => [...prev, tag]);
  const handleDeleteTag = (tagId: string) => { if (window.confirm(TEXT.delete + "?")) setTags(prev => prev.filter(t => t.id !== tagId)); };
  const handleTagDoubleClick = (tagId: string) => { setTagManagerInitialId(tagId); setShowTagManager(true); };
  const handleAddAccount = () => {
    if (!newAccountName.trim()) return;
    setAccounts(prev => [...prev, { id: crypto.randomUUID(), name: newAccountName.trim(), type: 'cash', balance: 0, initialBalance: 0, includeInNetWorth: true }]);
    setNewAccountName('');
  };
  const handleDeleteAccount = (id: string) => { if (window.confirm(TEXT.delete + "?")) { setAccounts(prev => prev.filter(a => a.id !== id)); if (selectedAccountFilter === id) setSelectedAccountFilter(null); } };
  const handleUpdateAccountName = (id: string, newName: string) => setAccounts(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));
  const handleUpdateBudget = (tagId: string, limit: number) => setTags(prev => prev.map(t => t.id === tagId ? { ...t, budgetLimit: limit } : t));
  
  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Account', 'To Account', 'Amount', 'Tags', 'SubTags', 'Note', 'Confirmed'];
    const rows = transactions.map(t => [new Date(t.date).toLocaleDateString(), t.type, accounts.find(a => a.id === t.accountId)?.name || 'Unknown', t.toAccountId ? accounts.find(a => a.id === t.toAccountId)?.name : '-', t.amount.toFixed(2), t.tags.map(id => tags.find(tag => tag.id === id)?.name).join('; '), JSON.stringify(t.subTags || {}), t.note || '', t.isConfirmed ? 'Yes' : 'No']);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", `bookkeeping_export_${new Date().toISOString().split('T')[0]}.csv`); document.body.appendChild(link); link.click();
  };
  
  const handleBackup = () => {
    const data = { transactions, accounts, tags, version: '1.2' };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookkeeping_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.transactions) setTransactions(data.transactions);
        if (data.accounts) setAccounts(data.accounts);
        if (data.tags) setTags(data.tags);
        alert('Data Restored Successfully!');
        setShowSettings(false);
      } catch (err) { alert('Invalid backup file. Please ensure it is a valid JSON file.'); }
    };
    reader.readAsText(file);
  };

  let filteredTransactions = transactions;
  if (selectedAccountFilter) filteredTransactions = filteredTransactions.filter(t => t.accountId === selectedAccountFilter || t.toAccountId === selectedAccountFilter);
  if (selectedTagFilter) filteredTransactions = filteredTransactions.filter(t => t.tags.includes(selectedTagFilter));

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    switch (sortOption) {
      case 'date-desc': return b.date - a.date;
      case 'date-asc': return a.date - b.date;
      case 'amount-desc': return b.amount - a.amount;
      case 'amount-asc': return a.amount - b.amount;
      default: return 0;
    }
  });

  const groupedTransactions = sortedTransactions.reduce((groups, tx) => {
     const dateKey = new Date(tx.date).toLocaleDateString();
     if (!groups[dateKey]) groups[dateKey] = { date: tx.date, items: [] };
     groups[dateKey].items.push(tx); return groups;
  }, {} as Record<string, { date: number, items: Transaction[] }>);

  const sortedDateKeys = Object.keys(groupedTransactions).sort((a, b) => {
     const dateA = new Date(b).getTime(); const dateB = new Date(a).getTime();
     if(sortOption === 'date-asc') return dateB - dateA; return dateA - dateB;
  });

  const netWorth = accounts.filter(a => a.includeInNetWorth).reduce((acc, a) => acc + a.balance, 0);
  const activeWalletName = selectedAccountFilter ? accounts.find(a => a.id === selectedAccountFilter)?.name : TEXT.totalWallet;
  const activeWalletBalance = selectedAccountFilter ? accounts.find(a => a.id === selectedAccountFilter)?.balance || 0 : netWorth;
  const isTablet = layoutMode === 'tablet';

  const isDark = theme === 'midnight';

  return (
    <div 
      className={`min-h-screen font-sans flex flex-col transition-colors duration-500 ${T.bg} ${T.text}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className={`sticky top-0 z-30 px-5 pt-3 pb-2 flex justify-between items-center backdrop-blur-md border-b ${isDark ? 'border-[#D4AF37]/20 bg-[#050505]/90' : 'border-slate-200/60 bg-white/80'}`}>
        <div className="flex items-center gap-2">
           <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg shadow-sm ${T.accent}`}>B</div>
           <span className="font-black text-xl tracking-tight">{TEXT.appName}</span>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setShowGeminiChat(true)} className={`p-2 rounded-xl border transition-all active:scale-95 animate-in fade-in ${isDark ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]' : 'bg-indigo-50 border-indigo-100 text-indigo-500'}`}><Sparkles size={18} /></button>
           <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-slate-100 border-slate-200'}`}>
              <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? `${T.card} shadow-sm border-transparent` : 'opacity-50'}`}><LayoutList size={18} /></button>
              <button onClick={() => setView('stats')} className={`p-2 rounded-lg transition-all ${view === 'stats' ? `${T.card} shadow-sm border-transparent` : 'opacity-50'}`}><PieChart size={18} /></button>
           </div>
           <button onClick={() => setShowSettings(true)} className={`p-3 rounded-xl border transition-all active:scale-95 ${isDark ? 'bg-[#121212] border-[#D4AF37]/20' : 'bg-white border-slate-200'}`}><Settings size={20} className={T.secondary} /></button>
        </div>
      </header>

      <main className={`flex-1 w-full mx-auto px-4 pb-32 pt-2 ${isTablet ? 'max-w-5xl' : 'max-w-lg'}`}>
        {view === 'list' && (
          <div className={`animate-in fade-in slide-in-from-bottom-4 duration-300 ${isTablet ? 'grid grid-cols-12 gap-6' : ''}`}>
            <div className={`${isTablet ? 'col-span-5 flex flex-col gap-4' : ''}`}>
                <div className={`${isTablet ? '' : 'mb-4'}`}>
                    <button onClick={() => setShowAccounts(!showAccounts)} className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all border ${showAccounts ? 'mb-2 border-transparent bg-transparent' : `${T.card} hover:shadow-md`}`}>
                       <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-full ${T.accent} bg-opacity-10 text-current`}><Wallet size={16} /></div>
                           <div className="text-left"><div className="text-[10px] font-bold uppercase tracking-widest opacity-50">{activeWalletName}</div><div className="text-sm font-black">{activeWalletBalance.toLocaleString()}</div></div>
                       </div>
                       {showAccounts ? <ChevronUp size={16} className="opacity-50" /> : <ChevronDown size={16} className="opacity-50" />}
                    </button>
                    {showAccounts && (
                        <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                            <div className="flex justify-between items-center px-1 mb-2">
                                 <span className="text-[10px] font-bold uppercase opacity-40">{TEXT.accounts}</span>
                                 <button onClick={() => setIsEditingAccounts(!isEditingAccounts)} className={`text-[10px] font-bold uppercase underline opacity-50 ${T.text}`}>{isEditingAccounts ? 'Done' : 'Manage'}</button>
                            </div>
                            <div className={`flex gap-3 overflow-x-auto no-scrollbar pb-2 w-full ${isTablet ? 'flex-wrap' : ''}`}>
                                 <button onClick={() => setSelectedAccountFilter(null)} className={`flex-shrink-0 min-w-[100px] p-4 rounded-2xl border flex flex-col justify-center items-center gap-1 transition-all ${!selectedAccountFilter ? `${T.accent} shadow-md` : `${T.card} opacity-60 hover:opacity-100`} ${isTablet ? 'flex-grow' : ''}`}>
                                    <span className="text-[10px] font-bold uppercase">{TEXT.totalWallet}</span><span className="text-sm font-black">{netWorth.toLocaleString()}</span>
                                </button>
                                {accounts.map(acc => (
                                    <div key={acc.id} onClick={() => setSelectedAccountFilter(acc.id)} className={`flex-shrink-0 min-w-[120px] p-4 rounded-2xl border flex flex-col justify-between relative text-left transition-all cursor-pointer ${selectedAccountFilter === acc.id ? `${T.accent} shadow-md` : `${T.card} opacity-60 hover:opacity-100`} ${isTablet ? 'flex-grow' : ''}`}>
                                        {isEditingAccounts && <div onClick={(e) => { e.stopPropagation(); handleDeleteAccount(acc.id); }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full z-20 hover:scale-110 transition-transform"><X size={10} /></div>}
                                        <div className="flex items-center gap-2 opacity-80">
                                            {isEditingAccounts ? <input value={acc.name} onClick={e => e.stopPropagation()} onChange={e => handleUpdateAccountName(acc.id, e.target.value)} className="text-[10px] font-bold uppercase w-full bg-transparent border-b border-white/20 outline-none text-current" /> : <span className="text-[10px] font-bold uppercase truncate max-w-[90px]">{acc.name}</span>}
                                        </div>
                                        <span className={`text-lg font-bold mt-3 ${acc.balance < 0 && selectedAccountFilter !== acc.id ? 'text-red-500' : ''}`}>{acc.balance.toLocaleString()}</span>
                                        {selectedAccountFilter === acc.id && <button onClick={(e) => { e.stopPropagation(); setEditingTransaction(null); setShowForm(true); }} className="mt-2 w-full py-1 bg-white/20 hover:bg-white/30 rounded text-[10px] font-bold text-center uppercase tracking-widest">+ Add</button>}
                                    </div>
                                ))}
                                {isEditingAccounts && <div className={`flex-shrink-0 min-w-[120px] p-4 rounded-2xl border border-dashed flex flex-col justify-center items-center gap-2 ${T.card} ${isTablet ? 'flex-grow' : ''}`}><input value={newAccountName} onChange={e => setNewAccountName(e.target.value)} placeholder="Name" className={`w-full text-center text-xs font-bold bg-transparent border-b outline-none ${T.text}`} /><button onClick={handleAddAccount} className={`p-2 rounded-full ${T.accent}`}><Plus size={16} /></button></div>}
                            </div>
                        </div>
                    )}
                </div>
                {isTablet && <div className={`p-6 rounded-3xl ${T.card} shadow-sm hidden md:block`}><div className="flex items-center gap-2 mb-4 opacity-50"><PieChart size={16} /><span className="text-xs font-bold uppercase tracking-widest">{TEXT.assetStatus}</span></div><div className="text-2xl font-black">{TEXT.totalAssets}: {netWorth.toLocaleString()}</div></div>}
            </div>

            <div className={`${isTablet ? 'col-span-7' : ''}`}>
                <div className={`sticky top-[58px] z-20 py-2 mb-4 -mx-4 px-4 transition-all duration-300 backdrop-blur-md ${isDark ? 'bg-[#050505]/80' : 'bg-[#f8fafc]/80'} flex items-center gap-2`}>
                    <div className="relative flex-shrink-0 z-50">
                        <button onClick={() => setShowSortMenu(!showSortMenu)} title={TEXT.sort} className={`flex items-center justify-center w-8 h-8 rounded-full border shadow-sm active:scale-95 transition-all ${T.card} ${T.secondary}`}><ArrowUpDown size={14} /></button>
                        {showSortMenu && <><div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} /><div className={`absolute left-0 top-full mt-2 w-40 rounded-2xl shadow-xl border z-20 py-2 overflow-hidden ${T.card}`}>{[{ label: TEXT.sortNewest, value: 'date-desc' }, { label: TEXT.sortOldest, value: 'date-asc' }, { label: TEXT.sortHigh, value: 'amount-desc' }, { label: TEXT.sortLow, value: 'amount-asc' }].map((opt) => (<button key={opt.value} onClick={() => { setSortOption(opt.value as SortOption); setShowSortMenu(false); }} className={`w-full text-left px-4 py-3 text-xs font-bold hover:opacity-70 ${T.text}`}>{opt.label}</button>))}</div></>}
                    </div>
                    <div className="flex-1 overflow-x-auto no-scrollbar flex gap-2 items-center">
                        <button onClick={() => setSelectedTagFilter(null)} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border shadow-sm ${!selectedTagFilter ? `${T.accent} border-transparent` : `${T.card} border-transparent ${T.secondary}`}`}>{TEXT.all}</button>
                        {tags.map(tag => (<button key={tag.id} onClick={() => setSelectedTagFilter(tag.id === selectedTagFilter ? null : tag.id)} onDoubleClick={() => handleTagDoubleClick(tag.id)} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border shadow-sm flex items-center gap-2 ${tag.id === selectedTagFilter ? `${tag.color} border-current ring-2 ring-current ring-offset-1` : `${tag.color} border-transparent`}`}>{tag.name}</button>))}
                    </div>
                </div>
                <div className="space-y-6 min-h-[50vh]">
                  {sortedDateKeys.length === 0 ? <div className="flex flex-col items-center justify-center py-20 opacity-40"><div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${T.card}`}><Filter size={24} className={T.secondary} /></div><p className={`font-medium text-sm ${T.secondary}`}>{TEXT.noRecords}</p></div> : 
                    sortedDateKeys.map(dateKey => {
                        const group = groupedTransactions[dateKey];
                        const dayTotal = group.items.reduce((sum, t) => t.type === 'expense' ? sum - t.amount : t.type === 'income' ? sum + t.amount : sum, 0);
                        return (
                            <div key={dateKey} className="animate-in slide-in-from-bottom-2 fade-in duration-500">
                                 <div className="flex justify-between items-end px-2 mb-2 opacity-50">
                                     <span className="text-[10px] font-black uppercase tracking-wider">{new Date().toLocaleDateString() === dateKey ? 'Today' : dateKey}</span>
                                     <span className="text-[10px] font-bold">{dayTotal > 0 ? '+' : ''}{dayTotal.toLocaleString()}</span>
                                 </div>
                                 <div className={`flex flex-col gap-3 ${isTablet ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1' : ''}`}>
                                     {group.items.map(tx => <TransactionCard key={tx.id} transaction={tx} allTags={tags} accounts={accounts} themeStyles={T} text={TEXT} onEdit={() => handleEditRequest(tx)} onDelete={() => handleDeleteTransaction(tx.id)} />)}
                                 </div>
                            </div>
                        );
                    })
                  }
                </div>
            </div>
          </div>
        )}
        {view === 'stats' && <div className="animate-in fade-in slide-in-from-right-4 duration-300"><StatsView transactions={transactions} tags={tags} accounts={accounts} themeStyles={T} text={TEXT} onUpdateBudget={handleUpdateBudget} /></div>}
      </main>

      {view === 'list' && <button onClick={() => { setEditingTransaction(null); setShowForm(true); }} className={`fixed bottom-8 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 ${T.accent}`}><Plus size={28} /></button>}
      {showForm && <TransactionForm tags={tags} accounts={accounts} themeStyles={T} text={TEXT} initialData={editingTransaction} defaultAccountId={selectedAccountFilter || undefined} defaultTagId={selectedTagFilter || undefined} onSave={addOrUpdateTransaction} onAddTag={handleAddTag} onDeleteTag={handleDeleteTag} onClose={() => setShowForm(false)} />}
      {showTagManager && <TagManager tags={tags} initialTagId={tagManagerInitialId} onUpdateTags={setTags} onClose={() => setShowTagManager(false)} text={TEXT} themeStyles={T} />}
      {showGeminiChat && <GeminiChat tags={tags} accounts={accounts} recentTransactions={transactions.slice(0, 15)} onClose={() => setShowGeminiChat(false)} onSaveTransaction={(tx) => { addOrUpdateTransaction(tx); setShowGeminiChat(false); }} themeStyles={T} apiKey={customApiKey} />}

      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className={`w-full max-w-sm rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-200 ${isDark ? 'bg-[#121212] border border-[#D4AF37]/20 shadow-[0_0_30px_rgba(212,175,55,0.1)]' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-6"><h2 className={`text-xl font-black ${T.text}`}>{TEXT.settings}</h2><button onClick={() => setShowSettings(false)} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-neutral-800 text-[#D4AF37]' : 'bg-slate-100 text-slate-500'}`}><X size={20} /></button></div>
            <div className="space-y-6">
              <div>
                <label className={`text-[10px] font-black uppercase tracking-wider mb-3 block opacity-50 ${T.text}`}>{TEXT.layout}</label>
                <div className="flex gap-2"><button onClick={() => setLayoutMode('mobile')} className={`flex-1 py-3 rounded-xl border font-bold text-[10px] flex items-center justify-center gap-2 uppercase ${layoutMode === 'mobile' ? `${isDark ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-slate-900 text-slate-900 bg-slate-50'}` : 'border-transparent opacity-50'}`}><Smartphone size={16} /> {TEXT.mobile}</button><button onClick={() => setLayoutMode('tablet')} className={`flex-1 py-3 rounded-xl border font-bold text-[10px] flex items-center justify-center gap-2 uppercase ${layoutMode === 'tablet' ? `${isDark ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-slate-900 text-slate-900 bg-slate-50'}` : 'border-transparent opacity-50'}`}><Tablet size={16} /> {TEXT.tablet}</button></div>
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase tracking-wider mb-3 block opacity-50 ${T.text}`}>{TEXT.language}</label>
                <div className="flex gap-2"><button onClick={() => setLang('cn')} className={`flex-1 py-2 rounded-xl border font-bold text-xs ${lang === 'cn' ? `${isDark ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-slate-900 text-slate-900 bg-slate-50'}` : 'border-transparent opacity-50'}`}>中文</button><button onClick={() => setLang('en')} className={`flex-1 py-2 rounded-xl border font-bold text-xs ${lang === 'en' ? `${isDark ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-slate-900 text-slate-900 bg-slate-50'}` : 'border-transparent opacity-50'}`}>English</button></div>
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase tracking-wider mb-3 block opacity-50 ${T.text}`}>{TEXT.theme}</label>
                <div className="grid grid-cols-4 gap-3">
                  {['zen', 'midnight', 'sunset', 'ocean'].map(t => (
                    <button key={t} onClick={() => setTheme(t as AppTheme)} className={`w-full h-10 rounded-xl border-2 transition-all ${theme === t ? `border-current ${T.text}` : 'border-transparent opacity-30'} ${t === 'midnight' ? 'bg-[#050505] border-[#D4AF37]/50 ring-2 ring-[#D4AF37]/20 shadow-[0_0_10px_rgba(212,175,55,0.2)]' : t === 'zen' ? 'bg-slate-200' : t === 'sunset' ? 'bg-orange-200' : 'bg-cyan-200'}`} />
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3 font-black text-[10px] uppercase opacity-50"><Key size={12} className={T.text} />{TEXT.apiKey}</div>
                <input type="password" value={customApiKey} onChange={e => setCustomApiKey(e.target.value)} placeholder="Paste Gemini API Key here" className={`w-full p-3 rounded-xl border bg-transparent text-xs font-bold outline-none mb-2 transition-all ${isDark ? 'border-[#D4AF37]/20 focus:border-[#D4AF37] text-[#D4AF37]' : 'border-slate-200 focus:border-indigo-500'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3 font-black text-[10px] uppercase opacity-50"><ShieldCheck size={12} className={T.text} />{TEXT.dataPrivacy}</div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleExportCSV} className={`flex-1 py-3 rounded-xl font-bold text-[10px] border uppercase ${T.card} ${T.text} flex items-center justify-center gap-2`}><Download size={14} /> {TEXT.exportCsv}</button>
                    <button onClick={handleBackup} className={`flex-1 py-3 rounded-xl font-bold text-[10px] border uppercase ${T.card} ${T.text} flex items-center justify-center gap-2`}><Database size={14} /> {TEXT.backup}</button>
                    <button onClick={() => fileInputRef.current?.click()} className={`col-span-2 py-3 rounded-xl font-bold text-[10px] border uppercase ${T.card} ${T.text} flex items-center justify-center gap-2`}><Upload size={14} /> {TEXT.restore}</button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleRestore} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
