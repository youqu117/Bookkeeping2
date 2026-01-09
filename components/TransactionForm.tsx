
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

  // Image Compression Logic
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
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.6 quality
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsProcessingImg(true);
      const files = Array.from(e.target.files) as File[];
      const remainingSlots = 4 - images.length;
      
      try {
        const processedImages = await Promise.all(
            files.slice(0, remainingSlots).map(file => compressImage(file))
        );
        setImages(prev => [...prev, ...processedImages]);
      } catch (error) {
        console.error("Image processing failed", error);
        alert("Failed to process image");
      } finally {
        setIsProcessingImg(false);
        e.target.value = ''; 
      }
    }
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
    setSelectedTags(prev => [...prev, newTag.id]);
    setIsCreatingTag(false);
    setNewTagName('');
  };

  const handleTagClick = (tag: Tag) => {
    const isSelected = selectedTags.includes(tag.id);
    const hasSubTags = tag.subTags && tag.subTags.length > 0;

    if (!isSelected) {
       setSelectedTags(prev => [...prev, tag.id]);
       if (hasSubTags) setExpandedTagId(tag.id);
       else setExpandedTagId(null);
    } else {
       if (hasSubTags) {
          if (expandedTagId === tag.id) setExpandedTagId(null); 
          else setExpandedTagId(tag.id);
       } else {
          handleRemoveTag(tag.id);
       }
    }
  };

  const handleSubTagSelect = (tagId: string, subTagName: string) => {
      if (selectedSubTags[tagId] === subTagName) {
          const newSubs = { ...selectedSubTags };
          delete newSubs[tagId];
          setSelectedSubTags(newSubs);
      } else {
          setSelectedSubTags(prev => ({ ...prev, [tagId]: subTagName }));
      }
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
      type,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      tags: selectedTags,
      subTags: selectedSubTags,
      date: initialData ? initialData.date : Date.now(),
      note,
      images,
      isConfirmed
    }, initialData?.id);
    onClose();
  };

  const isDark = T.bg === 'bg-slate-900';
  const expandedTag = tags.find(t => t.id === expandedTagId);
  const showSubTagBar = expandedTag && selectedTags.includes(expandedTag.id) && expandedTag.subTags.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center animate-in fade-in duration-200">
      <div className={`w-full max-w-lg rounded-t-[32px] max-h-[95vh] overflow-y-auto flex flex-col ${T.bg} shadow-2xl`}>
        <div className="flex justify-between items-center p-6 border-b border-black/5">
          <h2 className={`text-xl font-black ${T.text}`}>
            {isCreatingTag ? text.newLabel : (initialData ? text.editRecord : text.newRecord)}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full ${T.card} ${T.secondary}`}><X size={20} /></button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {!isCreatingTag ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className={`flex p-1 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-200/50'}`}>
                {['expense', 'income', 'transfer'].map((t) => (
                    <button key={t} type="button" onClick={() => setType(t as TransactionType)} className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${type === t ? `${T.card} ${T.text} shadow-sm` : 'text-slate-400'}`}>
                        {text[t]}
                    </button>
                ))}
              </div>

              <div className="text-center py-2">
                 <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={`w-full text-center py-2 text-5xl font-black border-none focus:outline-none bg-transparent ${T.text}`} autoFocus={!initialData} />
              </div>

              {type === 'transfer' ? (
                 <div className="flex flex-col gap-2 p-3 rounded-xl border border-dashed border-slate-300">
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold w-12 opacity-50 uppercase">{text.from}</span>
                        <select value={accountId} onChange={e => setAccountId(e.target.value)} className={`flex-1 p-2 rounded-lg font-bold appearance-none bg-transparent ${T.text}`}>
                           {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                     </div>
                     <div className="flex items-center gap-2 border-t border-slate-100 pt-2">
                        <span className="text-[10px] font-bold w-12 opacity-50 uppercase">{text.to}</span>
                        <select value={toAccountId} onChange={e => setToAccountId(e.target.value)} className={`flex-1 p-2 rounded-lg font-bold appearance-none bg-transparent ${T.text}`}>
                            {accounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                     </div>
                 </div>
              ) : (
                <div className="flex justify-center">
                   <select value={accountId} onChange={e => setAccountId(e.target.value)} className={`text-xs font-bold appearance-none bg-transparent opacity-40 text-center ${T.text}`}>
                       {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
              )}

              {type !== 'transfer' && (
                <div className="flex flex-col gap-3">
                   <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase opacity-50">{text.category}</label>
                      <button type="button" onClick={() => setIsCreatingTag(true)} className={`text-[10px] font-bold ${T.secondary}`}>+ {text.create}</button>
                   </div>
                   
                   {/* FIXED: Added pb-2 and px-1 to prevent edge clipping */}
                   <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1 items-start">
                      {tags.filter(t => t.type === 'both' || t.type === type).map(tag => {
                        const isSelected = selectedTags.includes(tag.id);
                        const isExpanded = expandedTagId === tag.id;
                        const activeSubTag = selectedSubTags[tag.id];
                        const hasSubTags = tag.subTags && tag.subTags.length > 0;

                        return (
                            <button key={tag.id} type="button" onClick={() => handleTagClick(tag)} className={`relative flex flex-col items-center justify-center px-4 py-3 rounded-2xl text-[10px] font-bold border transition-all whitespace-nowrap min-w-[80px] ${isSelected ? `${tag.color} border-current ring-1 ring-current shadow-sm transform scale-105` : `${tag.color} border-transparent bg-opacity-30 opacity-60 grayscale-[0.3]`}`}>
                              <span>{tag.name}</span>
                              {!isExpanded && activeSubTag && <span className="text-[9px] opacity-90 mt-0.5 max-w-[60px] truncate">{activeSubTag}</span>}
                              {hasSubTags && <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 transition-all ${isExpanded ? 'translate-y-1' : ''}`}><ChevronDown size={12} className={`opacity-50 ${isExpanded ? 'rotate-180' : ''}`} /></div>}
                            </button>
                        );
                      })}
                   </div>

                   {showSubTagBar && (
                       <div className={`mt-2 p-3 rounded-2xl border animate-in slide-in-from-top-2 fade-in duration-300 origin-top ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                           <div className="flex items-center gap-2 mb-2 opacity-50 px-1">
                               <CornerDownRight size={12} />
                               <span className="text-[10px] font-bold uppercase">{expandedTag.name}</span>
                           </div>
                           <div className="flex flex-wrap gap-2">
                               {expandedTag.subTags.map(sub => {
                                   const isActive = selectedSubTags[expandedTag.id] === sub;
                                   return (
                                       <button key={sub} type="button" onClick={() => handleSubTagSelect(expandedTag.id, sub)} className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border shadow-sm ${isActive ? `${expandedTag.color} border-current` : `${isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-500'} hover:border-slate-300`}`}>
                                           {sub}
                                       </button>
                                   )
                               })}
                               <button type="button" onClick={() => handleRemoveTag(expandedTag.id)} className="px-3 py-2 rounded-xl text-[10px] font-bold border border-red-100 text-red-500 bg-red-50 hover:bg-red-100 ml-auto">Clear</button>
                           </div>
                       </div>
                   )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                 <div className={`p-3 rounded-xl border border-dashed flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
                    <span className="text-[10px] font-bold opacity-50 uppercase">{text.receipt}</span>
                    <div className="flex gap-2 items-center">
                       {isProcessingImg && <Loader2 size={16} className="animate-spin text-indigo-500" />}
                       <button type="button" disabled={isProcessingImg} onClick={() => cameraInputRef.current?.click()} className={`p-2 rounded-lg ${T.card}`}><Camera size={16} /></button>
                       <button type="button" disabled={isProcessingImg} onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-lg ${T.card}`}><ImageIcon size={16} /></button>
                    </div>
                    <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                    <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
                 </div>
                 <button type="button" onClick={() => setIsConfirmed(!isConfirmed)} className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${isConfirmed ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'border-dashed opacity-50'}`}>
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-bold uppercase">{isConfirmed ? text.confirm : text.pending}</span>
                 </button>
              </div>
              
              {images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                      {images.map((img, i) => (
                          <div key={i} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200">
                              <img src={img} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-black/50 text-white p-0.5"><X size={10}/></button>
                          </div>
                      ))}
                  </div>
              )}

              <input value={note} onChange={e => setNote(e.target.value)} placeholder={text.note} className={`w-full bg-transparent border-b p-2 text-sm focus:outline-none ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />
              <button type="submit" disabled={isProcessingImg} className={`w-full py-4 rounded-xl font-bold text-lg mt-2 ${T.accent} ${isProcessingImg ? 'opacity-50' : ''}`}>{isProcessingImg ? 'Processing...' : text.save}</button>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
               <input autoFocus value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder={text.newLabel} className={`w-full p-4 rounded-xl text-lg font-bold outline-none border-2 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} />
               <div className="grid grid-cols-5 gap-3">
                  {TAG_COLORS.map(c => <button key={c} onClick={() => setNewTagColor(c)} className={`h-10 rounded-full ${c.split(' ')[0]} ${newTagColor === c ? 'ring-2 ring-offset-2 ring-black' : ''}`} />)}
               </div>
               <div className="flex gap-3 mt-4">
                  <button onClick={() => setIsCreatingTag(false)} className={`flex-1 py-3 font-bold rounded-xl ${T.card}`}>{text.cancel}</button>
                  <button onClick={handleCreateTag} className={`flex-1 py-3 font-bold rounded-xl ${T.accent}`}>{text.create}</button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
