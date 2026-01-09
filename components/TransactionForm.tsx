
import React, { useState, useRef, useEffect } from 'react';
import { Transaction, Tag, TransactionType, Account, TAG_COLORS } from '../types';
import { Camera, X, Image as ImageIcon, ShieldCheck, ChevronDown, CornerDownRight, Loader2 } from 'lucide-react';

interface TransactionFormProps {
  tags: Tag[];
  accounts: Account[];
  themeStyles: any;
  text: any;
  initialData: Transaction | null;
  defaultAccountId?: string;
  defaultTagId?: string;
  onSave: (transaction: Omit<Transaction, 'id'>, id?: string) => void;
  onAddTag: (tag: Tag) => void;
  onDeleteTag: (tagId: string) => void;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  tags, accounts, themeStyles: T, text, initialData, defaultAccountId, defaultTagId, onSave, onAddTag, onDeleteTag, onClose 
}) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [accountId, setAccountId] = useState(defaultAccountId || accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSubTags, setSelectedSubTags] = useState<Record<string, string>>({});
  const [expandedTagId, setExpandedTagId] = useState<string | null>(null);

  const [note, setNote] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(true);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      setType(initialData.type);
      setAccountId(initialData.accountId);
      setToAccountId(initialData.toAccountId || '');
      setSelectedTags(initialData.tags);
      setSelectedSubTags(initialData.subTags || {});
      setNote(initialData.note || '');
      setImages(initialData.images || []);
      setIsConfirmed(initialData.isConfirmed);
      
      const tagWithSubs = initialData.tags.find(tid => {
        const t = tags.find(tag => tag.id === tid);
        return t && t.subTags.length > 0;
      });
      if (tagWithSubs) setExpandedTagId(tagWithSubs);
    } else {
        if (defaultAccountId) setAccountId(defaultAccountId);
        if (defaultTagId) {
            setSelectedTags([defaultTagId]);
            const tag = tags.find(t => t.id === defaultTagId);
            if (tag && tag.subTags.length > 0) setExpandedTagId(tag.id);
            if (tag && tag.type !== 'both') setType(tag.type as TransactionType);
        }
    }
  }, [initialData, defaultAccountId, defaultTagId, tags]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
          else { if (height > MAX_WIDTH) { width *= MAX_WIDTH / height; height = MAX_WIDTH; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsProcessingImg(true);
      const files = Array.from(e.target.files) as File[];
      try {
        const processedImages = await Promise.all(files.slice(0, 4).map(file => compressImage(file)));
        setImages(prev => [...prev, ...processedImages]);
      } finally { setIsProcessingImg(false); e.target.value = ''; }
    }
  };

  const handleTagClick = (tag: Tag) => {
    const isSelected = selectedTags.includes(tag.id);
    const hasSubTags = tag.subTags && tag.subTags.length > 0;
    if (!isSelected) {
       setSelectedTags([tag.id]);
       if (hasSubTags) setExpandedTagId(tag.id);
       else setExpandedTagId(null);
    } else {
       if (hasSubTags) setExpandedTagId(expandedTagId === tag.id ? null : tag.id);
       else setSelectedTags([]);
    }
  };

  const handleSubTagSelect = (tagId: string, subTagName: string) => {
      setSelectedSubTags(prev => ({ [tagId]: prev[tagId] === subTagName ? '' : subTagName }));
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name: newTagName.trim(),
      color: newTagColor,
      type: type === 'transfer' ? 'both' : type,
      subTags: []
    };
    onAddTag(newTag);
    setSelectedTags([newTag.id]);
    setIsCreatingTag(false);
    setNewTagName('');
  };

  const handleRemoveTag = (tagId: string) => {
      setSelectedTags(prev => prev.filter(id => id !== tagId));
      if (expandedTagId === tagId) setExpandedTagId(null);
      const newSubs = { ...selectedSubTags };
      delete newSubs[tagId];
      setSelectedSubTags(newSubs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isProcessingImg) return;
    onSave({
      amount: parseFloat(amount),
      type, accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      tags: selectedTags,
      subTags: selectedSubTags,
      date: initialData ? initialData.date : Date.now(),
      note, images, isConfirmed
    }, initialData?.id);
    onClose();
  };

  const isDark = T.bg.includes('#0c0c0e') || T.bg.includes('neutral-950');
  const expandedTag = tags.find(t => t.id === expandedTagId);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-end justify-center animate-in fade-in duration-300">
      <div className={`w-full max-w-lg rounded-t-[40px] max-h-[95vh] overflow-y-auto flex flex-col ${T.bg} shadow-2xl relative border-t ${isDark ? 'border-white/10' : 'border-black/5'}`}>
        <div className="flex justify-between items-center p-6 pb-2">
          <h2 className={`text-xl font-black ${T.text}`}>
            {isCreatingTag ? text.newLabel : (initialData ? text.editRecord : text.newRecord)}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full ${isDark ? 'bg-white/5 text-white/40' : 'bg-black/5 text-black/40'}`}><X size={20} /></button>
        </div>

        <div className="p-6 pt-2 flex flex-col gap-6">
          {!isCreatingTag ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-4">
              <div className={`flex p-1 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-200/50'}`}>
                {['expense', 'income', 'transfer'].map((t) => (
                    <button key={t} type="button" onClick={() => setType(t as TransactionType)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === t ? `${T.accent}` : 'opacity-40'}`}>
                        {text[t]}
                    </button>
                ))}
              </div>

              <div className="text-center">
                 <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={`w-full text-center py-2 text-6xl font-black border-none focus:outline-none bg-transparent ${T.text}`} autoFocus={!initialData} />
                 <div className="flex justify-center mt-2">
                    <select value={accountId} onChange={e => setAccountId(e.target.value)} className={`text-[10px] font-black uppercase tracking-widest appearance-none bg-transparent text-center outline-none ${T.text}`}>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                 </div>
              </div>

              {type === 'transfer' && (
                 <div className={`flex flex-col gap-2 p-4 rounded-2xl border border-dashed ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-300 bg-slate-50'}`}>
                     <div className="flex items-center justify-between"><span className="text-[10px] font-black opacity-30 uppercase">{text.from}</span><select value={accountId} onChange={e => setAccountId(e.target.value)} className="bg-transparent font-black text-sm outline-none">{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                     <div className="h-px bg-current opacity-5 my-1" />
                     <div className="flex items-center justify-between"><span className="text-[10px] font-black opacity-30 uppercase">{text.to}</span><select value={toAccountId} onChange={e => setToAccountId(e.target.value)} className="bg-transparent font-black text-sm outline-none">{accounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                 </div>
              )}

              {type !== 'transfer' && (
                <div className="relative flex flex-col gap-2">
                   <div className="flex justify-between items-center px-1 mb-1">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-30">{text.category}</label>
                      <button type="button" onClick={() => setIsCreatingTag(true)} className={`text-[10px] font-black uppercase tracking-widest opacity-50 underline`}>+ {text.create}</button>
                   </div>
                   
                   <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1 items-start">
                      {tags.filter(t => t.type === 'both' || t.type === type).map(tag => {
                        const isSelected = selectedTags.includes(tag.id);
                        const isExpanded = expandedTagId === tag.id;
                        const activeSubTag = selectedSubTags[tag.id];
                        return (
                            <button key={tag.id} type="button" onClick={() => handleTagClick(tag)} className={`relative flex flex-col items-center justify-center px-3 py-3 rounded-[16px] text-[10px] font-black border transition-all whitespace-nowrap min-w-[85px] ${isSelected ? `${isDark ? 'border-[#D1A96B] text-[#D1A96B] bg-[#D1A96B]/10 ring-1 ring-[#D1A96B]/30' : `${tag.color} border-current ring-1 ring-current`}` : `border-transparent ${isDark ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-400'}`}`}>
                              <span>{tag.name}</span>
                              {activeSubTag && <span className="text-[9px] opacity-70 mt-1 truncate max-w-[75px] font-bold">{activeSubTag}</span>}
                              {tag.subTags.length > 0 && <ChevronDown size={12} className={`mt-1 opacity-30 transition-all duration-300 ${isExpanded ? 'rotate-180 text-current' : ''}`} />}
                            </button>
                        );
                      })}
                   </div>

                   {/* Sub-tag selection as an absolute drawer over the fields below */}
                   {expandedTag && selectedTags.includes(expandedTag.id) && expandedTag.subTags.length > 0 && (
                       <div className={`absolute top-full left-0 right-0 z-50 p-4 mt-1 rounded-[24px] shadow-2xl backdrop-blur-xl border border-white/10 animate-in slide-in-from-top-2 fade-in duration-300 ${isDark ? 'bg-[#1a1a1c]/95 shadow-black/60' : 'bg-white/95 shadow-slate-200'}`}>
                           <div className="flex flex-wrap gap-2">
                               {expandedTag.subTags.map(sub => {
                                   const isActive = selectedSubTags[expandedTag.id] === sub;
                                   return (
                                       <button key={sub} type="button" onClick={() => handleSubTagSelect(expandedTag.id, sub)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${isActive ? `${isDark ? 'border-[#D1A96B] text-[#D1A96B] bg-[#D1A96B]/10' : `${expandedTag.color} border-current`}` : `${isDark ? 'border-white/5 text-white/30' : 'bg-white border-slate-200 text-slate-500'}`}`}>
                                           {sub}
                                       </button>
                                   )
                               })}
                               <button type="button" onClick={() => handleRemoveTag(expandedTag.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-colors ml-auto ${isDark ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-red-100 text-red-500 bg-red-50'}`}>Clear</button>
                           </div>
                       </div>
                   )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-2">
                 <div className={`p-4 rounded-2xl border border-dashed flex items-center justify-between ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-300 bg-slate-50'}`}>
                    <span className="text-[10px] font-black opacity-30 uppercase">{text.receipt}</span>
                    <div className="flex gap-3 items-center">
                       {isProcessingImg && <Loader2 size={16} className="animate-spin text-[#D1A96B]" />}
                       <button type="button" onClick={() => cameraInputRef.current?.click()} className="opacity-60 hover:opacity-100 transition-opacity"><Camera size={18} /></button>
                       <button type="button" onClick={() => fileInputRef.current?.click()} className="opacity-60 hover:opacity-100 transition-opacity"><ImageIcon size={18} /></button>
                    </div>
                    <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                    <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
                 </div>
                 <button type="button" onClick={() => setIsConfirmed(!isConfirmed)} className={`p-4 rounded-2xl border flex items-center justify-center gap-2 transition-all ${isConfirmed ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 font-black' : 'border-dashed opacity-40 font-bold'}`}>
                    <ShieldCheck size={16} />
                    <span className="text-[10px] uppercase">{isConfirmed ? text.confirm : text.pending}</span>
                 </button>
              </div>
              
              <div className="space-y-4">
                  <input value={note} onChange={e => setNote(e.target.value)} placeholder={text.note} className={`w-full bg-transparent border-b pb-2 text-sm font-medium focus:outline-none transition-all ${isDark ? 'border-white/10 focus:border-[#D1A96B]' : 'border-slate-200 focus:border-slate-900'}`} />
                  <button type="submit" disabled={isProcessingImg} className={`w-full py-5 rounded-[24px] font-black text-lg transition-all active:scale-[0.98] ${T.accent} ${isProcessingImg ? 'opacity-50' : ''}`}>
                    {isProcessingImg ? '...' : text.save}
                  </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-6 py-4">
               <input autoFocus value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder={text.newLabel} className={`w-full p-5 rounded-2xl text-xl font-black outline-none border transition-all ${isDark ? 'bg-white/5 border-white/10 focus:border-[#D1A96B]' : 'bg-white border-slate-200'}`} />
               <div className="grid grid-cols-5 gap-3">
                  {TAG_COLORS.map(c => <button key={c} onClick={() => setNewTagColor(c)} className={`h-12 rounded-2xl ${c.split(' ')[0]} ${newTagColor === c ? 'ring-4 ring-offset-2 ring-[#D1A96B]' : ''}`} />)}
               </div>
               <div className="flex gap-3 mt-4">
                  <button onClick={() => setIsCreatingTag(false)} className="flex-1 py-4 font-black rounded-2xl opacity-50 uppercase text-xs">{text.cancel}</button>
                  <button onClick={handleCreateTag} className={`flex-1 py-4 font-black rounded-2xl ${T.accent} uppercase text-xs`}>{text.create}</button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
