"use client";
import { useState, useEffect } from "react";
import { Wallet, Map, Activity, ShieldCheck, Plus, X, ArrowRight, CheckSquare, Square } from 'lucide-react';

interface Goal {
  id: number;
  title: string;
  price: string;
  currency: string;
  category: string;
  tier: string;
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
  const [activeTab, setActiveTab] = useState<"vault" | "roadmap" | "systems" | "admin">("vault");
  const [activeTier, setActiveTier] = useState<"NOW" | "NEXT" | "LATER" | "DREAM">("NOW");
  const [showFabModal, setShowFabModal] = useState(false);
  
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState<{ title: string; image_url: string; price: string; original_url: string } | null>(null);
  const [currency, setCurrency] = useState("EGP");
  const [category, setCategory] = useState("Maintenance");
  const [tier, setTier] = useState("NOW");
  const [goals, setGoals] = useState<Goal[]>([]);
  
  const [incomeAmount, setIncomeAmount] = useState("");
  const [paydayResult, setPaydayResult] = useState<{ debt_cleared_this_week: number; unlocked_rebuild_funds: number; remaining_debt_balance: number } | null>(null);

  const [activeDebt, setActiveDebt] = useState<Debt | null>(null);
  const [debtName, setDebtName] = useState("");
  const [debtTarget, setDebtTarget] = useState("");
  const [debtDeadline, setDebtDeadline] = useState("");

  const [routines, setRoutines] = useState([
    { id: 1, text: 'Morning: Cleanser → Moisturizer → Sunscreen', done: false },
    { id: 2, text: 'Night: Cleanser → Moisturizer', done: false },
    { id: 3, text: 'Sunday: Clean Sheets & Desk Reset', done: false },
    { id: 4, text: 'Sunday: Nails, Beard Shape, Exfoliate', done: false },
  ]);

  const API_URL = "https://reyvelour-life-transformer-api.hf.space";

