"use client";
import { useState, useEffect } from "react";
import { Wallet, Sparkles, CheckSquare, Square, Package, AlertTriangle, XCircle, ShoppingCart, Image as ImageIcon, ExternalLink, Trash2, Edit2, LayoutGrid, CheckCircle2, ChevronLeft, Plus, X } from 'lucide-react';

interface Goal {
  id: number;
  title: string;
  price: string;
  currency: string;
  category?: string; // Restored to fix the TS2353 error
  tier: "Inventory" | "Board" | "Dream";
  board?: "Room" | "Closet" | "Gym";
  outfit?: string; 
  stock_status: "IN_STOCK" | "LOW" | "OUT";
  image_url: string;
  original_url: string;
  funded_amount: number;
}

interface Debt {
  name: string;
  target_amount: number;
  amount_paid: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"daily" | "inventory" | "boards" | "dreams" | "vault">("daily");
  const [activeBoard, setActiveBoard] = useState<"Room" | "Closet" | "Gym">("Room");
  const [selectedOutfit, setSelectedOutfit] = useState<string | null>(null);
  
  // Modal State
  const [showFabModal, setShowFabModal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  
  // Form State
  const [url, setUrl] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [imageInput, setImageInput] = useState(""); 
  const [currency, setCurrency] = useState("EGP");
  const [category, setCategory] = useState("Maintenance");
  const [tier, setTier] = useState<"Inventory" | "Board" | "Dream">("Inventory");
  const [boardInput, setBoardInput] = useState<"Room" | "Closet" | "Gym">("Room");
  const [outfitInput, setOutfitInput] = useState("");
  
  // Local Data State
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeDebt, setActiveDebt] = useState<Debt | null>(null);
  const [incomeAmount, setIncomeAmount] = useState("");
  const [rebuildPool, setRebuildPool] = useState<number>(0);

  // Debt Form State
  const [debtNameInput, setDebtNameInput] = useState("");
  const [debtTargetInput, setDebtTargetInput] = useState("");

  const [routines, setRoutines] = useState([
    { id: 1, text: 'Protocol: Morning & Night Skincare', done: false },
    { id: 2, text: 'Nutrition: High-calorie oat, honey & creatine shake', done: false },
    { id: 3, text: 'Training: Complete 3-Day Hypertrophy Split', done: false },
    { id: 4, text: 'Sunday: Clean Sharp AC filter & Room Reset', done: false },
  ]);

