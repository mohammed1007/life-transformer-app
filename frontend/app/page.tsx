"use client";
import { useState, useEffect } from "react";

interface Goal {
  id: number;
  title: string;
  price: string;
  currency: string;
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
  const [activeTab, setActiveTab] = useState<"board" | "settings">("board");
  
  // Vision Board State
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState<{ title: string; image_url: string; price: string; original_url: string } | null>(null);
  const [currency, setCurrency] = useState("EGP");
  const [goals, setGoals] = useState<Goal[]>([]);
  
  // Payday Engine State
  const [incomeAmount, setIncomeAmount] = useState("");
  const [paydayResult, setPaydayResult] = useState<{ debt_cleared_this_week: number; unlocked_rebuild_funds: number; remaining_debt_balance: number } | null>(null);

  // Settings State
  const [activeDebt, setActiveDebt] = useState<Debt | null>(null);
  const [debtName, setDebtName] = useState("");
  const [debtTarget, setDebtTarget] = useState("");
  const [debtDeadline, setDebtDeadline] = useState("");

  const API_URL = "https://reyvelour-life-transformer-api.hf.space";

  const fetchGoals = async () => {
    try {
      const response = await fetch(`${API_URL}/goals`);
      if (response.ok) setGoals(await response.json());
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    }
  };

  const fetchActiveDebt = async () => {
    try {
      const response = await fetch(`${API_URL}/debts/active`);
      if (response.ok) {
        const data = await response.json();
        setActiveDebt(data);
      }
    } catch (error) {
      console.error("Failed to fetch active debt:", error);
    }
  };

  useEffect(() => {
    fetchGoals();
    fetchActiveDebt();
  }, []);

