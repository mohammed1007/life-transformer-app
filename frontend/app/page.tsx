"use client";
import { useState, useEffect } from "react";

// Define the shape of our Goal data
interface Goal {
  id: number;
  title: string;
  price: string;
  currency: string;
  image_url: string;
  original_url: string;
  funded_amount: number;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState<{ title: string; image_url: string; price: string; original_url: string } | null>(null);
  const [currency, setCurrency] = useState("USD"); // Default to USD  
  // New state to hold all saved goals
  const [goals, setGoals] = useState<Goal[]>([]);

  // Fetch goals when the page loads
  const fetchGoals = async () => {
    try {
const response = await fetch("https://reyvelour-life-transformer-api.hf.space/goals");      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    try {
const response = await fetch("https://reyvelour-life-transformer-api.hf.space/extract", {        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setItem(data);
        setUrl("");
      }
    } catch (error) {
      console.error("Failed to extract item:", error);
    }
    setLoading(false);
  };

  const handleSaveGoal = async () => {
    if (!item) return;
    try {
const response = await fetch("https://reyvelour-life-transformer-api.hf.space/goals", {        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Inject the selected currency into the payload
        body: JSON.stringify({ ...item, currency }), 
      });
      
      if (response.ok) {
        setItem(null); 
        fetchGoals(); 
      }
    } catch (error) {
      console.error("Failed to save goal:", error);
    }
  };

  const handleFundGoal = async (id: number, amount: number) => {
    try {
const response = await fetch(`https://reyvelour-life-transformer-api.hf.space/goals/${id}/fund`, {        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (response.ok) {
        fetchGoals(); // Refresh the grid to show the updated progress bar
      }
    } catch (error) {
      console.error("Failed to fund goal:", error);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-8 font-sans flex flex-col items-center pt-16">
      
      {/* Top Section: The Input Engine */}
      <div className="w-full max-w-2xl mb-16 text-center">
        <h1 className="text-3xl font-bold mb-2">The Blueprint</h1>
        <p className="text-neutral-400 mb-8">Fund your transformation. Paste a link below.</p>

        <form onSubmit={handleExtract} className="flex gap-2 w-full max-w-md mx-auto mb-8">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-500 transition-colors"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Add"}
          </button>
        </form>

        {/* Draft Item Preview */}
        {item && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl max-w-md mx-auto text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                className="w-full bg-transparent border-b border-neutral-700 pb-1 mt-1 text-lg font-semibold text-white focus:outline-none focus:border-white transition-colors placeholder-neutral-600"
              />
              <div className="flex justify-between items-end mt-2 mb-4">
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-neutral-800 text-white text-sm rounded-lg px-2 py-1 focus:outline-none border border-neutral-700"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EGP">EGP (E£)</option>
                </select>
                <span className="text-xl font-bold text-green-400">{item.price}</span>
              </div>
              <button onClick={handleSaveGoal} className="w-full bg-white text-black py-2 rounded-xl font-bold hover:bg-neutral-200 transition-colors">
                Lock Goal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: The Vision Board Grid */}
      <div className="w-full max-w-5xl">
        <h2 className="text-xl font-bold border-b border-neutral-800 pb-2 mb-6">Active Goals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {goals.map((goal) => {
            // Calculate progress percentage (stripping $ and commas for math)
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
                    {/* Progress Text */}
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-neutral-400">
                        {goal.currency === "EGP" ? "E£" : "$"}{goal.funded_amount} saved
                      </span>
                      <span className="font-bold text-white">{goal.price}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden mb-4">
                      <div 
                        className="h-full bg-green-500 transition-all duration-1000 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>

                    {/* Quick Fund Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleFundGoal(goal.id, 5)}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                      >
                        + $5
                      </button>
                      <button 
                        onClick={() => handleFundGoal(goal.id, 20)}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                      >
                        + $20
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}