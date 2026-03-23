"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserPositions, Position, getTransactions, Transaction } from "@/lib/trades";
import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft, RotateCcw, History, Briefcase } from "lucide-react";

export default function PortfolioPage() {
  const { user, balance } = useAuth();
  const [positions, setPositions] = useState<(Position & { marketTitle?: string })[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"positions" | "history">("positions");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [userPositions, userTxs] = await Promise.all([
          getUserPositions(user.uid),
          getTransactions(user.uid)
        ]);
        setPositions(userPositions);
        setTransactions(userTxs);
      } catch (error) {
         console.error("Error fetching portfolio data:", error);
      } finally {
         setLoading(false);
      }
    };

    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Inicia sesión para ver tu portafolio</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const investedAmount = positions.reduce((acc, pos) => acc + pos.amount, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mb-8">
        Tu Portafolio
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
         <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 border-l-4 border-blue-500">
            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Saldo Disponible</h3>
            <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-100">₡{balance.toLocaleString()}</p>
         </div>
         <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 border-l-4 border-green-500">
            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Total en Apuestas</h3>
            <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-100">₡{investedAmount.toLocaleString()}</p>
         </div>
         <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 border-l-4 border-purple-500">
            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Apuestas Activas</h3>
            <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-100">{positions.length}</p>
         </div>
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab("positions")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === "positions" ? "border-blue-600 text-blue-600" : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
        >
          <Briefcase className="w-4 h-4" />
          APUESTAS ACTIVAS
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === "history" ? "border-blue-600 text-blue-600" : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
        >
          <History className="w-4 h-4" />
          HISTORIAL DE TRANSACCIONES
        </button>
      </div>
      
      {activeTab === "positions" ? (
        <>
          {positions.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-16 text-center shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 border-2 border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-lg font-medium">Aún no has realizado ninguna apuesta.</p>
              <Link href="/" className="inline-flex rounded-xl bg-blue-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-95">
                 EXPLORAR MERCADOS
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 overflow-hidden">
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {positions.map((pos) => (
                  <li key={pos.id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                       <div className="flex-1">
                         <span className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-black tracking-widest uppercase mb-3 ${pos.outcome === "YES" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20" : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20"}`}>
                           Predicción: {pos.outcome === "YES" ? "SÍ" : "NO"}
                         </span>
                         <Link href={`/market/${pos.marketId}`} className="block text-xl font-bold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 transition-colors">
                           {pos.marketTitle || "Mercado Desconocido"}
                         </Link>
                       </div>
                       <div className="flex flex-col sm:items-end bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl sm:bg-transparent sm:p-0">
                         <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Monto Apostado</span>
                         <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">₡{pos.amount.toLocaleString()}</span>
                       </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-zinc-500 dark:text-zinc-400">No hay transacciones registradas.</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {transactions.map((tx) => (
                <li key={tx.id} className="p-6 items-center flex justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      tx.type === "deposit" ? "bg-green-100 text-green-700 dark:bg-green-500/10" :
                      tx.type === "bet" ? "bg-red-100 text-red-700 dark:bg-red-500/10" :
                      tx.type === "win" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10" :
                      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800"
                    }`}>
                      {tx.type === "deposit" && <ArrowDownLeft className="w-5 h-5" />}
                      {tx.type === "bet" && <ArrowUpRight className="w-5 h-5" />}
                      {tx.type === "win" && <ArrowDownLeft className="w-5 h-5" />}
                      {tx.type === "reset" && <RotateCcw className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase text-sm tracking-widest">
                        {tx.type === "deposit" ? "Depósito de Prueba" :
                         tx.type === "bet" ? "Apuesta Realizada" :
                         tx.type === "win" ? "Ganancia Obtenida" :
                         "Reinicio de Billetera"}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {tx.marketTitle ? `Mercado: ${tx.marketTitle}` : 
                         tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleString("es-CR") : "Recientemente"}
                      </p>
                    </div>
                  </div>
                  <div className={`text-xl font-black ${
                    tx.type === "deposit" || tx.type === "win" ? "text-green-600" :
                    tx.type === "bet" ? "text-red-500" :
                    "text-zinc-900 dark:text-zinc-100"
                  }`}>
                    {tx.type === "bet" ? "-" : "+"}₡{tx.amount.toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
