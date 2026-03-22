"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { LineChart, Briefcase, ShieldAlert, LogIn, LogOut, Wallet, Search, Sun, Moon, ChevronDown, Settings } from "lucide-react";
import WalletModal from "./WalletModal";

export default function Navbar() {
  const { user, isAdmin, signInWithGoogle, logout, loading, balance } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(`/`);
    }
  };

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex flex-shrink-0 items-center gap-2 mr-6">
              <span className="text-xl font-extrabold tracking-tight text-blue-600 dark:text-blue-500">
                TicoBets
              </span>
            </Link>

            <div className="hidden xl:ml-8 xl:flex xl:space-x-8">
              <Link
                href="/"
                className="inline-flex items-center border-b-2 border-blue-500 px-1 pt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                <LineChart className="w-4 h-4 mr-2" />
                Mercados
              </Link>
              {user && (
                <Link
                  href="/portfolio"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 dark:hover:border-zinc-700"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Portafolio
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center border-b-2 border-red-500 px-1 pt-1 text-sm font-medium text-red-600 hover:border-red-400 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 dark:hover:border-red-300 transition"
                >
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!loading && (
              user ? (
                <div className="flex items-center gap-4">
                  {/* Balance UI */}
                  <div className="hidden sm:flex items-center gap-5 mr-2">
                     <div className="flex flex-col items-start leading-[1.1]">
                        <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest">Saldo de Prueba</span>
                        <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">₡{balance.toLocaleString()}</span>
                     </div>
                     <button
                       onClick={() => setIsWalletOpen(true)} 
                       className="bg-blue-600 hover:bg-blue-500 text-white font-black py-2 px-4 rounded-xl text-xs transition shadow-lg shadow-blue-600/20 flex items-center gap-2 uppercase tracking-widest"
                     >
                        <Wallet className="w-4 h-4" /> Billetera
                     </button>
                  </div>
                  {/* Profile & Logout */}
                  <div className="flex items-center gap-3">
                    {/* Profile Dropdown */}
                    <div className="relative">
                      <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 rounded-full bg-zinc-100 dark:bg-zinc-800 p-1 pr-3 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                      >
                        {user.photoURL ? (
                           <Image 
                             src={user.photoURL} 
                             alt="Avatar" 
                             width={32} 
                             height={32} 
                             className="rounded-full"
                           />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                            {user.displayName?.[0] || user.email?.[0]}
                          </div>
                        )}
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden md:inline">
                          {user.displayName?.split(" ")[0]}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-zinc-900 shadow-xl ring-1 ring-black/5 dark:ring-white/10 z-20 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                             <div className="px-4 py-3 flex items-center justify-between">
                                <div className="flex-1 truncate mr-2">
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Sesión iniciada como</p>
                                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{user.email}</p>
                                </div>
                                <Link 
                                  href="/settings"
                                  onClick={() => setIsDropdownOpen(false)}
                                  className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  title="Configuración"
                                >
                                  <Settings className="w-5 h-5" />
                                </Link>
                             </div>
                             
                             {/* Mobile Wallet Balance (Visible on small screens only if needed, or keep it here for access) */}
                             <div className="sm:hidden px-4 py-3">
                                <p className="text-xs text-zinc-500 mb-1 uppercase tracking-tighter font-bold">Saldo: ₡{balance.toLocaleString()}</p>
                                <button 
                                   onClick={() => { setIsWalletOpen(true); setIsDropdownOpen(false); }}
                                   className="w-full text-left text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2"
                                >
                                   <Wallet className="w-4 h-4" /> Abrir Billetera
                                </button>
                             </div>

                             <div className="py-2">
                               <div className="flex items-center justify-between px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                    {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                                    Modo Oscuro
                                  </span>
                                  <button onClick={toggleTheme} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${theme === "dark" ? "bg-blue-600" : "bg-zinc-200"}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === "dark" ? "translate-x-6" : "translate-x-1"}`} />
                                  </button>
                               </div>
                             </div>
                             <div className="py-1">
                               <button onClick={() => { logout(); setIsDropdownOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                 <LogOut className="w-4 h-4" /> Cerrar Sesión
                               </button>
                             </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <Link 
                  href="/login"
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition"
                >
                  <LogIn className="w-4 h-4" /> Iniciar Sesión
                </Link>
              )
            )}
          </div>
        </div>
        
        {/* Secondary Search Row */}
        <div className="pb-3 pt-1 border-t border-transparent flex justify-center">
            <form onSubmit={handleSearch} className="relative w-full max-w-3xl">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="text"
                className="block w-full rounded-full border-0 py-2.5 pl-11 pr-4 text-base text-zinc-900 dark:text-zinc-100 dark:bg-zinc-900 ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 transition shadow-sm"
                placeholder="Buscar mercados, eventos, deportes, política..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
        </div>
      </div>

      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </nav>
  );
}
