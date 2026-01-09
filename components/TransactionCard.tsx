
import React, { useState } from 'react';
import { Transaction, Tag, Account } from '../types';

interface TransactionCardProps {
  transaction: Transaction;
  allTags: Tag[];
  accounts: Account[];
  themeStyles: any;
  text: any;
  onEdit: () => void;
  onDelete: () => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ 
  transaction, allTags, accounts, themeStyles: T, text, onEdit, onDelete 
}) => {
  const [expanded, setExpanded] = useState(false);
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'transfer';
  
  const accountName = accounts.find(a => a.id === transaction.accountId)?.name || 'Unknown';
  const toAccountName = isTransfer ? accounts.find(a => a.id === transaction.toAccountId)?.name : null;

  const displayTags = transaction.tags.map(tagId => 
    allTags.find(t => t.id === tagId)
  ).filter(Boolean) as Tag[];

  const hasImages = transaction.images && transaction.images.length > 0;

  return (
    <div 
      className={`rounded-2xl p-4 transition-all duration-200 border border-transparent hover:border-indigo-500/20 ${T.card} ${expanded ? 'shadow-lg my-3' : 'shadow-sm active:scale-[0.99]'}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start">
        {/* Left Icon */}
        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mr-3 ${
             isTransfer ? 'bg-slate-100 text-slate-500' : 
             isExpense ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'
        }`}>
             <span className="text-lg font-bold">{isTransfer ? '→' : isExpense ? '−' : '+'}</span>
        </div>

        {/* Right Content Container */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
            
            {/* Top Row: Tags/Account & Amount */}
            <div className="flex justify-between items-start">
                 <div className="flex items-center gap-2 flex-wrap pr-2">
                    {isTransfer ? (
                       <span className={`text-xs font-bold ${T.text}`}>
                          {text.transfer}: {accountName} → {toAccountName}
                       </span>
                    ) : (
                       displayTags.length > 0 ? (
                          displayTags.map(tag => {
                              const sub = transaction.subTags?.[tag.id];
                              const label = sub || tag.name;
                              return (
                                <span key={tag.id} className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tag.color}`}>
                                    {label}
                                </span>
                              );
                          })
                       ) : (
                          <span className={`text-xs font-bold ${T.text}`}>{text.unsorted}</span>
                       )
                    )}
                 </div>
                 
                 <div className={`font-black text-base whitespace-nowrap ${isTransfer ? T.text : isExpense ? T.text : 'text-emerald-500'}`}>
                    {transaction.amount.toLocaleString()}
                 </div>
            </div>

            {/* Bottom Row: Date/Note (Left) & Images (Right) */}
            <div className="flex justify-between items-end mt-1">
                <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-[10px] opacity-40 font-bold mb-0.5">
                        {new Date(transaction.date).toLocaleDateString()}
                    </span>
                    {transaction.note && (
                        <span className={`text-xs font-medium truncate leading-tight opacity-60 ${T.text}`}>
                            {transaction.note}
                        </span>
                    )}
                </div>

                {/* Images grouped to the right */}
                {hasImages && !expanded && (
                    <div className="flex gap-1 flex-shrink-0 items-center justify-end pl-2">
                        {transaction.images.map((img, i) => (
                            <div key={i} className="w-8 h-8 rounded-lg overflow-hidden border border-black/5 bg-slate-100 shadow-sm">
                                <img src={img} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-dashed border-slate-200 animate-in fade-in">
           {hasImages && (
             <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                 {transaction.images.map((img, i) => (
                     <img key={i} src={img} className="h-40 rounded-xl border border-slate-200 object-cover shadow-sm" />
                 ))}
             </div>
           )}
           <div className="flex gap-2">
             <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">{text.edit}</button>
             <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="flex-1 py-3 rounded-xl bg-red-50 text-red-500 text-xs font-bold uppercase tracking-wider">{text.delete}</button>
           </div>
        </div>
      )}
    </div>
  );
};
