
import React, { useMemo, useState } from 'react';
import { Transaction, Tag, Account, ChartType } from '../types';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { PieChart, Wallet, TrendingUp, Edit3, BarChart2, LineChart as LineChartIcon, Activity, Calendar, Filter, ChevronLeft, ChevronRight, Hash } from 'lucide-react';

interface StatsViewProps {
  transactions: Transaction[];
  tags: Tag[];
  accounts: Account[];
  themeStyles: any;
  text: any;
  onUpdateBudget: (tagId: string, limit: number) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ transactions, tags, accounts, themeStyles: T, text, onUpdateBudget }) => {
  const [chartType, setChartType] = useState<ChartType>('area');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [filterTagId, setFilterTagId] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<'month' | 'year'>('month');

  const isDark = T.bg.includes('#0c0c0e') || T.bg.includes('neutral-950');

  const periodTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      const matchPeriod = periodType === 'month' 
        ? (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth)
        : d.getFullYear() === selectedYear;
      const matchTag = filterTagId ? t.tags.includes(filterTagId) : true;
      return matchPeriod && matchTag;
    });
  }, [transactions, selectedYear, selectedMonth, filterTagId, periodType]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    periodTransactions.filter(t => t.type === 'expense').forEach(t => {
       const primaryTagId = t.tags[0] || 'unsorted';
       map.set(primaryTagId, (map.get(primaryTagId) || 0) + t.amount);
    });
    return Array.from(map.entries()).map(([tagId, spent]) => {
        const tag = tags.find(t => t.id === tagId);
        return {
            id: tagId,
            name: tag?.name || text.unsorted,
            value: spent,
            color: tag?.color?.split(' ')[1]?.replace('text-', '') || (isDark ? '#c5a059' : '#334155')
        };
    }).sort((a, b) => b.value - a.value);
  }, [periodTransactions, tags, text, isDark]);

  const chartData = useMemo(() => {
     if (periodType === 'month') {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dayTxs = periodTransactions.filter(t => new Date(t.date).getDate() === day);
            return {
                name: day.toString(),
                income: dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
                expense: dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
            };
        });
     } else {
        return Array.from({ length: 12 }, (_, i) => {
            const month = i;
            const monthTxs = periodTransactions.filter(t => new Date(t.date).getMonth() === month);
            return {
                name: (month + 1) + '月',
                income: monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
                expense: monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
            };
        });
     }
  }, [periodTransactions, selectedYear, selectedMonth, periodType]);

  const changeMonth = (offset: number) => {
      const newDate = new Date(selectedYear, selectedMonth + offset, 1);
      setSelectedYear(newDate.getFullYear());
      setSelectedMonth(newDate.getMonth());
  };

  const renderChart = () => {
      const commonProps = {
          data: chartData,
          margin: { top: 10, right: 10, left: -20, bottom: 0 }
      };
      const tooltipProps = {
          cursor: { stroke: isDark ? '#c5a059' : '#334155', strokeWidth: 1, strokeDasharray: '4 4' },
          contentStyle: { 
              borderRadius: '16px', 
              fontSize: '11px', 
              border: 'none', 
              backgroundColor: isDark ? '#161618' : '#fff',
              color: isDark ? '#e1e1e3' : '#000',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              fontWeight: 'bold'
          }
      };

      const strokeInc = isDark ? '#10b981' : '#059669';
      const strokeExp = isDark ? '#c5a059' : '#ef4444';

      if (chartType === 'line' || chartType === 'area') {
          return (
              <AreaChart {...commonProps}>
                 <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={strokeInc} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={strokeInc} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={strokeExp} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={strokeExp} stopOpacity={0}/>
                    </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={isDark ? 0.05 : 0.1} />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, opacity: 0.5 }} dy={10} hide={periodType === 'month' && chartData.length > 20} />
                 <RechartsTooltip {...tooltipProps} />
                 <Area type="monotone" dataKey="income" stroke={strokeInc} strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
                 <Area type="monotone" dataKey="expense" stroke={strokeExp} strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
          );
      }
      return (
        <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={isDark ? 0.05 : 0.1} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, opacity: 0.5 }} dy={10} hide={periodType === 'month' && chartData.length > 20} />
            <RechartsTooltip {...tooltipProps} />
            <Bar dataKey="income" fill={strokeInc} radius={[4, 4, 0, 0]} barSize={periodType === 'month' ? 4 : 12} />
            <Bar dataKey="expense" fill={strokeExp} radius={[4, 4, 0, 0]} barSize={periodType === 'month' ? 4 : 12} />
        </BarChart>
      );
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="flex flex-col gap-6 pb-24 animate-in fade-in duration-500">
      {/* 顶部筛选器：增加年/月切换 */}
      <div className={`p-5 rounded-[32px] ${T.card} shadow-xl border`}>
          <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <div className={`flex rounded-xl p-1 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                          <button onClick={() => setPeriodType('month')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${periodType === 'month' ? (isDark ? 'bg-[#c5a059] text-black shadow-lg' : 'bg-white shadow-sm') : 'opacity-40'}`}>Month</button>
                          <button onClick={() => setPeriodType('year')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${periodType === 'year' ? (isDark ? 'bg-[#c5a059] text-black shadow-lg' : 'bg-white shadow-sm') : 'opacity-40'}`}>Year</button>
                      </div>
                  </div>
                  <div className={`flex rounded-xl p-1 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                      <button onClick={() => setChartType('bar')} className={`p-1.5 rounded-lg transition-all ${chartType === 'bar' ? (isDark ? 'bg-[#c5a059] text-black' : 'bg-white') : 'opacity-40'}`}><BarChart2 size={14}/></button>
                      <button onClick={() => setChartType('area')} className={`p-1.5 rounded-lg transition-all ${chartType === 'area' ? (isDark ? 'bg-[#c5a059] text-black' : 'bg-white') : 'opacity-40'}`}><Activity size={14}/></button>
                  </div>
              </div>

              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      {periodType === 'month' && <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-white/5"><ChevronLeft size={18} className="opacity-40" /></button>}
                      <span className="text-xl font-black">{selectedYear}年 {periodType === 'month' && (selectedMonth + 1) + '月'}</span>
                      {periodType === 'month' && <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-white/5"><ChevronRight size={18} className="opacity-40" /></button>}
                  </div>
                  <div className="flex items-center gap-2">
                      <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-transparent text-[10px] font-black outline-none border-none opacity-40 hover:opacity-100 transition-opacity">
                          {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                  </div>
              </div>
          </div>
      </div>

      <div className={`p-6 rounded-[32px] ${T.card} shadow-xl border`}>
         <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 opacity-40">
                <TrendingUp size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{text.cashFlow}</span>
            </div>
            <div className="flex gap-4">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[9px] font-bold opacity-50 uppercase">Income</span></div>
                <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${isDark ? 'bg-[#c5a059]' : 'bg-red-500'}`} /><span className="text-[9px] font-bold opacity-50 uppercase">Expense</span></div>
            </div>
         </div>
         <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
               {renderChart()}
            </ResponsiveContainer>
         </div>
         <div className="grid grid-cols-2 gap-4 mt-8">
             <div className={`p-5 rounded-[24px] ${isDark ? 'bg-white/5 border border-white/5' : 'bg-emerald-50'} flex flex-col`}>
                <span className="text-[9px] font-black uppercase opacity-40 tracking-wider">Income</span>
                <span className="text-xl font-black mt-1 text-emerald-500">
                   {periodTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </span>
             </div>
             <div className={`p-5 rounded-[24px] ${isDark ? 'bg-white/5 border border-white/5' : 'bg-red-50'} flex flex-col`}>
                <span className="text-[9px] font-black uppercase opacity-40 tracking-wider">Expense</span>
                <span className={`text-xl font-black mt-1 ${isDark ? 'text-[#c5a059]' : 'text-red-500'}`}>
                   {periodTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </span>
             </div>
         </div>
      </div>

      {/* 新增分类占比饼图 */}
      {categoryBreakdown.length > 0 && (
        <div className={`p-6 rounded-[32px] ${T.card} shadow-xl border`}>
           <div className="flex items-center gap-2 mb-6 opacity-40">
              <PieChart size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Breakdown</span>
           </div>
           <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="w-48 h-48 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                          <Pie
                              data={categoryBreakdown}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                          >
                              {categoryBreakdown.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Pie>
                      </RePieChart>
                  </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-3">
                  {categoryBreakdown.slice(0, 5).map((cat, i) => (
                      <div key={i} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span className="text-xs font-black opacity-80">{cat.name}</span>
                          </div>
                          <div className="text-right">
                              <div className="text-xs font-black">{cat.value.toLocaleString()}</div>
                              <div className="text-[9px] font-bold opacity-30 tracking-tight">{((cat.value / periodTransactions.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0)) * 100).toFixed(1)}%</div>
                          </div>
                      </div>
                  ))}
              </div>
           </div>
        </div>
      )}

      <div className={`p-6 rounded-[32px] ${T.card} shadow-xl border`}>
         <div className="flex items-center gap-2 mb-6 opacity-40">
            <Hash size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{text.budgetControl}</span>
         </div>
         <div className="space-y-6">
            {tags.filter(tag => tag.type === 'expense' || tag.type === 'both').map(tag => {
                const spent = periodTransactions.filter(t => t.tags.includes(tag.id) && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                if (spent === 0 && !tag.budgetLimit) return null;
                const limit = tag.budgetLimit || 0;
                const percent = limit > 0 ? (spent / limit) * 100 : 0;
                const isOver = percent >= 100;
                return (
                    <div key={tag.id} className="cursor-pointer group" onClick={() => onUpdateBudget(tag.id, limit)}>
                       <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-widest">
                          <span className="flex items-center gap-1">
                             {tag.name}
                             <Edit3 size={10} className="opacity-0 group-hover:opacity-40 transition-opacity ml-1" />
                          </span>
                          <span className={isOver ? 'text-red-500' : 'opacity-50'}>
                             {spent.toLocaleString()} <span className="opacity-20 mx-1">/</span> {limit || '∞'}
                          </span>
                       </div>
                       <div className={`h-2.5 w-full ${isDark ? 'bg-white/5' : 'bg-slate-100'} rounded-full overflow-hidden p-0.5 border border-white/5`}>
                          <div className={`h-full rounded-full transition-all duration-1000 ${isOver ? 'bg-red-500' : isDark ? 'bg-gradient-to-r from-[#b8860b] to-[#d4af37]' : 'bg-slate-900'}`} style={{ width: `${Math.min(percent || (spent > 0 ? 100 : 0), 100)}%` }} />
                       </div>
                    </div>
                );
            }).filter(Boolean)}
         </div>
      </div>
    </div>
  );
};