  // --- HANDLERS: PAYDAY & GOALS ---
  const handleLogIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeAmount) return;
    try {
      const response = await fetch(`${API_URL}/income/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseInt(incomeAmount) }),
      });
      if (response.ok) {
        setPaydayResult(await response.json());
        setIncomeAmount("");
        fetchActiveDebt(); // Refresh debt progress
      }
    } catch (error) {}
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (response.ok) {
        setItem(await response.json());
        setUrl("");
      }
    } catch (error) {}
    setLoading(false);
  };

  const handleSaveGoal = async () => {
    if (!item) return;
    try {
      const response = await fetch(`${API_URL}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, currency }),
      });
      if (response.ok) {
        setItem(null); 
        fetchGoals(); 
      }
    } catch (error) {}
  };

  const handleFundGoal = async (id: number, amount: number) => {
    try {
      const response = await fetch(`${API_URL}/goals/${id}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (response.ok) fetchGoals();
    } catch (error) {}
  };

  // --- HANDLERS: SETTINGS ---
  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtName || !debtTarget || !debtDeadline) return;
    
    try {
      const response = await fetch(`${API_URL}/debts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: debtName, 
          target_amount: parseInt(debtTarget), 
          deadline: debtDeadline 
        }),
      });
      if (response.ok) {
        setDebtName("");
        setDebtTarget("");
        setDebtDeadline("");
        fetchActiveDebt();
      }
    } catch (error) {}
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col items-center">
      
      {/* NAVIGATION BAR */}
      <nav className="w-full bg-neutral-900 border-b border-neutral-800 px-8 py-4 flex justify-center gap-8 sticky top-0 z-50">
        <button 
          onClick={() => setActiveTab("board")}
          className={`font-bold transition-colors ${activeTab === "board" ? "text-green-400" : "text-neutral-500 hover:text-white"}`}
        >
          Vision Board
        </button>
        <button 
          onClick={() => setActiveTab("settings")}
          className={`font-bold transition-colors ${activeTab === "settings" ? "text-green-400" : "text-neutral-500 hover:text-white"}`}
        >
          Settings
        </button>
      </nav>

      <div className="w-full max-w-5xl p-8 flex flex-col items-center">
        
        {/* ===================== VISION BOARD TAB ===================== */}
        {activeTab === "board" && (
          <>
            {/* 1. THE PAYDAY TOLL BOOTH */}
            <div className="w-full max-w-2xl mb-12 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold mb-4">Monday Payday Engine</h2>
              <form onSubmit={handleLogIncome} className="flex gap-2 mb-6">
                <input
                  type="number"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  placeholder="Total Expected Income..."
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-500"
                  required
                />
                <button type="submit" className="bg-green-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-green-400 transition-colors">
                  Route Funds
                </button>
              </form>

              {paydayResult && (
                <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-neutral-400">Debt Cleared This Week:</span>
                    <span className="text-red-400 font-bold">-{paydayResult.debt_cleared_this_week}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4 text-sm">
                    <span className="text-neutral-500">Remaining Debt Balance:</span>
                    <span className="text-neutral-500">{paydayResult.remaining_debt_balance}</span>
                  </div>
                  <div className="h-px w-full bg-neutral-800 mb-4"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-200 font-semibold">Unlocked Rebuild Pool:</span>
                    <span className="text-green-400 font-bold text-2xl">+{paydayResult.unlocked_rebuild_funds}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. THE VISION BOARD INTAKE */}
            <div className="w-full max-w-2xl mb-16 text-center">
              <h1 className="text-3xl font-bold mb-2">The Blueprint</h1>
              <p className="text-neutral-400 mb-8">Fund your transformation. Paste a link below.</p>

              <form onSubmit={handleExtract} className="flex gap-2 w-full max-w-md mx-auto mb-8">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none"
                  required
                />
                <button type="submit" disabled={loading} className="bg-white text-black px-6 py-3 rounded-xl font-medium">
                  {loading ? "..." : "Add"}
                </button>
              </form>

              {item && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl max-w-md mx-auto text-left">
                  {item.image_url && (
                    <div className="h-48 w-full bg-neutral-800 relative">
                      <img src={item.image_url} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <input 
                      type="text"
                      value={item.title}
                      onChange={(e) => setItem({ ...item, title: e.target.value })}
                      className="w-full bg-transparent border-b border-neutral-700 pb-1 mt-1 text-lg font-semibold text-white focus:outline-none"
                    />
                    <div className="flex justify-between items-end mt-4 mb-4">
                      <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-neutral-800 text-white text-sm rounded-lg px-2 py-1 focus:outline-none border border-neutral-700"
                      >
                        <option value="EGP">EGP (E£)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                      <span className="text-xl font-bold text-green-400">{item.price}</span>
                    </div>
                    <button onClick={handleSaveGoal} className="w-full bg-white text-black py-2 rounded-xl font-bold">Lock Goal</button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. ACTIVE GOALS GRID */}
            <div className="w-full max-w-5xl">
              <h2 className="text-xl font-bold border-b border-neutral-800 pb-2 mb-6">Active Goals</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {goals.map((goal) => {
                  const targetPrice = parseFloat(goal.price.replace(/[^0-9.-]+/g,"")) || 1; 
                  const progressPercent = Math.min((goal.funded_amount / targetPrice) * 100, 100);

                  return (
                    <div key={goal.id} className="group bg-neutral-900 rounded-2xl overflow-hidden hover:ring-2 hover:ring-neutral-700 transition-all flex flex-col">
                      <a href={goal.original_url} target="_blank" rel="noopener noreferrer" className="h-48 w-full bg-neutral-800 relative overflow-hidden block">
                        <img src={goal.image_url} alt={goal.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </a>
                      <div className="p-4 flex flex-col flex-1 justify-between">
                        <h3 className="font-semibold text-sm line-clamp-2 mb-4 text-neutral-200">{goal.title}</h3>
                        <div>
                          <div className="flex justify-between text-xs mb-2">
                            <span className="text-neutral-400">{goal.currency === "EGP" ? "E£" : "$"}{goal.funded_amount} saved</span>
                            <span className="font-bold text-white">{goal.price}</span>
                          </div>
                          <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-green-500 transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleFundGoal(goal.id, 50)} className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold py-2 rounded-lg">
                              + 50
                            </button>
                            <button onClick={() => handleFundGoal(goal.id, 200)} className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold py-2 rounded-lg">
                              + 200
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ===================== SETTINGS TAB ===================== */}
        {activeTab === "settings" && (
          <div className="w-full max-w-xl animate-in fade-in duration-300">
            <h1 className="text-3xl font-bold mb-8">System Settings</h1>
            
            {/* Current Active Debt Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-8">
              <h2 className="text-lg font-semibold text-neutral-400 mb-4 uppercase tracking-wider">Active Debt Objective</h2>
              {activeDebt ? (
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-2xl font-bold text-white">{activeDebt.name}</span>
                    <span className="text-red-400 font-bold">{activeDebt.amount_paid} / {activeDebt.target_amount}</span>
                  </div>
                  <p className="text-sm text-neutral-500 mb-4">Target Clearance: {activeDebt.deadline}</p>
                  <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 transition-all duration-1000" 
                      style={{ width: `${Math.min((activeDebt.amount_paid / activeDebt.target_amount) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <p className="text-neutral-500 italic">No active debt obligations.</p>
              )}
            </div>

            {/* New Debt Form */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6">Log New Liability</h2>
              <form onSubmit={handleCreateDebt} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Objective Name (e.g. October Clearance)</label>
                  <input
                    type="text"
                    value={debtName}
                    onChange={(e) => setDebtName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Total Target Amount</label>
                  <input
                    type="number"
                    value={debtTarget}
                    onChange={(e) => setDebtTarget(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={debtDeadline}
                    onChange={(e) => setDebtDeadline(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-500 text-white"
                    required
                  />
                </div>
                <button type="submit" className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl mt-2 transition-colors">
                  Initialize Goal
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}