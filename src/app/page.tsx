"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { getMarkets, seedMarketsIfEmpty, Market, getMarketLabel } from "@/lib/markets";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Heart } from "lucide-react";

function HomeContent() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, favorites, toggleFavorite } = useAuth();
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search") || "";
  
  const [activeCategory, setActiveCategory] = useState<string>("Todas");
  const [sortBy, setSortBy] = useState<"tendencia"|"recientes">("tendencia");

  useEffect(() => {
    const loadMarkets = async () => {
      try {
        await seedMarketsIfEmpty();
        const data = await getMarkets();
        setMarkets(data);
      } catch (error) {
        console.error("Error loading markets:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMarkets();
  }, []);

  // Compute unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(markets.map((m) => m.category)));
    return ["Todas", ...cats.sort()];
  }, [markets]);

  // Filter and sort the markets
  const displayedMarkets = useMemo(() => {
    let filtered = markets;
    if (activeCategory !== "Todas") {
      filtered = filtered.filter((m) => m.category === activeCategory);
    }
    if (searchParam) {
      filtered = filtered.filter((m) => m.title.toLowerCase().includes(searchParam.toLowerCase()));
    }
    
    // Create a copy to sort
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === "tendencia") {
        return b.volume - a.volume; // Mayor volumen primero
      }
      return 0; // Asumiendo que 'recientes' podría basarse en ID u otra fecha
    });
    return sorted;
  }, [markets, activeCategory, sortBy, searchParam]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Mercados Populares
        </h1>
        
        {/* Sort Tabs */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg w-fit">
           <button 
             onClick={() => setSortBy("tendencia")}
             className={`px-4 py-1.5 text-sm font-semibold rounded-md transition ${sortBy === "tendencia" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
           >
             Tendencia
           </button>
           <button 
             onClick={() => setSortBy("recientes")}
             className={`px-4 py-1.5 text-sm font-semibold rounded-md transition ${sortBy === "recientes" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
           >
             Nuevos
           </button>
        </div>
      </div>
      
      {/* Category Pills */}
      {!loading && markets.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
             <button
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                 activeCategory === cat 
                 ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                 : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 hover:text-blue-600"
               }`}
             >
               {cat}
             </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : displayedMarkets.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
           No hay mercados que coincidan con esta categoría.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedMarkets.map((market) => (
            <div key={market.id} className="relative group">
              <Link href={`/market/${market.id}`}>
                <div className="flex flex-col h-full overflow-hidden rounded-xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 hover:shadow-md hover:ring-blue-500/50 transition-all cursor-pointer">
                  <div className="p-5 flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-400/10 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/30">
                        {market.category}
                      </span>
                      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-tight">
                        ₡{market.totalPool?.toLocaleString() || 0} en premios
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold leading-6 text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors pr-8">
                      {market.title}
                    </h3>
                    <div className="mt-4 flex items-center justify-between -mb-1">
                        <span className="text-xl font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                          {getMarketLabel(market)} ({market.totalPool > 0 ? Math.round((market.totalSi / market.totalPool) * 100) : 50}%)
                        </span>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Nivel de Riesgo</span>
                    </div>
                  </div>
                  
                  <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex-1 rounded-lg bg-green-500/10 px-3 py-2.5 text-center text-sm font-bold text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">
                      Apostar SÍ
                    </div>
                    <div className="flex-1 rounded-lg bg-red-500/10 px-3 py-2.5 text-center text-sm font-bold text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/20">
                      Apostar NO
                    </div>
                  </div>
                </div>
              </Link>
              
              {/* Favorite Button */}
              {user && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(market.id);
                  }}
                  className="absolute top-16 right-4 p-2 rounded-full bg-white/80 dark:bg-zinc-800/80 shadow-sm hover:scale-110 transition-transform z-10"
                >
                  <Heart 
                    className={`w-5 h-5 transition-colors ${favorites.includes(market.id) ? "fill-red-500 text-red-500" : "text-zinc-400"}`} 
                  />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-zinc-500">Cargando mercados...</div>}>
      <HomeContent />
    </Suspense>
  );
}
