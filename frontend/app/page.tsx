"use client";
import { useState, useEffect } from "react";
import { Wallet, Sparkles, Package, AlertTriangle, XCircle, ShoppingCart, Image as ImageIcon, ExternalLink, Trash2, Edit2, LayoutGrid, CheckCircle2, ChevronLeft, Plus, X, Save } from 'lucide-react';

interface Goal {
  id: number;
  title: string;
  price: string;
  currency: string;
  category?: string;
  tier: "Inventory" | "One-Off" | "Board" | "Dream";
  board?: "Room" | "Closet" | "Gym";
  outfit?: string; 
  subGroup?: string; 
  stock_status: "IN_STOCK" | "LOW" | "OUT";
  image_url: string;
  original_url: string;
  funded_amount: number; 
  quantity?: number; 
}

interface Debt {
  name: string;
  target_amount: number;
  amount_paid: number;
  deadline: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"inventory" | "boards" | "dreams" | "vault">("inventory");
  const [activeBoard, setActiveBoard] = useState<"Room" | "Closet" | "Gym">("Room");
  const [selectedSubGroup, setSelectedSubGroup] = useState<string | null>(null);
  
  // Modal State
  const [showFabModal, setShowFabModal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  
  // Form State
  const [url, setUrl] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [quantityInput, setQuantityInput] = useState("1");
  const [imageInput, setImageInput] = useState(""); 
  const [currency, setCurrency] = useState("EGP");
  const [category, setCategory] = useState("Maintenance");
  const [tier, setTier] = useState<"Inventory" | "One-Off" | "Board" | "Dream">("Inventory");
  const [boardInput, setBoardInput] = useState<"Room" | "Closet" | "Gym">("Room");
  const [subGroupInput, setSubGroupInput] = useState("");
  
  // Local Data State
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeDebt, setActiveDebt] = useState<Debt | null>(null);
  const [incomeAmount, setIncomeAmount] = useState("");
  const [rebuildPool, setRebuildPool] = useState<number>(0);
  const [projectFunds, setProjectFunds] = useState<Record<string, number>>({}); 

  // Debt & Pool Edit State
  const [isEditingPool, setIsEditingPool] = useState(false);
  const [poolEditValue, setPoolEditValue] = useState("");
  const [isEditingDebt, setIsEditingDebt] = useState(false);
  const [debtNameInput, setDebtNameInput] = useState("");
  const [debtTargetInput, setDebtTargetInput] = useState("");
  const [debtPaidInput, setDebtPaidInput] = useState("");
  const [debtDeadlineInput, setDebtDeadlineInput] = useState("");