  const fetchData = async () => {
    try {
      const [goalsRes, debtRes] = await Promise.all([
        fetch(`${API_URL}/goals`),
        fetch(`${API_URL}/debts/active`)
      ]);
      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (debtRes.ok) setActiveDebt(await debtRes.json());
    } catch (error) { console.error("Fetch failed", error); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeAmount) return;
    try {
      const res = await fetch(`${API_URL}/income/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseInt(incomeAmount) }),
      });
      if (res.ok) {
        setPaydayResult(await res.json());
        setIncomeAmount("");
        fetchData();
      }
    } catch (error) {}
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        setItem(await res.json());
        setUrl("");
      }
    } catch (error) {}
    setLoading(false);
  };

  const handleSaveGoal = async () => {
    if (!item) return;
    try {
      const res = await fetch(`${API_URL}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, currency, category, tier }),
      });
      if (res.ok) {
        setItem(null);
        setShowFabModal(false);
        fetchData();
      }
    } catch (error) {}
  };

  const handleFundGoal = async (id: number, amount: number) => {
    try {
      const res = await fetch(`${API_URL}/goals/${id}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) fetchData();
    } catch (error) {}
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/debts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: debtName, target_amount: parseInt(debtTarget), deadline: debtDeadline }),
      });
      if (res.ok) {
        setDebtName(""); setDebtTarget(""); setDebtDeadline("");
        fetchData();
      }
    } catch (error) {}
  };

  const toggleRoutine = (id: number) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    setRoutines(routines.map(r => r.id === id ? { ...r, done: !r.done } : r));
  };

  const filteredGoals = goals.filter(g => g.tier === activeTier);

  const navItems = [
    { id: 'vault', icon: Wallet, label: 'Vault' },
    { id: 'roadmap', icon: Map, label: 'Roadmap' },
    { id: 'systems', icon: Activity, label: 'Systems' },
    { id: 'admin', icon: ShieldCheck, label: 'Admin' }
  ];

  return (
    <div className="bg-black min-h-screen text-white font-sans overflow-x-hidden pb-32">
      
      {/* Dynamic Header */}
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
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5 focus-within:border-green-500/50 transition-colors">
                  <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Total Expected Income</label>
                  <input
                    type="number"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                    className="w-full bg-transparent text-3xl font-bold text-white outline-none placeholder:text-white/25"
                    placeholder="0"
                    required
                  />
                </div>
                <button type="submit" className="w-full bg-green-500 text-black py-4 rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:bg-green-400 transition-all">
                  Execute Route
                </button>
              </form>
            </div>

            {paydayResult && (
              <div className="bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white/60 font-medium text-sm">Debt Cleared</span>
                  <span className="text-red-400 font-bold text-xl tabular-nums">-{paydayResult.debt_cleared_this_week}</span>
                </div>
                <div className="h-px w-full bg-white/5 mb-4"></div>
                <div className="flex justify-between items-center">
                  <span className="text-white/90 font-bold">Unlocked Rebuild Pool</span>
                  <span className="text-green-400 font-black text-4xl tabular-nums">+{paydayResult.unlocked_rebuild_funds}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== ROADMAP ===================== */}
        {activeTab === "roadmap" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-2 snap-x">
              {["NOW", "NEXT", "LATER", "DREAM"].map((t) => (
                <button 
                  key={t} onClick={() => setActiveTier(t as any)}
                  className={`snap-center shrink-0 px-5 py-2.5 rounded-[1.25rem] text-xs font-bold tracking-wide transition-all border ${
                    activeTier === t ? 'bg-green-500 border-green-400 text-black shadow-lg' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {t} Phase
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
              {filteredGoals.map((goal) => {
                const targetPrice = parseFloat(goal.price.replace(/[^0-9.-]+/g,"")) || 1; 
                const progressPercent = Math.min((goal.funded_amount / targetPrice) * 100, 100);

                return (
                  <div key={goal.id} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-lg">
                    <a href={goal.original_url} target="_blank" rel="noopener noreferrer" className="h-56 w-full bg-black/40 relative block">
                      <img src={goal.image_url} className="absolute inset-0 w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold text-green-400 uppercase tracking-widest">
                        {goal.category}
                      </div>
                    </a>
                    <div className="p-5">
                      <h3 className="font-bold text-lg line-clamp-2 mb-6 text-white leading-tight">{goal.title}</h3>
                      
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-white/50 text-xs font-bold tracking-wider">{goal.currency === "EGP" ? "E£" : "$"}{goal.funded_amount} SAVED</span>
                        <span className="font-bold text-white text-lg">{goal.price}</span>
                      </div>
                      
                      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-6 border border-white/5">
                        <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleFundGoal(goal.id, 50)} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-2xl transition-all">
                          + 50
                        </button>
                        <button onClick={() => handleFundGoal(goal.id, 200)} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-2xl transition-all">
                          + 200
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredGoals.length === 0 && (
                <div className="h-48 flex items-center justify-center border border-dashed border-white/10 rounded-3xl mt-4">
                  <p className="text-white/50 text-sm">No items in this phase.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== SYSTEMS ===================== */}
        {activeTab === "systems" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
            {routines.map(item => (
              <button 
                key={item.id}
                onClick={() => toggleRoutine(item.id)}
                className={`flex items-center gap-4 w-full text-left p-5 rounded-3xl border transition-all duration-300 ${
                  item.done 
                    ? 'bg-white/5 border-white/5 opacity-50' 
                    : 'bg-white/10 backdrop-blur-xl border-white/10 shadow-lg'
                }`}
              >
                {item.done ? <CheckSquare className="text-green-400" size={24} /> : <Square className="text-white/40" size={24} />}
                <span className={`${item.done ? 'line-through text-white/30' : 'text-white/90'} text-sm font-medium`}>{item.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* ===================== ADMIN ===================== */}
        {activeTab === "admin" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-lg">
              <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Active Liability Target</h2>
              {activeDebt ? (
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-xl font-bold text-white">{activeDebt.name}</span>
                    <span className="text-red-400 font-bold tabular-nums">{activeDebt.amount_paid} / {activeDebt.target_amount}</span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${Math.min((activeDebt.amount_paid / activeDebt.target_amount) * 100, 100)}%` }}></div>
                  </div>
                </div>
              ) : (
                <p className="text-white/40 text-sm">No active debt tracking.</p>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-lg">
              <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Initialize Liability</h2>
              <form onSubmit={handleCreateDebt} className="flex flex-col gap-4">
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                  <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Objective Name</label>
                  <input type="text" value={debtName} onChange={(e) => setDebtName(e.target.value)} className="w-full bg-transparent font-bold text-white outline-none" required />
                </div>
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                  <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Total Target</label>
                  <input type="number" value={debtTarget} onChange={(e) => setDebtTarget(e.target.value)} className="w-full bg-transparent font-bold text-white outline-none" required />
                </div>
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                  <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Deadline</label>
                  <input type="date" value={debtDeadline} onChange={(e) => setDebtDeadline(e.target.value)} className="w-full bg-transparent font-bold text-white outline-none" required />
                </div>
                <button type="submit" className="w-full bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-4 rounded-2xl mt-2 flex items-center justify-center gap-2">
                  Lock Target <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* FAB MODAL */}
      {showFabModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-50 p-6 flex flex-col animate-in fade-in">
          <div className="flex justify-between items-center mb-8 mt-4">
            <h3 className="text-2xl font-bold text-white tracking-tight">Add to Blueprint</h3>
            <button aria-label="Close" onClick={() => {setShowFabModal(false); setItem(null);}} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <X size={20} className="text-white" />
            </button>
          </div>
          
          <div className="flex-1">
            {!item ? (
              <form onSubmit={handleExtract} className="flex gap-2">
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste link here..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-green-500 transition-colors text-white" required />
                <button type="submit" disabled={loading} className="bg-white text-black px-6 py-4 rounded-2xl font-bold">{loading ? "..." : "Pull"}</button>
              </form>
            ) : (
              <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Title</label>
                  <input type="text" value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} className="w-full bg-transparent text-lg font-bold text-white outline-none" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10">
                    <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Phase</label>
                    <select value={tier} onChange={(e) => setTier(e.target.value)} className="w-full bg-transparent text-white font-bold outline-none appearance-none">
                      <option value="NOW">NOW</option>
                      <option value="NEXT">NEXT</option>
                      <option value="LATER">LATER</option>
                      <option value="DREAM">DREAM</option>
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
                  <div className="flex-1 bg-black/20 rounded-2xl p-4 border border-green-500/30 flex items-center justify-center">
                    <span className="text-2xl font-black text-green-400">{item.price}</span>
                  </div>
                </div>
                <button onClick={handleSaveGoal} className="w-full bg-green-500 hover:bg-green-400 text-black py-4 rounded-2xl font-bold mt-4 text-lg transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                  Lock into Roadmap
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      {activeTab === "roadmap" && (
        <button 
          onClick={() => setShowFabModal(true)}
          className="fixed bottom-28 right-6 w-14 h-14 bg-green-500 text-black rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(34,197,94,0.4)] hover:scale-105 transition-transform z-40"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* FLOATING BOTTOM NAV PILL */}
      <div className="fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-[#1c1c1e]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] px-4 py-2.5 flex justify-between items-center shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-300 ${
                activeTab === item.id 
                  ? 'text-white scale-105' 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <item.icon size={22} strokeWidth={2.5} className={activeTab === item.id ? "text-green-400" : ""} />
              <span className="text-[9px] font-bold tracking-wide mt-0.5 uppercase">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}