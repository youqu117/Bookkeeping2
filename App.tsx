
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, SortOption, TAGS_PACK_TEXT, Tag, AppTheme, Account, INITIAL_ACCOUNTS, Language, LayoutMode } from './types';
import { TransactionCard } from './components/TransactionCard';
import { TransactionForm } from './components/TransactionForm';
import { StatsView } from './components/StatsView';
import { TagManager } from './components/TagManager';
import { GeminiChat } from './components/GeminiChat';
import { Plus, LayoutList, PieChart, ArrowUpDown, Settings, Download, Upload, X, Filter, Wallet, Database, ShieldCheck, ChevronDown, ChevronUp, Smartphone, Tablet, Sparkles, Key, Trash2 } from 'lucide-react';

const TRANSLATIONS = {
  en: {
    appName: 'Bookkeeping', netAssets: 'Net Assets', transactions: 'Transactions', sort: 'Sort', settings: 'Settings', save: 'Save', edit: 'Edit', delete: 'Delete', newLabel: 'New Label', newRecord: 'New Record', editRecord: 'Edit Record', confirm: 'Confirm', pending: 'Pending', cancel: 'Cancel', create: 'Create', category: 'Category', note: 'Note...', receipt: 'Receipt', expense: 'Expense', income: 'Income', transfer: 'Transfer', assetStatus: 'Asset Status', budgetControl: 'Budget Control', cashFlow: 'Cash Flow', totalAssets: 'Total Assets', liabilities: 'Liabilities', language: 'Language', dataPrivacy: 'Data Privacy', backup: 'Backup (JSON)', restore: 'Restore (JSON)', exportCsv: 'Export Excel/CSV', theme: 'Theme', appearance: 'Appearance', tagStyle: 'Tag Style', modern: 'Modern', minimal: 'Minimal', resetPack: 'Reset to Default', sortNewest: 'Newest', sortOldest: 'Oldest', sortHigh: 'High Amount', sortLow: 'Low Amount', all: 'All', noRecords: 'No records', budgetExceeded: 'Budget Exceeded', nearLimit: 'Near Limit', unsorted: 'Unsorted', transferTo: 'Transfer to', from: 'Account', to: 'To', snap: 'Snap', upload: 'Upload', totalWallet: 'Total Wallet', accounts: 'Account Management', addAccount: 'Add Account', accountName: 'Account Name', initialBalance: 'Initial Balance', layout: 'Layout', mobile: 'Mobile', tablet: 'Tablet', apiKey: 'Gemini API Key'
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
  const [showAccounts, setShowAccounts] = useState(false); 
  const [isEditingAccounts, setIsEditingAccounts] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [showTagManager, setShowTagManager] = useState(false);
  const [tagManagerInitialId, setTagManagerInitialId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 实时计算各账户余额，避免 useEffect 导致的状态同步死循环
  const accountsWithBalance = useMemo(() => {
    return accounts.map(acc => {
      let balance = acc.initialBalance;
      transactions.forEach(tx => {
        if (tx.accountId === acc.id) {
          if (tx.type === 'expense' || tx.type === 'transfer') balance -= tx.amount;
          else if (tx.type === 'income') balance += tx.amount;
        }
        if (tx.toAccountId === acc.id && tx.type === 'transfer') {
          balance += tx.amount;
        }
      });
      return { ...acc, balance };
    });
  }, [accounts, transactions]);

  const netWorth = useMemo(() => {
    return accountsWithBalance.filter(a => a.includeInNetWorth).reduce((acc, a) => acc + a.balance, 0);
  }, [accountsWithBalance]);

  const handleTouchStart = (e: React.TouchEvent) => { (window as any).touchStartX = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = ((window as any).touchStartX || 0) - touchEndX;
    if (diff > 100) setView('stats');
    if (diff < -100) setView('list');
  };

  useEffect(() => { localStorage.setItem('zenledger_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('zenledger_accounts', JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem('zenledger_tags', JSON.stringify(tags)); }, [tags]);
  useEffect(() => { localStorage.setItem('zenledger_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('zenledger_lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('zenledger_layout', layoutMode); }, [layoutMode]);
  useEffect(() => { localStorage.setItem('zenledger_api_key', customApiKey); }, [customApiKey]);

  const getThemeStyles = () => {
    switch(theme) {
      case 'midnight': return { 
          bg: 'bg-[#0c0c0e]', 
          text: 'text-[#e1e1e3]', 
          card: 'bg-[#1a1a1c] border-white/5', 
          accent: 'bg-gradient-to-br from-[#F3E3C3] via-[#D1A96B] to-[#A6824A] text-[#0c0c0e] shadow-[0_4px_20px_rgba(209,169,107,0.15)]', 
          secondary: 'text-[#D1A96B]/70' 
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
  const handleDeleteAccount = (id: string) => { 
    if (window.confirm(TEXT.delete + "?")) { 
      setAccounts(prev => prev.filter(a => a.id !== id)); 
      if (selectedAccountFilter === id) setSelectedAccountFilter(null); 
    } 
  };
  const handleUpdateAccountName = (id: string, newName: string) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));
  };
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

  const activeWalletName = selectedAccountFilter ? accountsWithBalance.find(a => a.id === selectedAccountFilter)?.name : TEXT.totalWallet;
  const activeWalletBalance = selectedAccountFilter ? accountsWithBalance.find(a => a.id === selectedAccountFilter)?.balance || 0 : netWorth;
  const isTablet = layoutMode === 'tablet';
  const isDark = theme === 'midnight';

  return (
    <div 
      className={`min-h-screen font-sans flex flex-col transition-colors duration-500 ${T.bg} ${T.text}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className={`sticky top-0 z-30 px-5 pt-3 pb-2 flex justify-between items-center backdrop-blur-md border-b ${isDark ? 'border-white/5 bg-[#0c0c0e]/90' : 'border-slate-200/60 bg-white/80'}`}>
        <div className="flex items-center gap-2">
           <span className="font-black text-xl tracking-tight">{TEXT.appName}</span>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setShowGeminiChat(true)} className={`p-2 rounded-xl border transition-all active:scale-95 animate-in fade-in ${isDark ? 'bg-[#D1A96B]/10 border-[#D1A96B]/30 text-[#D1A96B]' : 'bg-indigo-50 border-indigo-100 text-indigo-500'}`}><Sparkles size={18} /></button>
           <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-[#1a1a1c] border-neutral-800' : 'bg-slate-100 border-slate-200'}`}>
              <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? `${T.card} shadow-sm border-transparent` : 'opacity-50'}`}><LayoutList size={18} /></button>
              <button onClick={() => setView('stats')} className={`p-2 rounded-lg transition-all ${view === 'stats' ? `${T.card} shadow-sm border-transparent` : 'opacity-50'}`}><PieChart size={18} /></button>
           </div>
           <button onClick={() => setShowSettings(true)} className={`p-3 rounded-xl border transition-all active:scale-95 ${T.card}`}><Settings size={20} className={T.secondary} /></button>
        </div>
      </header>

      <main className={`flex-1 w-full mx-auto px-4 pb-32 pt-2 ${isTablet ? 'max-w-5xl' : 'max-w-lg'}`}>
        {view === 'list' && (
          <div className={`animate-in fade-in slide-in-from-bottom-4 duration-300 ${isTablet ? 'grid grid-cols-12 gap-6' : ''}`}>
            <div className={`${isTablet ? 'col-span-5 flex flex-col gap-4' : ''}`}>
                <div className={`${isTablet ? '' : 'mb-4'}`}>
                    <button onClick={() => setShowAccounts(!showAccounts)} className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all border ${showAccounts ? 'mb-2 border-transparent bg-transparent' : `${T.card} hover:shadow-md`}`}>
                       <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-full ${isDark ? 'bg-[#D1A96B]/10 text-[#D1A96B]' : 'bg-slate-900/10 text-slate-900'} font-bold`}><Wallet size={16} /></div>
                           <div className="text-left"><div className="text-[10px] font-bold uppercase tracking-widest opacity-50">{activeWalletName}</div><div className="text-sm font-black">{activeWalletBalance.toLocaleString()}</div></div>
                       </div>
                       {showAccounts ? <ChevronUp size={16} className="opacity-50" /> : <ChevronDown size={16} className="opacity-50" />}
                    </button>
                    {showAccounts && (
                        <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                            <div className="flex justify-between items-center px-1 mb-2">
                                 <span className="text-[10px] font-black uppercase opacity-40">{TEXT.accounts}</span>
                                 <button onClick={() => setIsEditingAccounts(!isEditingAccounts)} className={`text-[10px] font-black uppercase underline opacity-60 hover:opacity-100 transition-all ${T.text}`}>{isEditingAccounts ? 'Done' : 'MANAGE'}</button>
                            </div>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 px-1 w-full">
                                 {/* 总资产卡片 */}
                                 <button 
                                    onClick={() => setSelectedAccountFilter(null)} 
                                    className={`flex-shrink-0 w-[calc((100%-1rem)/3)] h-[90px] p-4 rounded-2xl border flex flex-col justify-between items-start transition-all relative ${!selectedAccountFilter ? (isDark ? 'bg-[#0c0c0e] border-[#D1A96B] text-[#D1A96B]' : T.accent) : `${T.card} opacity-60 hover:opacity-100`}`}
                                 >
                                    <span className="text-[10px] font-black uppercase leading-none">{TEXT.totalAssets}</span>
                                    <span className="text-lg font-black leading-none truncate w-full text-left">{netWorth.toLocaleString()}</span>
                                 </button>

                                 {/* 账户卡片列表 */}
                                 {accountsWithBalance.map(acc => (
                                    <div 
                                      key={acc.id} 
                                      onClick={() => setSelectedAccountFilter(acc.id)} 
                                      className={`flex-shrink-0 w-[calc((100%-1rem)/3)] h-[90px] p-4 rounded-2xl border flex flex-col justify-between items-start transition-all relative cursor-pointer ${selectedAccountFilter === acc.id ? (isDark ? 'bg-[#0c0c0e] border-[#D1A96B] text-[#D1A96B]' : T.accent) : `${T.card} opacity-60 hover:opacity-100`}`}
                                    >
                                        <div className="flex items-center gap-1 opacity-80 w-full overflow-hidden">
                                            {isEditingAccounts ? (
                                              <input 
                                                value={acc.name} 
                                                autoFocus
                                                onClick={e => e.stopPropagation()} 
                                                onChange={e => handleUpdateAccountName(acc.id, e.target.value)} 
                                                className="text-[10px] font-black uppercase w-full bg-transparent border-b border-white/20 outline-none text-current" 
                                              />
                                            ) : (
                                              <span className="text-[10px] font-black uppercase truncate w-full">{acc.name}</span>
                                            )}
                                        </div>

                                        <div className="flex w-full items-end justify-between overflow-hidden">
                                          <span className={`text-lg font-black leading-none truncate ${acc.balance < 0 && selectedAccountFilter !== acc.id ? 'text-red-500' : ''}`}>
                                            {acc.balance.toLocaleString()}
                                          </span>
                                          
                                          {/* 操作按钮组 */}
                                          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                                            {!isEditingAccounts && selectedAccountFilter === acc.id && (
                                              <div 
                                                onClick={(e) => { e.stopPropagation(); setEditingTransaction(null); setShowForm(true); }} 
                                                className={`p-1 rounded-lg transition-all active:scale-90 ${isDark ? 'bg-[#D1A96B]/20 text-[#D1A96B]' : 'bg-white/30 text-white'}`}
                                              >
                                                <Plus size={14} strokeWidth={3} />
                                              </div>
                                            )}

                                            {isEditingAccounts && (
                                              <div 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteAccount(acc.id); }} 
                                                className="p-1 rounded-full bg-red-500 text-white shadow-lg active:scale-90 transition-all hover:bg-red-600 flex items-center justify-center"
                                              >
                                                <X size={10} strokeWidth={4} />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                    </div>
                                 ))}

                                 {/* 管理模式下的快速添加 */}
                                 {isEditingAccounts && (
                                   <div className={`flex-shrink-0 w-[calc((100%-1rem)/3)] h-[90px] p-3 rounded-2xl border border-dashed flex flex-col justify-center items-center gap-1.5 transition-all ${T.card}`}>
                                      <input 
                                        value={newAccountName} 
                                        onChange={e => setNewAccountName(e.target.value)} 
                                        placeholder="+" 
                                        onKeyDown={e => e.key === 'Enter' && handleAddAccount()}
                                        className={`w-full text-center text-[10px] font-black uppercase bg-transparent border-b outline-none focus:border-current ${T.text}`} 
                                      />
                                      <button onClick={handleAddAccount} className={`p-1.5 rounded-lg ${T.accent} active:scale-90 transition-all shadow-md`}>
                                        <Plus size={12} strokeWidth={4} />
                                      </button>
                                   </div>
                                 )}
                            </div>
                        </div>
                    )}
                </div>
                {isTablet && <div className={`p-6 rounded-3xl ${T.card} shadow-sm hidden md:block`}><div className="flex items-center gap-2 mb-4 opacity-50"><PieChart size={16} /><span className="text-xs font-bold uppercase tracking-widest">{TEXT.assetStatus}</span></div><div className="text-2xl font-black">{TEXT.totalAssets}: {netWorth.toLocaleString()}</div></div>}
            </div>

            <div className={`${isTablet ? 'col-span-7' : ''}`}>
                <div className={`sticky top-[58px] z-20 py-2 mb-4 -mx-4 px-4 transition-all duration-300 backdrop-blur-md ${isDark ? 'bg-[#0c0c0e]/80' : 'bg-[#f8fafc]/80'} flex items-center gap-2`}>
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
                                     {group.items.map(tx => <TransactionCard key={tx.id} transaction={tx} allTags={tags} accounts={accountsWithBalance} themeStyles={T} text={TEXT} onEdit={() => handleEditRequest(tx)} onDelete={() => handleDeleteTransaction(tx.id)} />)}
                                 </div>
                            </div>
                        );
                    })
                  }
                </div>
            </div>
          </div>
        )}
        {view === 'stats' && <div className="animate-in fade-in slide-in-from-right-4 duration-300"><StatsView transactions={transactions} tags={tags} accounts={accountsWithBalance} themeStyles={T} text={TEXT} onUpdateBudget={handleUpdateBudget} /></div>}
      </main>

      {view === 'list' && <button onClick={() => { setEditingTransaction(null); setShowForm(true); }} className={`fixed bottom-8 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 ${T.accent}`}><Plus size={28} /></button>}
      {showForm && <TransactionForm tags={tags} accounts={accountsWithBalance} themeStyles={T} text={TEXT} initialData={editingTransaction} defaultAccountId={selectedAccountFilter || undefined} defaultTagId={selectedTagFilter || undefined} onSave={addOrUpdateTransaction} onAddTag={handleAddTag} onDeleteTag={handleDeleteTag} onClose={() => setShowForm(false)} />}
      {showTagManager && <TagManager tags={tags} initialTagId={tagManagerInitialId} onUpdateTags={setTags} onClose={() => setShowTagManager(false)} text={TEXT} themeStyles={T} />}
      {showGeminiChat && <GeminiChat tags={tags} accounts={accountsWithBalance} recentTransactions={transactions.slice(0, 15)} onClose={() => setShowGeminiChat(false)} onSaveTransaction={(tx) => { addOrUpdateTransaction(tx); setShowGeminiChat(false); }} themeStyles={T} apiKey={customApiKey} />}

      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className={`w-full max-w-sm rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-200 ${T.card}`}>
            <div className="flex justify-between items-center mb-6"><h2 className={`text-xl font-black ${T.text}`}>{TEXT.settings}</h2><button onClick={() => setShowSettings(false)} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-neutral-800 text-[#D1A96B]' : 'bg-slate-100 text-slate-500'}`}><X size={20} /></button></div>
            <div className="space-y-6">
              <div>
                <label className={`text-[10px] font-black uppercase tracking-wider mb-3 block opacity-50 ${T.text}`}>{TEXT.layout}</label>
                <div className="flex gap-2"><button onClick={() => setLayoutMode('mobile')} className={`flex-1 py-3 rounded-xl border font-bold text-[10px] flex items-center justify-center gap-2 uppercase ${layoutMode === 'mobile' ? `${isDark ? 'border-[#D1A96B] text-[#D1A96B] bg-[#D1A96B]/5' : 'border-slate-900 text-slate-900 bg-slate-50'}` : 'border-transparent opacity-50'}`}><Smartphone size={16} /> {TEXT.mobile}</button><button onClick={() => setLayoutMode('tablet')} className={`flex-1 py-3 rounded-xl border font-bold text-[10px] flex items-center justify-center gap-2 uppercase ${layoutMode === 'tablet' ? `${isDark ? 'border-[#D1A96B] text-[#D1A96B] bg-[#D1A96B]/5' : 'border-slate-900 text-slate-900 bg-slate-50'}` : 'border-transparent opacity-50'}`}><Tablet size={16} /> {TEXT.tablet}</button></div>
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase tracking-wider mb-3 block opacity-50 ${T.text}`}>{TEXT.language}</label>
                <div className="flex gap-2"><button onClick={() => setLang('cn')} className={`flex-1 py-2 rounded-xl border font-bold text-xs ${lang === 'cn' ? `${isDark ? 'border-[#D1A96B] text-[#D1A96B] bg-[#D1A96B]/5' : 'border-slate-900 text-slate-900 bg-slate-50'}` : 'border-transparent opacity-50'}`}>中文</button><button onClick={() => setLang('en')} className={`flex-1 py-2 rounded-xl border font-bold text-xs ${lang === 'en' ? `${isDark ? 'border-[#D1A96B] text-[#D1A96B] bg-[#D1A96B]/5' : 'border-slate-900 text-slate-900 bg-slate-50'}` : 'border-transparent opacity-50'}`}>English</button></div>
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase tracking-wider mb-3 block opacity-50 ${T.text}`}>{TEXT.theme}</label>
                <div className="grid grid-cols-4 gap-3">
                  {['zen', 'midnight', 'sunset', 'ocean'].map(t => (
                    <button key={t} onClick={() => setTheme(t as AppTheme)} className={`w-full h-10 rounded-xl border-2 transition-all ${theme === t ? `border-current ${T.text}` : 'border-transparent opacity-30'} ${t === 'midnight' ? 'bg-[#0c0c0e] border-[#D1A96B]/50 ring-2 ring-[#D1A96B]/20' : t === 'zen' ? 'bg-slate-200' : t === 'sunset' ? 'bg-orange-200' : 'bg-cyan-200'}`} />
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3 font-black text-[10px] uppercase opacity-50"><Key size={12} className={T.text} />{TEXT.apiKey}</div>
                <input type="password" value={customApiKey} onChange={e => setCustomApiKey(e.target.value)} placeholder="Paste Gemini API Key here" className={`w-full p-3 rounded-xl border bg-transparent text-xs font-bold outline-none mb-2 transition-all ${isDark ? 'border-[#D1A96B]/20 focus:border-[#D1A96B] text-[#D1A96B]' : 'border-slate-200 focus:border-indigo-500'}`} />
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