  // Load Data on Mount
  useEffect(() => {
    const savedGoals = localStorage.getItem("life_os_goals");
    const savedDebt = localStorage.getItem("life_os_debt");
    const savedPool = localStorage.getItem("life_os_pool");
    const savedProjectFunds = localStorage.getItem("life_os_project_funds");

    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedDebt) setActiveDebt(JSON.parse(savedDebt));
    if (savedPool) setRebuildPool(JSON.parse(savedPool));
    if (savedProjectFunds) setProjectFunds(JSON.parse(savedProjectFunds));
  }, []);

  const saveGoalsToLocal = (newGoals: Goal[]) => {
    setGoals(newGoals);
    localStorage.setItem("life_os_goals", JSON.stringify(newGoals));
  };

  const savePoolToLocal = (amount: number) => {
    setRebuildPool(amount);
    localStorage.setItem("life_os_pool", JSON.stringify(amount));
  };

  const saveProjectFundsToLocal = (funds: Record<string, number>) => {
    setProjectFunds(funds);
    localStorage.setItem("life_os_project_funds", JSON.stringify(funds));
  };

  const saveDebtToLocal = (debt: Debt | null) => {
    setActiveDebt(debt);
    if (debt) localStorage.setItem("life_os_debt", JSON.stringify(debt));
    else localStorage.removeItem("life_os_debt");
  };

  // Helper: Count remaining Wednesdays
  const getWednesdaysLeft = (deadlineStr: string) => {
    let count = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);
    const end = new Date(deadlineStr);
    end.setHours(23, 59, 59, 999);
    
    while (current <= end) {
      if (current.getDay() === 3) count++; // 3 = Wednesday
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const wednesdaysLeft = activeDebt ? getWednesdaysLeft(activeDebt.deadline) : 0;
  const remainingDebt = activeDebt ? activeDebt.target_amount - activeDebt.amount_paid : 0;
  const weeklyDebtCut = remainingDebt > 0 ? Math.ceil(remainingDebt / Math.max(1, wednesdaysLeft)) : 0;

  // Payday Engine
  const handleLogIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const income = parseInt(incomeAmount);
    if (!income) return;

    let debtDeducted = 0;
    if (activeDebt && remainingDebt > 0) {
      debtDeducted = Math.min(weeklyDebtCut, income, remainingDebt);
      saveDebtToLocal({ ...activeDebt, amount_paid: activeDebt.amount_paid + debtDeducted });
    }

    savePoolToLocal(rebuildPool + (income - debtDeducted));
    setIncomeAmount("");
    alert(`Success! E£${debtDeducted} routed to debt for this Wednesday. E£${income - debtDeducted} added to Rebuild Pool.`);
  };

  const handleSavePoolEdit = () => {
    savePoolToLocal(parseInt(poolEditValue) || 0);
    setIsEditingPool(false);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtNameInput || !debtTargetInput || !debtDeadlineInput) return;
    saveDebtToLocal({ 
      name: debtNameInput, 
      target_amount: parseInt(debtTargetInput), 
      amount_paid: parseInt(debtPaidInput) || 0,
      deadline: debtDeadlineInput
    });
    setIsEditingDebt(false);
  };

  const openDebtEditor = () => {
    if (activeDebt) {
      setDebtNameInput(activeDebt.name);
      setDebtTargetInput(activeDebt.target_amount.toString());
      setDebtPaidInput(activeDebt.amount_paid.toString());
      setDebtDeadlineInput(activeDebt.deadline);
    } else {
      setDebtNameInput(""); setDebtTargetInput(""); setDebtPaidInput("0");
      // Default to 5th of next month
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      d.setDate(5);
      setDebtDeadlineInput(d.toISOString().split('T')[0]);
    }
    setIsEditingDebt(true);
  };

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
      quantity: parseInt(quantityInput) || 1,
      board: tier === "Board" ? boardInput : undefined,
      subGroup: tier === "Board" ? (subGroupInput || "General") : undefined,
      stock_status: "IN_STOCK", 
      image_url: imageInput || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
      original_url: url, 
      funded_amount: editingGoalId ? goals.find(g => g.id === editingGoalId)?.funded_amount || 0 : 0
    };

    if (editingGoalId) saveGoalsToLocal(goals.map(g => g.id === editingGoalId ? { ...g, ...payload } : g));
    else saveGoalsToLocal([payload, ...goals]);
    
    closeModal();
  };

  const handleFundGoal = (id: number, amount: number) => {
    if (rebuildPool < amount) return alert("Insufficient funds in Rebuild Pool!");
    savePoolToLocal(rebuildPool - amount);
    saveGoalsToLocal(goals.map(g => g.id === id ? { ...g, funded_amount: g.funded_amount + amount } : g));
  };

  const handleFundProject = (board: string, project: string, amount: number) => {
    if (rebuildPool < amount) return alert("Insufficient funds in Rebuild Pool!");
    savePoolToLocal(rebuildPool - amount);
    const key = `${board}_${project}`;
    saveProjectFundsToLocal({ ...projectFunds, [key]: (projectFunds[key] || 0) + amount });
  };

  const toggleStockStatus = (goal: Goal) => {
    const sequence: Record<string, string> = { "IN_STOCK": "LOW", "LOW": "OUT", "OUT": "IN_STOCK" };
    saveGoalsToLocal(goals.map(g => g.id === goal.id ? { ...g, stock_status: sequence[goal.stock_status] as any } : g));
  };

  const handleDeleteGoal = (id: number) => {
    if (confirm("Permanently delete this item?")) saveGoalsToLocal(goals.filter(g => g.id !== id));
  };

  const handleMarkBought = (id: number) => {
    saveGoalsToLocal(goals.filter(g => g.id !== id));
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoalId(goal.id); setTitleInput(goal.title); setPriceInput(goal.price); setQuantityInput((goal.quantity || 1).toString());
    setImageInput(goal.image_url); setUrl(goal.original_url || ""); setCurrency(goal.currency);
    setCategory(goal.category || "Maintenance"); setTier(goal.tier); setBoardInput(goal.board || "Room"); 
    setSubGroupInput(goal.subGroup || goal.outfit || "");
    setShowFabModal(true);
  };

  const closeModal = () => {
    setShowFabModal(false); setEditingGoalId(null);
    setTitleInput(""); setPriceInput(""); setQuantityInput("1"); setImageInput(""); setUrl(""); setSubGroupInput("");
  };

  // Helper Filters
  const parsePrice = (priceStr: string) => parseFloat(priceStr.replace(/[^0-9.-]+/g,"")) || 0;
  
  const inventoryItems = goals.filter(g => g.tier === "Inventory");
  const oneOffItems = goals.filter(g => g.tier === "One-Off");
  const dreamItems = goals.filter(g => g.tier === "Dream");
  const boardItems = goals.filter(g => g.tier === "Board" && g.board === activeBoard);
  
  const subGroups = Array.from(new Set(boardItems.map(g => g.subGroup || g.outfit || "General")));
  const activeSubGroupItems = boardItems.filter(g => (g.subGroup || g.outfit || "General") === selectedSubGroup);

  const restockCost = inventoryItems.filter(g => g.stock_status !== "IN_STOCK").reduce((sum, g) => sum + (parsePrice(g.price) * (g.quantity || 1)), 0);

  const navItems = [
    { id: 'inventory', icon: Package, label: 'Inventory' },
    { id: 'boards', icon: LayoutGrid, label: 'Boards' },
    { id: 'dreams', icon: Sparkles, label: 'Dreams' },
    { id: 'vault', icon: Wallet, label: 'Vault' }
  ];

  return (
    <div className="bg-black min-h-screen text-white font-sans overflow-x-hidden pb-32">
      <header className="pt-12 pb-6 px-6 sticky top-0 bg-black/80 backdrop-blur-xl z-40 flex justify-between items-end">
        <h1 className="text-3xl font-bold tracking-tight capitalize">{activeTab}</h1>
        {activeTab !== 'vault' && (
          <div className="text-right">
            <p className="text-[10px] text-green-400 uppercase font-bold tracking-widest">Rebuild Pool</p>
            <p className="text-xl font-bold text-white">E£{rebuildPool}</p>
          </div>
        )}
      </header>

      <main className="px-6 w-full max-w-xl mx-auto">
        
        {/* ===================== INVENTORY ===================== */}
        {activeTab === "inventory" && (
          <div className="animate-in fade-in space-y-4">
            <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-2 pl-1">Restockables</h2>
            {restockCost > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 flex items-center justify-between">
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
                <div className="w-16 h-16 rounded-2xl bg-black/40 overflow-hidden shrink-0 relative">
                  <img src={goal.image_url} className="w-full h-full object-cover opacity-80" />
                  {goal.quantity && goal.quantity > 1 && <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-white/20">x{goal.quantity}</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-white line-clamp-1">{goal.title}</h3>
                    {goal.original_url && goal.original_url !== "#" && <a href={goal.original_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-green-400"><ExternalLink size={14} /></a>}
                  </div>
                  <span className="text-white/50 text-xs font-bold">{goal.price} {goal.currency} {goal.quantity && goal.quantity > 1 && `(x${goal.quantity})`}</span>
                </div>
                <button onClick={() => toggleStockStatus(goal)} className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 w-20 shrink-0 transition-all border ${goal.stock_status === 'LOW' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : goal.stock_status === 'OUT' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-green-500/20 border-green-500/30 text-green-400'}`}>
                  {goal.stock_status === 'LOW' ? <AlertTriangle size={18} /> : goal.stock_status === 'OUT' ? <XCircle size={18} /> : <Package size={18} />}
                  <span className="text-[9px] font-bold tracking-widest uppercase">{goal.stock_status === 'LOW' ? 'LOW' : goal.stock_status === 'OUT' ? 'EMPTY' : 'STOCK'}</span>
                </button>
              </div>
            ))}
            {inventoryItems.length === 0 && <p className="text-white/40 text-sm pl-1">No restockables set.</p>}

            <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest pt-4 pl-1 border-t border-white/10 mt-6">One-Off Needs</h2>
            {oneOffItems.map((goal) => (
              <div key={goal.id} className="bg-white/5 border border-white/10 rounded-3xl p-4 flex items-center gap-4 shadow-lg">
                <div className="w-16 h-16 rounded-2xl bg-black/40 overflow-hidden shrink-0 relative">
                  <img src={goal.image_url} className="w-full h-full object-cover opacity-80" />
                  {goal.quantity && goal.quantity > 1 && <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-white/20">x{goal.quantity}</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-white line-clamp-1">{goal.title}</h3>
                    {goal.original_url && goal.original_url !== "#" && <a href={goal.original_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-green-400"><ExternalLink size={14} /></a>}
                  </div>
                  <span className="text-white/50 text-xs font-bold">{goal.price} {goal.currency} {goal.quantity && goal.quantity > 1 && `(x${goal.quantity})`}</span>
                </div>
                <button onClick={() => handleMarkBought(goal.id)} className="p-3 rounded-2xl flex flex-col items-center justify-center gap-1 w-20 shrink-0 transition-all border bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30">
                  <CheckCircle2 size={18} />
                  <span className="text-[9px] font-bold tracking-widest uppercase">BOUGHT</span>
                </button>
              </div>
            ))}
            {oneOffItems.length === 0 && <p className="text-white/40 text-sm pl-1">No pending one-off items.</p>}
          </div>
        )}

        {/* ===================== BOARDS ===================== */}
        {activeTab === "boards" && (
          <div className="animate-in fade-in">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-4 snap-x">
              {(["Room", "Closet", "Gym"] as const).map((b) => (
                <button key={b} onClick={() => { setActiveBoard(b); setSelectedSubGroup(null); }} className={`snap-center shrink-0 px-5 py-2.5 rounded-[1.25rem] text-xs font-bold tracking-wide transition-all border ${activeBoard === b ? 'bg-green-500 border-green-400 text-black shadow-lg' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}>
                  {b}
                </button>
              ))}
            </div>

            {!selectedSubGroup ? (
              <div className="flex flex-col gap-4">
                {subGroups.map(group => {
                  const itemsInGroup = boardItems.filter(g => (g.subGroup || g.outfit || "General") === group);
                  const cost = itemsInGroup.reduce((sum, g) => sum + (parsePrice(g.price) * (g.quantity || 1)), 0);
                  const funded = projectFunds[`${activeBoard}_${group}`] || 0;
                  const progress = cost > 0 ? Math.min((funded / cost) * 100, 100) : 0;
                  const images = itemsInGroup.map(g => g.image_url).slice(0, 5);

                  return (
                    <button key={group} onClick={() => setSelectedSubGroup(group)} className="bg-white/5 border border-white/10 hover:border-green-500/50 rounded-3xl p-5 text-left transition-all flex flex-col gap-4 shadow-lg w-full relative overflow-hidden">
                      <div className="flex justify-between items-start z-10 relative">
                        <div>
                          <h3 className="font-bold text-xl text-white">{group}</h3>
                          <p className="text-white/40 text-xs mt-1 font-bold">{itemsInGroup.length} ITEMS REQUIRED</p>
                        </div>
                        <div className="flex -space-x-3">
                          {images.map((img, i) => <img key={i} src={img} className="w-10 h-10 rounded-full border-2 border-[#1c1c1e] object-cover bg-black" />)}
                        </div>
                      </div>
                      <div className="z-10 relative">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-green-400 font-bold">{funded} SAVED</span>
                          <span className="text-white/60 font-bold">{cost} TOTAL</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-6">
                <button onClick={() => setSelectedSubGroup(null)} className="flex items-center gap-2 text-green-400 font-bold text-sm mb-2">
                  <ChevronLeft size={16} /> Back to Projects
                </button>
                
                {(() => {
                  const cost = activeSubGroupItems.reduce((sum, g) => sum + (parsePrice(g.price) * (g.quantity || 1)), 0);
                  const funded = projectFunds[`${activeBoard}_${selectedSubGroup}`] || 0;
                  const progress = cost > 0 ? Math.min((funded / cost) * 100, 100) : 0;
                  return (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-lg">
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <h3 className="text-white font-bold text-sm uppercase tracking-widest">{selectedSubGroup} Funding</h3>
                          <p className="text-white/50 text-xs mt-1">Project capital requirements</p>
                        </div>
                        <div className="text-right">
                          <span className="text-green-400 font-bold text-lg tabular-nums">{funded}</span>
                          <span className="text-white/50 text-xs"> / {cost}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-6 border border-white/5">
                        <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleFundProject(activeBoard, selectedSubGroup, 50)} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-2xl">+ 50</button>
                        <button onClick={() => handleFundProject(activeBoard, selectedSubGroup, 200)} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-2xl">+ 200</button>
                      </div>
                    </div>
                  );
                })()}
                
                <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest pl-1 mt-6">Project Items</h2>
                <div className="flex flex-col gap-3">
                  {activeSubGroupItems.map((goal) => (
                    <div key={goal.id} className="bg-white/5 rounded-2xl flex overflow-hidden shadow-lg border border-white/10 p-2 pr-4 gap-4 items-center">
                      <div className="w-16 h-16 rounded-xl bg-black/40 relative overflow-hidden shrink-0">
                        <img src={goal.image_url} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                        {goal.original_url && goal.original_url !== "#" && (
                          <a href={goal.original_url} target="_blank" rel="noopener noreferrer" className="absolute top-1 right-1 bg-black/80 p-1 rounded-md text-white hover:text-green-400">
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <h4 className="font-bold text-sm text-white line-clamp-1">{goal.title}</h4>
                        <div className="flex justify-between items-end mt-1">
                          <p className="text-white/50 text-xs">{goal.price} {goal.currency} <span className="font-bold text-white">x {goal.quantity || 1}</span></p>
                          <p className="text-green-400 font-bold text-sm">{parsePrice(goal.price) * (goal.quantity || 1)} {goal.currency}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== DREAMS ===================== */}
        {activeTab === "dreams" && (
          <div className="animate-in fade-in space-y-6">
            <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">High-Ticket Evolution</h2>
            {dreamItems.map((goal) => {
              const targetPrice = (parsePrice(goal.price) * (goal.quantity || 1)) || 1; 
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
                      <span className="font-bold text-white text-lg">{targetPrice} {goal.currency}</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-6 border border-white/5">
                      <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${itemProgress}%` }}></div>
                    </div>
                    <button onClick={() => handleFundGoal(goal.id, 500)} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl">+ 500 Allocation</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===================== VAULT ===================== */}
        {activeTab === "vault" && (
          <div className="animate-in fade-in space-y-6">
            
            {/* Total Rebuild Pool */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-3xl p-6 shadow-lg flex items-center justify-between">
              <div>
                <h3 className="text-green-400 font-bold text-sm">Total Rebuild Pool</h3>
                <p className="text-green-400/60 text-xs">Available to deploy</p>
              </div>
              {isEditingPool ? (
                <div className="flex items-center gap-2">
                  <input type="number" value={poolEditValue} onChange={(e) => setPoolEditValue(e.target.value)} className="w-24 bg-black/40 border border-green-500/50 rounded-xl px-3 py-1 text-green-400 font-black text-xl outline-none" autoFocus />
                  <button onClick={handleSavePoolEdit} className="p-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/40"><Save size={16} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-green-400">E£{rebuildPool}</span>
                  <button onClick={() => { setPoolEditValue(rebuildPool.toString()); setIsEditingPool(true); }} className="text-green-400/50 hover:text-green-400"><Edit2 size={16} /></button>
                </div>
              )}
            </div>

            {/* Active Debt / Liability Target */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Liability Target</h2>
                <button onClick={openDebtEditor} className="text-white/40 hover:text-white flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"><Edit2 size={12} /> {activeDebt ? 'Edit' : 'Set'}</button>
              </div>

              {isEditingDebt ? (
                <form onSubmit={handleSaveDebt} className="flex flex-col gap-3 animate-in fade-in">
                  <input type="text" value={debtNameInput} onChange={(e) => setDebtNameInput(e.target.value)} placeholder="Objective Name (e.g. Credit Card)" className="bg-black/20 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm outline-none" required />
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1 pl-1">Target Amount</label>
                      <input type="number" value={debtTargetInput} onChange={(e) => setDebtTargetInput(e.target.value)} placeholder="Total Amount" className="w-full bg-black/20 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm outline-none" required />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1 pl-1">Amount Paid</label>
                      <input type="number" value={debtPaidInput} onChange={(e) => setDebtPaidInput(e.target.value)} placeholder="Paid so far" className="w-full bg-black/20 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1 pl-1">Deadline</label>
                    <input type="date" value={debtDeadlineInput} onChange={(e) => setDebtDeadlineInput(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm outline-none" required />
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={() => setIsEditingDebt(false)} className="flex-1 bg-white/5 border border-white/10 text-white font-bold py-3.5 rounded-2xl">Cancel</button>
                    <button type="submit" className="flex-1 bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3.5 rounded-2xl">Save Liability</button>
                  </div>
                  {activeDebt && <button type="button" onClick={() => { saveDebtToLocal(null); setIsEditingDebt(false); }} className="w-full text-red-500/50 hover:text-red-400 text-xs font-bold py-2 mt-2">Delete Liability</button>}
                </form>
              ) : activeDebt ? (
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-xl font-bold text-white line-clamp-1">{activeDebt.name}</span>
                    <span className="text-red-400 font-bold tabular-nums shrink-0 ml-4">{activeDebt.amount_paid} / {activeDebt.target_amount}</span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 mb-4">
                    <div className="h-full bg-red-500" style={{ width: `${Math.min((activeDebt.amount_paid / activeDebt.target_amount) * 100, 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center bg-black/20 rounded-xl p-3 border border-white/5">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Time Remaining</p>
                      <p className="text-white font-bold text-sm">{wednesdaysLeft} Wednesdays</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Required Deduction</p>
                      <p className="text-red-400 font-bold text-sm">E£{weeklyDebtCut} / week</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-white/40 text-sm">No active liabilities tracked.</p>
              )}
            </div>

            {/* Payday Engine */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-lg">
              <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Expected Payout Log</h2>
              <form onSubmit={handleLogIncome} className="flex flex-col gap-4">
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                  <div>
                    <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Amount</label>
                    <input type="number" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} className="w-full bg-transparent text-3xl font-bold text-white outline-none" placeholder="0" required />
                  </div>
                  {incomeAmount && activeDebt && remainingDebt > 0 && (
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-red-400/80 uppercase font-bold tracking-widest">Debt Cut</p>
                      <p className="text-red-400 font-bold">- {Math.min(weeklyDebtCut, parseInt(incomeAmount), remainingDebt)}</p>
                    </div>
                  )}
                </div>
                <button type="submit" className="w-full bg-green-500 text-black py-4 rounded-2xl font-bold text-lg">Route Funds</button>
              </form>
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
                  <option value="One-Off">One-Off (Buy Once)</option>
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
                <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10">
                  <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Project / Outfit Name</label>
                  <input type="text" value={subGroupInput} onChange={(e) => setSubGroupInput(e.target.value)} placeholder="e.g. Paint Job" className="w-full bg-transparent text-white font-bold outline-none" />
                </div>
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
                <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Unit Price</label>
                <input type="text" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} placeholder="0.00" className="w-full bg-transparent text-2xl font-black text-green-400 outline-none" required />
              </div>
              <div className="w-1/4 bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col justify-center">
                <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Qty</label>
                <input type="number" min="1" value={quantityInput} onChange={(e) => setQuantityInput(e.target.value)} className="w-full bg-transparent text-xl font-bold text-white outline-none" required />
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
      {activeTab !== "vault" && (
        <button onClick={() => { closeModal(); setShowFabModal(true); }} className="fixed bottom-28 right-6 w-14 h-14 bg-green-500 text-black rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(34,197,94,0.4)] z-40">
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* BOTTOM NAV */}
      <div className="fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-[#1c1c1e]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] px-4 py-2.5 flex justify-between items-center shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
          {[{ id: 'inventory', icon: Package, label: 'Inventory' }, { id: 'boards', icon: LayoutGrid, label: 'Boards' }, { id: 'dreams', icon: Sparkles, label: 'Dreams' }, { id: 'vault', icon: Wallet, label: 'Vault' }].map((item) => (
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