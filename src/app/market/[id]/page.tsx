"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import { getMarketById, Market, getMarketLabel } from "@/lib/markets";
import { executeTrade } from "@/lib/trades";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Comments from "@/components/Comments";
import MarketChart from "@/components/MarketChart";
import { Heart } from "lucide-react";
import Swal from "sweetalert2";

export default function MarketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, favorites, toggleFavorite } = useAuth();
  const [tradeAmount, setTradeAmount] = useState<string>("");
  const [selectedOutcome, setSelectedOutcome] = useState<"YES"|"NO">("YES");
  const [isTrading, setIsTrading] = useState(false);
  const router = useRouter();

  const fetchMarket = async () => {
     try {
       const data = await getMarketById(id);
       setMarket(data);
     } catch (error) {
       console.error(error);
     } finally {
       setLoading(false);
     }
  };

  useEffect(() => {
    fetchMarket();
  }, [id]);

  const handleTrade = async () => {
    if (!user || !market || !tradeAmount || isTrading) return;
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsTrading(true);
    try {
      await executeTrade(user.uid, market.id, selectedOutcome, amount);
      await Swal.fire({ 
        title: '¡Apuesta realizada!', 
        text: `Has apostado ₡${amount.toLocaleString()} al ${selectedOutcome}`,
        icon: 'success', 
        background: '#18181b', 
        color: '#fff',
        confirmButtonColor: '#22c55e'
      });
      await fetchMarket();
      setTradeAmount("");
    } catch (error: any) {
      Swal.fire({ 
        title: 'Error en la apuesta', 
        text: error.message, 
        icon: 'error', 
        background: '#18181b', 
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsTrading(false);
    }
  };

  const calculatePotentialPayout = (amountStr: string, outcome: "YES" | "NO") => {
    const amount = parseFloat(amountStr);
    if (!market || isNaN(amount) || amount <= 0) return 0;
    
    const sidePool = outcome === "YES" ? (market.totalSi || 0) : (market.totalNo || 0);
    const totalPool = market.totalPool || 0;
    
    const shareOfWinner = amount / (sidePool + amount);
    const totalNewPool = totalPool + amount;
    const rawPayout = shareOfWinner * totalNewPool;
    
    return rawPayout * 0.95;
  };

  const potentialPayout = calculatePotentialPayout(tradeAmount, selectedOutcome);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!market) {
    return <div className="text-center py-20 text-zinc-500">Mercado no encontrado</div>;
  }

  const isExpired = market.expiresAt ? new Date(market.expiresAt) < new Date() : false;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-400/10 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/30 mb-4">
          {market.category}
        </span>
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            {market.title}
          </h1>
          {user && (
            <button 
              onClick={() => toggleFavorite(market.id)}
              className="p-3 rounded-xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 hover:scale-110 active:scale-95 transition-all text-zinc-400"
            >
              <Heart className={`w-6 h-6 transition-colors ${favorites.includes(market.id) ? "fill-red-500 text-red-500" : ""}`} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
           <span>Pozo Total: ₡{market.totalPool?.toLocaleString()}</span>
           <span>•</span>
           <span>SÍ: ₡{market.totalSi?.toLocaleString()}</span>
           <span>•</span>
           <span>NO: ₡{market.totalNo?.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Pool Visualization & Chart */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 overflow-hidden">
             <div className="p-8 border-b border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Nivel de Riesgo del Mercado</span>
                <span className="text-5xl font-black text-blue-600 tracking-tighter uppercase">
                  {getMarketLabel(market)} ({market.totalPool > 0 ? Math.round((market.totalSi / market.totalPool) * 100) : 50}%)
                </span>
                <p className="text-zinc-500 mt-4 font-medium max-w-md">
                  Este nivel se calcula basado en el balance de apuestas entre SÍ y NO en el pozo actual de ₡{market.totalPool?.toLocaleString()}.
                </p>
             </div>
             
             {/* The Re-integrated Chart */}
             <div className="p-4 bg-[#111113]">
                <MarketChart probability={market.totalPool > 0 ? (market.totalSi / market.totalPool) * 100 : 50} />
             </div>

             <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 flex h-4">
                <div 
                  className="bg-green-500 h-full transition-all duration-500 rounded-l-full" 
                  style={{ width: `${((market.totalSi || 0) / (market.totalPool || 1)) * 100}%` }}
                />
                <div 
                  className="bg-red-500 h-full transition-all duration-500 rounded-r-full" 
                  style={{ width: `${((market.totalNo || 0) / (market.totalPool || 1)) * 100}%` }}
                />
             </div>
          </div>

          <Comments marketId={market.id} />
        </div>

        {/* Trade Panel */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 h-fit sticky top-24">
           <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center justify-between">
             Realizar Apuesta
             {isExpired && (
               <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 dark:bg-red-900/40 font-semibold tracking-wider uppercase">
                 Cerrado
               </span>
             )}
           </h3>
           
           <div className="flex grid-cols-2 gap-3 mb-6">
              <button 
                disabled={isExpired}
                onClick={() => setSelectedOutcome("YES")}
                className={`flex-1 py-4 px-4 rounded-xl font-black border transition-all ${isExpired ? "opacity-50 cursor-not-allowed bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700" : selectedOutcome === "YES" ? "bg-green-500 text-white border-green-600 shadow-lg shadow-green-500/20 scale-105" : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-green-500"}`}
              >
                SÍ
              </button>
              <button 
                disabled={isExpired}
                onClick={() => setSelectedOutcome("NO")}
                className={`flex-1 py-4 px-4 rounded-xl font-black border transition-all ${isExpired ? "opacity-50 cursor-not-allowed bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700" : selectedOutcome === "NO" ? "bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/20 scale-105" : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-red-500"}`}
              >
                NO
              </button>
           </div>

           {isExpired ? (
             <div className="text-center p-4 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-lg text-red-700 dark:text-red-400 font-medium">
               Este mercado ya no acepta más apuestas.
             </div>
           ) : (
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Monto a apostar (₡)</label>
                 <div className="relative rounded-xl shadow-sm">
                   <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                     <span className="text-zinc-500 font-bold">₡</span>
                   </div>
                   <input
                     type="number"
                     value={tradeAmount}
                     onChange={(e) => setTradeAmount(e.target.value)}
                     className="block w-full rounded-xl border-0 py-4 pl-10 text-zinc-900 dark:text-zinc-100 dark:bg-zinc-950 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 font-bold"
                     placeholder="Ej: 5000"
                   />
                 </div>
               </div>

               {tradeAmount && !isNaN(parseFloat(tradeAmount)) && parseFloat(tradeAmount) > 0 && (
                 <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400 font-medium">Ganancia estimada:</span>
                      <span className="text-green-600 dark:text-green-400 font-black">₡{potentialPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                      <span>Incluye comisión (5%):</span>
                      <span>₡{(potentialPayout * 0.05 / 0.95).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                 </div>
               )}

               {user ? (
                 <button 
                   onClick={handleTrade}
                   disabled={isTrading || !tradeAmount}
                   className="w-full rounded-xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all disabled:opacity-50 active:scale-95"
                 >
                   {isTrading ? "Procesando..." : "CONFIRMAR APUESTA"}
                 </button>
               ) : (
                 <div className="text-center p-3 rounded-md bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-400 font-bold">
                   Inicia sesión para apostar
                 </div>
               )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