  // Load Data on Mount
  useEffect(() => {
    const savedGoals = localStorage.getItem("life_os_goals");
    const savedDebt = localStorage.getItem("life_os_debt");
    const savedRoutines = localStorage.getItem("life_os_routines");
    const savedPool = localStorage.getItem("life_os_pool");

    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedDebt) setActiveDebt(JSON.parse(savedDebt));
    if (savedRoutines) setRoutines(JSON.parse(savedRoutines));
    if (savedPool) setRebuildPool(JSON.parse(savedPool));
  }, []);

  const saveGoalsToLocal = (newGoals: Goal[]) => {
    setGoals(newGoals);
    localStorage.setItem("life_os_goals", JSON.stringify(newGoals));
  };

  const savePoolToLocal = (amount: number) => {
    setRebuildPool(amount);
    localStorage.setItem("life_os_pool", JSON.stringify(amount));
  };

  const saveDebtToLocal = (debt: Debt | null) => {
    setActiveDebt(debt);
    if (debt) {
      localStorage.setItem("life_os_debt", JSON.stringify(debt));
    } else {
      localStorage.removeItem("life_os_debt");
    }
  };

  // Payday Engine
  const handleLogIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const income = parseInt(incomeAmount);
    if (!income) return;

    let debtDeducted = 0;
    if (activeDebt && activeDebt.amount_paid < activeDebt.target_amount) {
      const remainingBalance = activeDebt.target_amount - activeDebt.amount_paid;
      debtDeducted = Math.min(Math.ceil(remainingBalance / 4), income, remainingBalance);
      const updatedDebt = { ...activeDebt, amount_paid: activeDebt.amount_paid + debtDeducted };
      saveDebtToLocal(updatedDebt);
    }

    savePoolToLocal(rebuildPool + (income - debtDeducted));
    setIncomeAmount("");
    alert(`Success! E£${debtDeducted} routed to debt. E£${income - debtDeducted} added to Rebuild Pool.`);
  };

  // Image Compression
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scaleSize = 400 / img.width;
          canvas.width = 400;
          canvas.height = img.height * scaleSize;
          canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
          setImageInput(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput || !priceInput) return alert("Missing Title or Price!");

    const payload: Goal = {
      id: editingGoalId || Date.now(),
      title: titleInput, price: priceInput, currency, tier, category,
      board: tier === "Board" ? boardInput : undefined,
      outfit: tier === "Board" && boardInput === "Closet" ? outfitInput || "General" : undefined,
      stock_status: "IN_STOCK", 
      image_url: imageInput || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
      original_url: url, 
      funded_amount: editingGoalId ? goals.find(g => g.id === editingGoalId)?.funded_amount || 0 : 0
    };

    if (editingGoalId) {
      saveGoalsToLocal(goals.map(g => g.id === editingGoalId ? { ...g, ...payload } : g));
    } else {
      saveGoalsToLocal([payload, ...goals]);
    }
    closeModal();
  };

  const handleFundGoal = (id: number, amount: number) => {
    if (rebuildPool < amount) return alert("Insufficient funds in Rebuild Pool!");
    savePoolToLocal(rebuildPool - amount);
    saveGoalsToLocal(goals.map(g => g.id === id ? { ...g, funded_amount: g.funded_amount + amount } : g));
  };

  const toggleStockStatus = (goal: Goal) => {
    const sequence: Record<string, string> = { "IN_STOCK": "LOW", "LOW": "OUT", "OUT": "IN_STOCK" };
    saveGoalsToLocal(goals.map(g => g.id === goal.id ? { ...g, stock_status: sequence[goal.stock_status] as any } : g));
  };

  const handleDeleteGoal = (id: number) => {
    if (confirm("Permanently delete this item?")) saveGoalsToLocal(goals.filter(g => g.id !== id));
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoalId(goal.id); setTitleInput(goal.title); setPriceInput(goal.price);
    setImageInput(goal.image_url); setUrl(goal.original_url || ""); setCurrency(goal.currency);
    setCategory(goal.category || "Maintenance"); setTier(goal.tier); setBoardInput(goal.board || "Room"); 
    setOutfitInput(goal.outfit || "");
    setShowFabModal(true);
  };

  const closeModal = () => {
    setShowFabModal(false); setEditingGoalId(null);
    setTitleInput(""); setPriceInput(""); setImageInput(""); setUrl(""); setOutfitInput("");
  };

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtNameInput || !debtTargetInput) return;
    saveDebtToLocal({ name: debtNameInput, target_amount: parseInt(debtTargetInput), amount_paid: 0 });
    setDebtNameInput(""); setDebtTargetInput("");
  };

  const toggleRoutine = (id: number) => {
    const updated = routines.map(r => r.id === id ? { ...r, done: !r.done } : r);
    setRoutines(updated);
    localStorage.setItem("life_os_routines", JSON.stringify(updated));
  };

  // Helper Filters & Budgets
  const parsePrice = (priceStr: string) => parseFloat(priceStr.replace(/[^0-9.-]+/g,"")) || 0;
  
  const inventoryItems = goals.filter(g => g.tier === "Inventory");
  const dreamItems = goals.filter(g => g.tier === "Dream");
  const boardItems = goals.filter(g => g.tier === "Board" && g.board === activeBoard);
  
  // Closet Outfits Logic
  const outfits = activeBoard === "Closet" ? Array.from(new Set(boardItems.map(g => g.outfit || "General"))) : [];
  const activeOutfitItems = boardItems.filter(g => (g.outfit || "General") === selectedOutfit);
  
  // Current view logic
  const currentViewItems = selectedOutfit ? activeOutfitItems : boardItems;

  const restockCost = inventoryItems.filter(g => g.stock_status !== "IN_STOCK").reduce((sum: number, g: Goal) => sum + parsePrice(g.price), 0);

  const phaseTotal = currentViewItems.reduce((sum: number, g: Goal) => sum + parsePrice(g.price), 0);
  const phaseFunded = currentViewItems.reduce((sum: number, g: Goal) => sum + g.funded_amount, 0);
  const phaseProgress = phaseTotal > 0 ? Math.min((phaseFunded / phaseTotal) * 100, 100) : 0;

  const navItems = [
    { id: 'daily', icon: CheckCircle2, label: 'Daily' },
    { id: 'inventory', icon: Package, label: 'Inventory' },
    { id: 'boards', icon: LayoutGrid, label: 'Boards' },
    { id: 'dreams', icon: Sparkles, label: 'Dreams' },
    { id: 'vault', icon: Wallet, label: 'Vault' }
  ];

  return (
    <div className="bg-black min-h-screen text-white font-sans overflow-x-hidden pb-32">
      <header className="pt-12 pb-6 px-6 sticky top-0 bg-black/80 backdrop-blur-xl z-40 flex justify-between items-end">
        <h1 className="text-3xl font-bold tracking-tight capitalize">{activeTab}</h1>
        {activeTab !== 'daily' && activeTab !== 'vault' && (
          <div className="text-right">
            <p className="text-[10px] text-green-400 uppercase font-bold tracking-widest">Rebuild Pool</p>
            <p className="text-xl font-bold text-white">E£{rebuildPool}</p>
          </div>
        )}
      </header>

      <main className="px-6 w-full max-w-xl mx-auto">
        
        {/* ===================== DAILY ===================== */}
        {activeTab === "daily" && (
          <div className="animate-in fade-in flex flex-col gap-4">
            <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Execution Protocol</h2>
            {routines.map(item => (
              <button key={item.id} onClick={() => toggleRoutine(item.id)} className={`flex items-center gap-4 w-full text-left p-5 rounded-3xl border transition-all duration-300 ${item.done ? 'bg-white/5 border-white/5 opacity-50' : 'bg-white/10 border-white/10'}`}>
                {item.done ? <CheckSquare className="text-green-400" size={24} /> : <Square className="text-white/40" size={24} />}
                <span className={`${item.done ? 'line-through text-white/30' : 'text-white/90'} text-sm font-medium`}>{item.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* ===================== INVENTORY ===================== */}
        {activeTab === "inventory" && (
          <div className="animate-in fade-in space-y-4">
            {restockCost > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="text-amber-400" size={24} />
                  <div>
                    <h3 className="text-white font-bold text-sm">Upcoming Restock</h3>
                    <p className="text-amber-400/80 text-xs font-medium">Allocate from next payout</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-amber-400">{restockCost}</span>
              </div>
            )}
            
            {inventoryItems.map((goal) => (
              <div key={goal.id} className="bg-white/5 border border-white/10 rounded-3xl p-4 flex items-center gap-4 shadow-lg">
                <div className="w-16 h-16 rounded-2xl bg-black/40 overflow-hidden shrink-0">
                  <img src={goal.image_url} className="w-full h-full object-cover opacity-80" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-white line-clamp-1">{goal.title}</h3>
                    {goal.original_url && goal.original_url !== "#" && <a href={goal.original_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-green-400"><ExternalLink size={14} /></a>}
                  </div>
                  <span className="text-white/50 text-xs font-bold">{goal.price} {goal.currency}</span>
                </div>
                <button onClick={() => toggleStockStatus(goal)} className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 w-20 shrink-0 transition-all border ${goal.stock_status === 'LOW' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : goal.stock_status === 'OUT' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-green-500/20 border-green-500/30 text-green-400'}`}>
                  {goal.stock_status === 'LOW' ? <AlertTriangle size={18} /> : goal.stock_status === 'OUT' ? <XCircle size={18} /> : <Package size={18} />}
                  <span className="text-[9px] font-bold tracking-widest uppercase">{goal.stock_status === 'LOW' ? 'LOW' : goal.stock_status === 'OUT' ? 'EMPTY' : 'STOCK'}</span>
                </button>
              </div>
            ))}
            {inventoryItems.length === 0 && <p className="text-white/40 text-center py-8 text-sm">No items tracking in inventory.</p>}
          </div>
        )}

        {/* ===================== BOARDS ===================== */}
        {activeTab === "boards" && (
          <div className="animate-in fade-in">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-4 snap-x">
              {(["Room", "Closet", "Gym"] as const).map((b) => (
                <button key={b} onClick={() => { setActiveBoard(b); setSelectedOutfit(null); }} className={`snap-center shrink-0 px-5 py-2.5 rounded-[1.25rem] text-xs font-bold tracking-wide transition-all border ${activeBoard === b ? 'bg-green-500 border-green-400 text-black shadow-lg' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}>
                  {b}
                </button>
              ))}
            </div>

            {activeBoard === "Closet" && !selectedOutfit && (
              <div className="grid grid-cols-2 gap-4">
                {outfits.map(outfit => (
                  <button key={outfit} onClick={() => setSelectedOutfit(outfit)} className="bg-white/5 border border-white/10 hover:border-green-500/50 rounded-3xl p-6 text-left transition-all aspect-square flex flex-col justify-end shadow-lg">
                    <h3 className="font-bold text-lg text-white">{outfit}</h3>
                    <p className="text-white/40 text-xs mt-1">{boardItems.filter(g => (g.outfit || "General") === outfit).length} items</p>
                  </button>
                ))}
                {outfits.length === 0 && <p className="text-white/40 text-sm col-span-2">No outfits built yet.</p>}
              </div>
            )}

            {(activeBoard !== "Closet" || selectedOutfit) && (
              <div className="space-y-6">
                {selectedOutfit && (
                  <button onClick={() => setSelectedOutfit(null)} className="flex items-center gap-2 text-green-400 font-bold text-sm mb-4">
                    <ChevronLeft size={16} /> Back to Outfits
                  </button>
                )}
                
                {/* Global Phase Progress */}
                {currentViewItems.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-2 shadow-lg">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <h3 className="text-white font-bold text-sm uppercase tracking-widest">{selectedOutfit || activeBoard} Budget</h3>
                        <p className="text-white/50 text-xs mt-1">Total capital required</p>
                      </div>
                      <div className="text-right">
                        <span className="text-green-400 font-bold text-lg tabular-nums">{phaseFunded}</span>
                        <span className="text-white/50 text-xs"> / {phaseTotal}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${phaseProgress}%` }}></div>
                    </div>
                  </div>
                )}
                
                {currentViewItems.map((goal) => {
                  const targetPrice = parsePrice(goal.price) || 1; 
                  const itemProgress = Math.min((goal.funded_amount / targetPrice) * 100, 100);
                  return (
                    <div key={goal.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-lg">
                      <div className="h-48 w-full bg-black/40 relative block">
                        <img src={goal.image_url} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                        {goal.original_url && goal.original_url !== "#" && (
                          <a href={goal.original_url} target="_blank" rel="noopener noreferrer" className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 text-white hover:text-green-400 transition-colors">
                            <ExternalLink size={18} />
                          </a>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-lg line-clamp-2 mb-4 text-white leading-tight">{goal.title}</h3>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-white/50 text-xs font-bold">{goal.funded_amount} SAVED</span>
                          <span className="font-bold text-white text-lg">{goal.price} {goal.currency}</span>
                        </div>
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-6 border border-white/5">
                          <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${itemProgress}%` }}></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => handleFundGoal(goal.id, 50)} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-2xl">+ 50</button>
                          <button onClick={() => handleFundGoal(goal.id, 200)} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-2xl">+ 200</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== DREAMS ===================== */}
        {activeTab === "dreams" && (
          <div className="animate-in fade-in space-y-6">
            <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">High-Ticket Evolution</h2>
            {dreamItems.map((goal) => {
              const targetPrice = parsePrice(goal.price) || 1; 
              const itemProgress = Math.min((goal.funded_amount / targetPrice) * 100, 100);
              return (
                <div key={goal.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-lg">
                  <div className="h-56 w-full bg-black/40 relative block">
                    <img src={goal.image_url} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg line-clamp-2 mb-4 text-white leading-tight">{goal.title}</h3>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-white/50 text-xs font-bold">{goal.funded_amount} SAVED</span>
                      <span className="font-bold text-white text-lg">{goal.price} {goal.currency}</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-6 border border-white/5">
                      <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${itemProgress}%` }}></div>
                    </div>
                    <button onClick={() => handleFundGoal(goal.id, 500)} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl">+ 500 Allocation</button>
                  </div>
                </div>
              );
            })}
            {dreamItems.length === 0 && <p className="text-white/40 text-sm">No massive targets set yet.</p>}
          </div>
        )}

        {/* ===================== VAULT (ADMIN) ===================== */}
        {activeTab === "vault" && (
          <div className="animate-in fade-in space-y-6">
            
            {/* Payday Engine */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-lg">
              <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Monday Split Engine</h2>
              <form onSubmit={handleLogIncome} className="flex flex-col gap-4">
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                  <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Expected Payout</label>
                  <input type="number" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} className="w-full bg-transparent text-3xl font-bold text-white outline-none" placeholder="0" required />
                </div>
                <button type="submit" className="w-full bg-green-500 text-black py-4 rounded-2xl font-bold text-lg">Route Funds</button>
              </form>
            </div>

            {/* Total Pool */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-3xl p-6 flex justify-between items-center">
              <div>
                <h3 className="text-green-400 font-bold text-sm">Total Rebuild Pool</h3>
                <p className="text-green-400/60 text-xs">Available to deploy</p>
              </div>
              <span className="text-3xl font-black text-green-400">E£{rebuildPool}</span>
            </div>

            {/* Debt Target */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-lg">
              <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Liability Target</h2>
              {activeDebt ? (
                <div>
                  <div className="flex justify-between items-end mb-3"><span className="text-xl font-bold text-white">{activeDebt.name}</span><span className="text-red-400 font-bold tabular-nums">{activeDebt.amount_paid} / {activeDebt.target_amount}</span></div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-red-500" style={{ width: `${Math.min((activeDebt.amount_paid / activeDebt.target_amount) * 100, 100)}%` }}></div>
                  </div>
                  <button onClick={() => saveDebtToLocal(null)} className="mt-4 text-xs text-red-400 font-bold">Clear Debt Tracker</button>
                </div>
              ) : (
                <form onSubmit={handleCreateDebt} className="flex flex-col gap-4 mt-2">
                  <input type="text" value={debtNameInput} onChange={(e) => setDebtNameInput(e.target.value)} placeholder="Objective Name" className="bg-black/20 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm outline-none" required />
                  <input type="number" value={debtTargetInput} onChange={(e) => setDebtTargetInput(e.target.value)} placeholder="Total Amount" className="bg-black/20 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm outline-none" required />
                  <button type="submit" className="w-full bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3.5 rounded-2xl">Set Liability</button>
                </form>
              )}
            </div>

            {/* Global DB Manager */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-lg">
              <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Global Database</h2>
              <div className="space-y-3">
                {goals.map(goal => (
                  <div key={goal.id} className="flex justify-between items-center bg-black/20 border border-white/5 rounded-2xl p-3">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-bold text-white line-clamp-1">{goal.title}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{goal.tier} {goal.board ? `· ${goal.board}` : ''}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openEditModal(goal)} className="p-2 bg-blue-500/10 text-blue-400 rounded-xl"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteGoal(goal.id)} className="p-2 bg-red-500/10 text-red-400 rounded-xl"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
                {goals.length === 0 && <p className="text-white/40 text-xs">No items in database.</p>}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FAB MODAL */}
      {showFabModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-50 p-6 flex flex-col animate-in fade-in overflow-y-auto">
          <div className="flex justify-between items-center mb-6 mt-4">
            <h3 className="text-2xl font-bold text-white tracking-tight">{editingGoalId ? "Edit File" : "Add to OS"}</h3>
            <button onClick={closeModal} className="p-3 bg-white/10 rounded-full"><X size={20} className="text-white" /></button>
          </div>
          
          <form onSubmit={handleSaveGoal} className="flex flex-col gap-4 pb-12">
            
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-black/40 overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
                {imageInput ? <img src={imageInput} className="w-full h-full object-cover" /> : <ImageIcon className="text-white/30" size={24} />}
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Product Photo</label>
                <input type="file" accept="image/*" onChange={handleImageFileChange} className="w-full text-xs text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer" />
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Product Title</label>
              <input type="text" value={titleInput} onChange={(e) => setTitleInput(e.target.value)} placeholder="Title" className="w-full bg-transparent text-lg font-bold text-white outline-none" required />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10">
                <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Classification</label>
                <select value={tier} onChange={(e) => setTier(e.target.value as any)} className="w-full bg-transparent text-white font-bold outline-none appearance-none">
                  <option value="Inventory">Inventory (Restockables)</option>
                  <option value="Board">Vision Board</option>
                  <option value="Dream">Dream (High-Ticket)</option>
                </select>
              </div>
            </div>

            {tier === "Board" && (
              <div className="flex gap-4 animate-in slide-in-from-top-2">
                <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10">
                  <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Board</label>
                  <select value={boardInput} onChange={(e) => setBoardInput(e.target.value as any)} className="w-full bg-transparent text-white font-bold outline-none appearance-none">
                    <option value="Room">Room</option>
                    <option value="Closet">Closet</option>
                    <option value="Gym">Gym</option>
                  </select>
                </div>
                {boardInput === "Closet" && (
                  <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10">
                    <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Outfit Group</label>
                    <input type="text" value={outfitInput} onChange={(e) => setOutfitInput(e.target.value)} placeholder="e.g. Techwear" className="w-full bg-transparent text-white font-bold outline-none" />
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <div className="w-1/3 bg-white/5 rounded-2xl p-4 border border-white/10">
                <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full bg-transparent text-white font-bold outline-none appearance-none">
                  <option value="EGP">EGP</option><option value="USD">USD</option>
                </select>
              </div>
              <div className="flex-1 bg-black/20 rounded-2xl p-4 border border-green-500/30 flex flex-col justify-center">
                <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Price</label>
                <input type="text" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} placeholder="0.00" className="w-full bg-transparent text-2xl font-black text-green-400 outline-none" required />
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Store Link</label>
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full bg-transparent text-xs text-white outline-none" />
            </div>

            <button type="submit" className="w-full bg-green-500 text-black py-4 rounded-2xl font-bold mt-4 text-lg shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              {editingGoalId ? "Save File" : "Lock into OS"}
            </button>
          </form>
        </div>
      )}

      {/* FAB */}
      {activeTab !== "vault" && activeTab !== "daily" && (
        <button onClick={() => { closeModal(); setShowFabModal(true); }} className="fixed bottom-28 right-6 w-14 h-14 bg-green-500 text-black rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(34,197,94,0.4)] z-40">
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* BOTTOM NAV */}
      <div className="fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-[#1c1c1e]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] px-4 py-2.5 flex justify-between items-center shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-300 ${activeTab === item.id ? 'text-white scale-105' : 'text-white/40 hover:text-white/60'}`}>
              <item.icon size={22} strokeWidth={2.5} className={activeTab === item.id ? "text-green-400" : ""} />
              <span className="text-[9px] font-bold tracking-wide mt-0.5 uppercase">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}