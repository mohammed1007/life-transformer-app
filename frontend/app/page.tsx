"use client";
import { useState, useEffect } from "react";

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

  const filteredGoals = goals.filter(g => g.tier === activeTier);

  return (
    <main className="min-h-screen bg-black text-white font-sans pb-24">
      
      {/* HEADER */}
      <header className="bg-neutral-900 border-b border-neutral-800 p-6 sticky top-0 z-40">
        <h1 className="text-2xl font-bold tracking-tight capitalize">{activeTab}</h1>
      </header>

      <div className="p-6 w-full max-w-3xl mx-auto">
        
        {/* ===================== VAULT ===================== */}
        {activeTab === "vault" && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-neutral-900 rounded-3xl p-6 shadow-2xl mb-8 border border-neutral-800">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-6">Financial Command</h2>
              <form onSubmit={handleLogIncome} className="flex flex-col gap-4 mb-6">
                <input
                  type="number"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  placeholder="Enter Wednesday Payout..."
                  className="w-full bg-black border border-neutral-800 rounded-xl px-5 py-4 text-lg focus:outline-none focus:border-green-500"
                  required
                />
                <button type="submit" className="w-full bg-green-500 text-black py-4 rounded-xl font-bold text-lg">
                  Execute Split
                </button>
              </form>

              {paydayResult && (
                <div className="bg-black rounded-2xl p-5 border border-neutral-800">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-neutral-400">Debt Cleared</span>
                    <span className="text-red-400 font-bold text-lg">-{paydayResult.debt_cleared_this_week}</span>
                  </div>
                  <div className="h-px w-full bg-neutral-800 mb-3"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-200 font-semibold">Available Rebuild Pool</span>
                    <span className="text-green-400 font-black text-3xl">+{paydayResult.unlocked_rebuild_funds}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== ROADMAP ===================== */}
        {activeTab === "roadmap" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex bg-neutral-900 rounded-xl p-1 mb-6">
              {["NOW", "NEXT", "LATER", "DREAM"].map((t) => (
                <button 
                  key={t} onClick={() => setActiveTier(t as any)}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${activeTier === t ? "bg-neutral-700 text-white" : "text-neutral-500"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredGoals.map((goal) => {
                const targetPrice = parseFloat(goal.price.replace(/[^0-9.-]+/g,"")) || 1; 
                const progressPercent = Math.min((goal.funded_amount / targetPrice) * 100, 100);

                return (
                  <div key={goal.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden flex flex-col">
                    <a href={goal.original_url} target="_blank" rel="noopener noreferrer" className="h-48 w-full bg-neutral-800 relative block">
                      <img src={goal.image_url} className="absolute inset-0 w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                    </a>
                    <div className="p-5 flex flex-col flex-1">
                      <span className="text-xs font-bold text-green-500 mb-2 uppercase">{goal.category}</span>
                      <h3 className="font-semibold text-sm line-clamp-2 mb-4 text-white">{goal.title}</h3>
                      <div className="mt-auto">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-neutral-400">{goal.currency === "EGP" ? "E£" : "$"}{goal.funded_amount}</span>
                          <span className="font-bold text-white">{goal.price}</span>
                        </div>
                        <div className="h-2 w-full bg-black rounded-full overflow-hidden mb-4">
                          <div className="h-full bg-green-500 transition-all" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => handleFundGoal(goal.id, 50)} className="bg-neutral-800 text-white text-xs font-bold py-3 rounded-xl">+ 50</button>
                          <button onClick={() => handleFundGoal(goal.id, 200)} className="bg-neutral-800 text-white text-xs font-bold py-3 rounded-xl">+ 200</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== SYSTEMS ===================== */}
        {activeTab === "systems" && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-bold mb-4">Phase 1 Execution</h2>
            <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 mb-4">
              <h3 className="text-green-400 font-bold mb-2">Morning Protocol</h3>
              <ul className="text-sm text-neutral-300 space-y-2">
                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-neutral-600 rounded-full"></div>Cleanser &rarr; Moisturizer &rarr; Sunscreen</li>
                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-neutral-600 rounded-full"></div>Gym / Hypertrophy Split</li>
              </ul>
            </div>
            <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800">
              <h3 className="text-blue-400 font-bold mb-2">Sunday Reset</h3>
              <ul className="text-sm text-neutral-300 space-y-2">
                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-neutral-600 rounded-full"></div>Clean Sheets & Desk Vacuum</li>
                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-neutral-600 rounded-full"></div>Nails, Beard Shape, Exfoliation</li>
              </ul>
            </div>
          </div>
        )}

        {/* ===================== ADMIN ===================== */}
        {activeTab === "admin" && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 mb-6">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">Active Liability</h2>
              {activeDebt ? (
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xl font-bold text-white">{activeDebt.name}</span>
                    <span className="text-red-400 font-bold">{activeDebt.amount_paid} / {activeDebt.target_amount}</span>
                  </div>
                  <div className="h-2 w-full bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${Math.min((activeDebt.amount_paid / activeDebt.target_amount) * 100, 100)}%` }}></div>
                  </div>
                </div>
              ) : (
                <p className="text-neutral-500 text-sm">No active debt tracking.</p>
              )}
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">Initialize Debt</h2>
              <form onSubmit={handleCreateDebt} className="flex flex-col gap-4">
                <input type="text" value={debtName} onChange={(e) => setDebtName(e.target.value)} placeholder="Objective Name" className="bg-black border border-neutral-800 rounded-xl px-4 py-3" required />
                <input type="number" value={debtTarget} onChange={(e) => setDebtTarget(e.target.value)} placeholder="Total Target Amount" className="bg-black border border-neutral-800 rounded-xl px-4 py-3" required />
                <input type="date" value={debtDeadline} onChange={(e) => setDebtDeadline(e.target.value)} className="bg-black border border-neutral-800 rounded-xl px-4 py-3 text-white" required />
                <button type="submit" className="bg-red-500 text-white font-bold py-3 rounded-xl mt-2">Set Liability</button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* FAB MODAL FOR ADDING ITEMS */}
      {showFabModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-neutral-900 w-full max-w-md rounded-3xl p-6 border border-neutral-800 mb-20 sm:mb-0">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-lg">Add to Blueprint</h2>
              <button onClick={() => {setShowFabModal(false); setItem(null);}} className="text-neutral-500">Close</button>
            </div>
            
            {!item ? (
              <form onSubmit={handleExtract} className="flex gap-2">
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://amazon..." className="flex-1 bg-black border border-neutral-800 rounded-xl px-4 py-3" required />
                <button type="submit" disabled={loading} className="bg-white text-black px-6 py-3 rounded-xl font-medium">{loading ? "..." : "Pull"}</button>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <input type="text" value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} className="bg-black rounded-xl px-4 py-3" />
                <div className="flex gap-2">
                  <select value={tier} onChange={(e) => setTier(e.target.value)} className="flex-1 bg-black rounded-xl px-4 py-3 border border-neutral-800">
                    <option value="NOW">NOW (Basics)</option>
                    <option value="NEXT">NEXT (Room)</option>
                    <option value="LATER">LATER (Wardrobe)</option>
                    <option value="DREAM">DREAM (Laser/Procedures)</option>
                  </select>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1 bg-black rounded-xl px-4 py-3 border border-neutral-800">
                    <option value="Maintenance">Maintenance</option>
                    <option value="Room">Room</option>
                    <option value="Body">Body</option>
                    <option value="Procedure">Procedure</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-black rounded-xl px-4 py-3 border border-neutral-800">
                    <option value="EGP">EGP</option><option value="USD">USD</option>
                  </select>
                  <div className="flex-1 bg-black rounded-xl px-4 py-3 text-center text-green-400 font-bold">{item.price}</div>
                </div>
                <button onClick={handleSaveGoal} className="w-full bg-green-500 text-black py-4 rounded-xl font-bold mt-2">Lock into Roadmap</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON (FAB) */}
      {activeTab === "roadmap" && (
        <button 
          onClick={() => setShowFabModal(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-lg text-2xl font-light hover:scale-105 transition-transform z-40"
        >
          +
        </button>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 w-full bg-neutral-900 border-t border-neutral-800 flex justify-around pb-8 pt-4 px-2 z-40">
        {[
          { id: "vault", label: "Vault", icon: "⛑️" },
          { id: "roadmap", label: "Roadmap", icon: "🗺️" },
          { id: "systems", label: "Systems", icon: "⚙️" },
          { id: "admin", label: "Admin", icon: "🏢" }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 transition-opacity ${activeTab === tab.id ? "opacity-100" : "opacity-40"}`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}