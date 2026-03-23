"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Plus, RotateCcw, Wallet } from "lucide-react";
import Swal from "sweetalert2";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { balance, addFunds, resetBalance } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleAddFunds = async (amount: number) => {
    setIsProcessing(true);
    try {
      await addFunds(amount);
      Swal.fire({
        title: "¡Fondos Agregados!",
        text: `Se han añadido ₡${amount.toLocaleString()} a tu balance de prueba.`,
        icon: "success",
        background: "#18181b",
        color: "#fff",
        confirmButtonColor: "#22c55e",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      Swal.fire({
        title: "Límite alcanzado",
        text: errorMessage,
        icon: "warning",
        background: "#18181b",
        color: "#fff",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = async () => {
    const result = await Swal.fire({
      title: "¿Reiniciar saldo?",
      text: "Tu saldo volverá a ser de ₡10,000. Esta acción no se puede deshacer.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, reiniciar",
      cancelButtonText: "Cancelar",
      background: "#18181b",
      color: "#fff",
      confirmButtonColor: "#3b82f6",
    });

    if (result.isConfirmed) {
      setIsProcessing(true);
      try {
        await resetBalance();
        Swal.fire({
          title: "Saldo Reiniciado",
          text: "Tu balance ahora es de ₡10,000.",
          icon: "success",
          background: "#18181b",
          color: "#fff",
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
              <Wallet className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Mi Billetera Virtual</h2>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center mb-8">
            <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1 block">Saldo Disponible</span>
            <span className="text-4xl font-black text-zinc-900 dark:text-zinc-100">₡{balance.toLocaleString()}</span>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Agregar Fondos (Simulado)</h3>
            <div className="grid grid-cols-3 gap-3">
              {[1000, 5000, 10000].map((amount) => (
                <button
                  key={amount}
                  disabled={isProcessing}
                  onClick={() => handleAddFunds(amount)}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all group disabled:opacity-50"
                >
                  <Plus className="w-5 h-5 mb-1 text-zinc-400 group-hover:text-blue-600" />
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 text-sm">₡{amount.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <button
              disabled={isProcessing}
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 p-4 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-red-500 transition-colors group"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
              REINICIAR SALDO A ₡10,000
            </button>
          </div>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/20 text-center">
            <p className="text-[10px] text-zinc-400 uppercase font-black tracking-[0.2em]">
              ⚠️ ESTO ES DINERO DE PRUEBA • SIN VALOR REAL
            </p>
        </div>
      </div>
    </div>
  );
}
