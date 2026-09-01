"use client";
import { useState, useEffect } from "react";
import { Wallet, Map, Activity, ShieldCheck, Plus, X, ArrowRight, CheckSquare, Square, Package, AlertTriangle, XCircle, ShoppingCart } from 'lucide-react';

interface Goal {
  id: number;
  title: string;
  price: string;
  currency: string;
  category: string;
  tier: string;
  stock_status: "IN_STOCK" | "LOW" | "OUT";
  image_url: string;
  original_url: string;
  funded_amount: number;
}

interface Debt {
  id: number;
  name: string;
  target_amount: number;
  amount_paid: number;
  deadline: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"vault" | "roadmap" | "systems" | "admin">("roadmap");
  const [activeTier, setActiveTier] = useState<"NOW" | "NEXT" | "LATER" | "DREAM">("NOW");
  const [showFabModal, setShowFabModal] = useState(false);
  
  const [url, setUrl] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [imageInput, setImageInput] = useState("");
  
  const [currency, setCurrency] = useState("EGP");
  const [category, setCategory] = useState("Maintenance");
  const [tier, setTier] = useState("NOW");
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeDebt, setActiveDebt] = useState<Debt | null>(null);
  
  const [incomeAmount, setIncomeAmount] = useState("");
  const [paydayResult, setPaydayResult] = useState<{ debt_cleared_this_week: number; unlocked_rebuild_funds: number } | null>(null);

  const [routines, setRoutines] = useState([
    { id: 1, text: 'Morning: Cleanser → Moisturizer → Sunscreen', done: false },
    { id: 2, text: 'Night: Cleanser → Moisturizer', done: false },
    { id: 3, text: 'Sunday: Clean Sheets & Desk Reset', done: false },
    { id: 4, text: 'Sunday: Nails, Beard Shape, Exfoliate', done: false },
  ]);

  const API_URL = "https://reyvelour-life-transformer-api.hf.space";

  const fetchData = async () => {
    try {
      const [goalsRes, debtRes] = await Promise.all([fetch(`${API_URL}/goals`), fetch(`${API_URL}/debts/active`)]);
      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (debtRes.ok) setActiveDebt(await debtRes.json());
    } catch (error) {}
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeAmount) return;
    try {
      const res = await fetch(`${API_URL}/income/log`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseInt(incomeAmount) }),
      });
      if (res.ok) { setPaydayResult(await res.json()); setIncomeAmount(""); fetchData(); }
    } catch (error) {}
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput || !priceInput) return;

    try {
      const res = await fetch(`${API_URL}/goals`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: titleInput, 
          price: priceInput, 
          currency, 
          category, 
          tier, 
          image_url: imageInput || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
          original_url: url || "#"
        }),
      });
      if (res.ok) { 
        setTitleInput(""); 
        setPriceInput(""); 
        setImageInput(""); 
        setUrl("");
        setShowFabModal(false); 
        fetchData(); 
      }
    } catch (error) {}
  };

  const handleFundGoal = async (id: number, amount: number) => {
    await fetch(`${API_URL}/goals/${id}/fund`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    fetchData();
  };

  const toggleStockStatus = async (goal: Goal) => {
    const sequence: Record<string, string> = { "IN_STOCK": "LOW", "LOW": "OUT", "OUT": "IN_STOCK" };
    const newStatus = sequence[goal.stock_status || "IN_STOCK"];
    
    setGoals(goals.map(g => g.id === goal.id ? { ...g, stock_status: newStatus as any } : g));
    
    await fetch(`${API_URL}/goals/${goal.id}/stock`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  const filteredGoals = goals.filter(g => g.tier === activeTier);
  
  const restockCostEGP = goals.filter(g => g.tier === "NOW" && g.stock_status !== "IN_STOCK" && g.currency === "EGP")
    .reduce((sum, g) => sum + (parseFloat(g.price.replace(/[^0-9.-]+/g,"")) || 0), 0);

  const navItems = [
    { id: 'vault', icon: Wallet, label: 'Vault' },
    { id: 'roadmap', icon: Map, label: 'Roadmap' },
    { id: 'systems', icon: Activity, label: 'Systems' },
    { id: 'admin', icon: ShieldCheck, label: 'Admin' }
  ];

  return (
    <div className="bg-black min-h-screen text-white font-sans overflow-x-hidden pb-32">
      
      <header className="pt-12 pb-6 px-6 sticky top-0 bg-black/80 backdrop-blur-xl z-40">
        <h1 className="text-3xl font-bold tracking-tight capitalize">{activeTab}</h1>
      </header>

      <main className="px-6 w-full max-w-xl mx-auto">
        
        {/* ===================== VAULT ===================== */}
        {activeTab === "vault" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-lg">
              <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Monday Split Engine</h2>
              <form onSubmit={handleLogIncome} className="flex flex-col gap-4">
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                  <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Expected Payout</label>
                  <input type="number" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} className="w-full bg-transparent text-3xl font-bold text-white outline-none placeholder:text-white/25" placeholder="0" required />
                </div>
                <button type="submit" className="w-full bg-green-500 text-black py-4 rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:bg-green-400">Route Funds</button>
              </form>
            </div>
            {paydayResult && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-4"><span className="text-white/60 text-sm">Debt Cleared</span><span className="text-red-400 font-bold text-xl tabular-nums">-{paydayResult.debt_cleared_this_week}</span></div>
                <div className="flex justify-between items-center"><span className="text-white/90 font-bold">Unlocked Rebuild Pool</span><span className="text-green-400 font-black text-4xl tabular-nums">+{paydayResult.unlocked_rebuild_funds}</span></div>
              </div>
            )}
          </div>
        )}

        {/* ===================== ROADMAP ===================== */}
        {activeTab === "roadmap" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-2 snap-x">
              {["NOW", "NEXT", "LATER", "DREAM"].map((t) => (
                <button key={t} onClick={() => setActiveTier(t as any)} className={`snap-center shrink-0 px-5 py-2.5 rounded-[1.25rem] text-xs font-bold tracking-wide transition-all border ${activeTier === t ? 'bg-green-500 border-green-400 text-black shadow-lg' : 'bg-white/5 border-white/10 text-white/60'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* THE INVENTORY VIEW (NOW TIER ONLY) */}
            {activeTier === "NOW" ? (
              <div className="space-y-4">
                {restockCostEGP > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="text-amber-400" size={24} />
                      <div>
                        <h3 className="text-white font-bold text-sm">Upcoming Restock</h3>
                        <p className="text-amber-400/80 text-xs font-medium">Allocate from next payout</p>
                      </div>
                    </div>
                    <span className="text-2xl font-black text-amber-400">E£{restockCostEGP}</span>
                  </div>
                )}
                
                {filteredGoals.map((goal) => (
                  <div key={goal.id} className="bg-white/5 border border-white/10 rounded-3xl p-4 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-black/40 overflow-hidden shrink-0">
                      <img src={goal.image_url} className="w-full h-full object-cover opacity-80" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm text-white line-clamp-1">{goal.title}</h3>
                      <span className="text-white/50 text-xs font-bold">{goal.price} {goal.currency}</span>
                    </div>
                    <button 
                      onClick={() => toggleStockStatus(goal)}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 min-w-17.5 transition-all border ${
                        goal.stock_status === 'LOW' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                        goal.stock_status === 'OUT' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                        'bg-green-500/20 border-green-500/30 text-green-400'
                      }`}
                    >
                      {goal.stock_status === 'LOW' ? <AlertTriangle size={18} /> :
                       goal.stock_status === 'OUT' ? <XCircle size={18} /> :
                       <Package size={18} />}
                      <span className="text-[9px] font-bold tracking-widest uppercase">
                        {goal.stock_status === 'LOW' ? 'LOW' : goal.stock_status === 'OUT' ? 'EMPTY' : 'STOCK'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              
              /* THE WISHLIST VIEW (NEXT, LATER, DREAM) */
              <div className="grid grid-cols-1 gap-6">
                {filteredGoals.map((goal) => {
                  const targetPrice = parseFloat(goal.price.replace(/[^0-9.-]+/g,"")) || 1; 
                  const progressPercent = Math.min((goal.funded_amount / targetPrice) * 100, 100);
                  return (
                    <div key={goal.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-lg">
                      <div className="h-48 w-full bg-black/40 relative block">
                        <img src={goal.image_url} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-lg line-clamp-2 mb-4 text-white leading-tight">{goal.title}</h3>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-white/50 text-xs font-bold">{goal.currency === "EGP" ? "E£" : "$"}{goal.funded_amount} SAVED</span>
                          <span className="font-bold text-white text-lg">{goal.price} {goal.currency}</span>
                        </div>
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-6 border border-white/5">
                          <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
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

        {/* ===================== SYSTEMS ===================== */}
        {activeTab === "systems" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
            {routines.map(item => (
              <button key={item.id} onClick={() => setRoutines(routines.map(r => r.id === item.id ? { ...r, done: !r.done } : r))} className={`flex items-center gap-4 w-full text-left p-5 rounded-3xl border transition-all duration-300 ${item.done ? 'bg-white/5 border-white/5 opacity-50' : 'bg-white/10 border-white/10'}`}>
                {item.done ? <CheckSquare className="text-green-400" size={24} /> : <Square className="text-white/40" size={24} />}
                <span className={`${item.done ? 'line-through text-white/30' : 'text-white/90'} text-sm font-medium`}>{item.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* ===================== ADMIN ===================== */}
        {activeTab === "admin" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-lg">
              <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Active Liability Target</h2>
              {activeDebt ? (
                <div>
                  <div className="flex justify-between items-end mb-3"><span className="text-xl font-bold text-white">{activeDebt.name}</span><span className="text-red-400 font-bold tabular-nums">{activeDebt.amount_paid} / {activeDebt.target_amount}</span></div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-red-500" style={{ width: `${Math.min((activeDebt.amount_paid / activeDebt.target_amount) * 100, 100)}%` }}></div>
                  </div>
                </div>
              ) : <p className="text-white/40 text-sm">No active debt tracking.</p>}
            </div>
          </div>
        )}
      </main>

      {/* FAB MODAL FOR DIRECT MANUAL ENTRY */}
      {showFabModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-50 p-6 flex flex-col animate-in fade-in overflow-y-auto">
          <div className="flex justify-between items-center mb-6 mt-4">
            <h3 className="text-2xl font-bold text-white tracking-tight">Add Item Manually</h3>
            <button aria-label="Close" onClick={() => setShowFabModal(false)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={20} className="text-white" /></button>
          </div>
          
          <form onSubmit={handleSaveGoal} className="flex flex-col gap-4 pb-12">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Product Title</label>
              <input type="text" value={titleInput} onChange={(e) => setTitleInput(e.target.value)} placeholder="e.g. Daily Moisturizer or MSI Laptop" className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-white/20" required />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10">
                <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Phase / Tier</label>
                <select value={tier} onChange={(e) => setTier(e.target.value)} className="w-full bg-transparent text-white font-bold outline-none appearance-none">
                  <option value="NOW">NOW (Inventory / Essentials)</option>
                  <option value="NEXT">NEXT (Short-term Wishlist)</option>
                  <option value="LATER">LATER (Medium-term)</option>
                  <option value="DREAM">DREAM (Major Goals)</option>
                </select>
              </div>
              <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10">
                <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-transparent text-white font-bold outline-none appearance-none">
                  <option value="Maintenance">Maintenance</option>
                  <option value="Room">Room</option>
                  <option value="Body">Body</option>
                  <option value="Procedure">Procedure</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-1/3 bg-white/5 rounded-2xl p-4 border border-white/10">
                <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full bg-transparent text-white font-bold outline-none appearance-none">
                  <option value="EGP">EGP</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="flex-1 bg-black/20 rounded-2xl p-4 border border-green-500/30 flex flex-col justify-center">
                <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Price</label>
                <input type="text" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} placeholder="0.00" className="w-full bg-transparent text-2xl font-black text-green-400 outline-none placeholder:text-green-900" required />
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Product Link (Optional Reference)</label>
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://noon.com/..." className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/20" />
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Image URL (Optional)</label>
              <input type="url" value={imageInput} onChange={(e) => setImageInput(e.target.value)} placeholder="Paste copied image address..." className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/20" />
            </div>

            <button type="submit" className="w-full bg-green-500 hover:bg-green-400 text-black py-4 rounded-2xl font-bold mt-4 text-lg transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              Lock into Roadmap
            </button>
          </form>
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      {activeTab === "roadmap" && (
        <button onClick={() => setShowFabModal(true)} className="fixed bottom-28 right-6 w-14 h-14 bg-green-500 text-black rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(34,197,94,0.4)] hover:scale-105 transition-transform z-40">
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* FLOATING BOTTOM NAV PILL */}
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