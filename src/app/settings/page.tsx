"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Settings, User, Shield, Bell, CreditCard, Loader2, Twitter, Instagram, Globe, AlignLeft, Heart, ChevronRight } from "lucide-react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { getMarkets, Market, getMarketLabel } from "@/lib/markets";
import Link from "next/link";
import Swal from "sweetalert2";

export default function SettingsPage() {
  const { user, favorites, toggleFavorite } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "favorites" | "security" | "notifications" | "payments">("profile");
  const [nickname, setNickname] = useState(user?.displayName || "");
  const [bio, setBio] = useState("");
  const [socials, setSocials] = useState({
    twitter: "",
    instagram: "",
    website: ""
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [favMarkets, setFavMarkets] = useState<Market[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setNickname(data.displayName || "");
            setBio(data.bio || "");
            setSocials({
              twitter: data.socials?.twitter || "",
              instagram: data.socials?.instagram || "",
              website: data.socials?.website || ""
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setFetching(false);
        }
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (activeTab === "favorites" && favorites.length > 0) {
      const loadFavs = async () => {
        setLoadingFavs(true);
        try {
          const allMarkets = await getMarkets();
          const filtered = allMarkets.filter(m => favorites.includes(m.id));
          setFavMarkets(filtered);
        } catch (error) {
          console.error("Error loading favorite markets:", error);
        } finally {
          setLoadingFavs(false);
        }
      };
      loadFavs();
    } else if (activeTab === "favorites") {
      setFavMarkets([]);
    }
  }, [activeTab, favorites]);

  if (!user) {
    return (
      <div className="text-center py-20 text-zinc-500">
        Debes iniciar sesión para ver la configuración.
      </div>
    );
  }

  const handleSave = async () => {
    if (!nickname.trim()) {
      Swal.fire({ title: "Error", text: "El nickname no puede estar vacío", icon: "error", background: '#18181b', color: '#fff' });
      return;
    }

    setLoading(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: nickname });
      }

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: nickname,
        bio: bio,
        socials: socials,
        updatedAt: new Date().toISOString()
      });

      Swal.fire({
        title: "¡Éxito!",
        text: "Tu perfil ha sido actualizado correctamente.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        background: '#18181b',
        color: '#fff'
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      Swal.fire({
        title: "Error",
        text: "Hubo un problema al actualizar tu perfil.",
        icon: "error",
        background: '#18181b',
        color: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
     return (
       <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-zinc-500 font-medium">Cargando perfil...</p>
       </div>
     );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {activeTab === 'profile' ? 'Mi Perfil' : activeTab === 'favorites' ? 'Favoritos' : 'Configuración'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Gestiona tus preferencias y cuenta en TicoBets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
          >
            <div className="flex items-center gap-3">
              <User className="w-4 h-4" /> Perfil
            </div>
            <ChevronRight className={`w-4 h-4 opacity-50 ${activeTab === 'profile' ? 'block' : 'hidden'}`} />
          </button>
          
          <button 
            onClick={() => setActiveTab("favorites")}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'favorites' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
          >
            <div className="flex items-center gap-3">
              <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-white' : ''}`} /> Favoritos
            </div>
            <div className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'favorites' ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
              {favorites.length}
            </div>
          </button>

          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ajustes</div>
          
          <button 
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'security' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
          >
            <Shield className="w-4 h-4" /> Seguridad
          </button>
          <button 
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'notifications' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
          >
            <Bell className="w-4 h-4" /> Notificaciones
          </button>
          <button 
            onClick={() => setActiveTab("payments")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'payments' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
          >
            <CreditCard className="w-4 h-4" /> Pagos
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <div className="space-y-8">
              <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                   <User className="w-5 h-5 text-blue-500" /> Información del Perfil
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Nickname</label>
                    <input 
                      type="text" 
                      value={nickname} 
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Tu nombre público..."
                      className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 dark:text-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-600 transition shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-2">
                      <AlignLeft className="w-4 h-4" /> Bio
                    </label>
                    <textarea 
                      rows={4}
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Cuenta algo sobre ti..."
                      className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 dark:text-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-600 transition resize-none shadow-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Correo Electrónico</label>
                    <input 
                      type="email" 
                      readOnly
                      value={user.email || ""} 
                      className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-500 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-900 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 cursor-not-allowed shadow-none"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                   <Globe className="w-5 h-5 text-purple-500" /> Redes Sociales
                </h2>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-2">
                      <Twitter className="w-4 h-4 text-[#1DA1F2]" /> Twitter / X
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">@</span>
                      <input 
                        type="text" 
                        value={socials.twitter} 
                        onChange={(e) => setSocials({...socials, twitter: e.target.value})}
                        placeholder="usuario_twitter"
                        className="block w-full rounded-xl border-0 py-3 pl-9 pr-4 text-zinc-900 dark:text-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-[#E4405F]" /> Instagram
                    </label>
                    <input 
                      type="text" 
                      value={socials.instagram} 
                      onChange={(e) => setSocials({...socials, instagram: e.target.value})}
                      placeholder="https://instagram.com/tu_perfil"
                      className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 dark:text-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-500" /> Sitio Web
                    </label>
                    <input 
                      type="url" 
                      value={socials.website} 
                      onChange={(e) => setSocials({...socials, website: e.target.value})}
                      placeholder="https://tu-sitio.com"
                      className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 dark:text-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-blue-600 transition"
                    />
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                   <button 
                      onClick={handleSave}
                      disabled={loading}
                      className="px-8 py-4 bg-[#0b84ff] hover:bg-blue-600 active:scale-[0.98] disabled:bg-blue-400 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 w-full sm:w-auto min-w-[240px]"
                    >
                      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                      {loading ? "Sincronizando..." : "Guardar cambios del perfil"}
                    </button>
                </div>
              </section>

              <section className="bg-red-50/30 dark:bg-red-950/10 rounded-2xl p-6 shadow-sm border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Zona de Peligro</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 font-medium">Esta acción eliminará permanentemente tu acceso a la plataforma.</p>
                <button className="px-6 py-3 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-bold rounded-xl transition-all active:scale-[0.98]">
                  Desactivar Cuenta
                </button>
              </section>
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               {loadingFavs ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                    <p className="text-zinc-500 font-medium">Cargando tus favoritos...</p>
                 </div>
               ) : favMarkets.length === 0 ? (
                 <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                      <Heart className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">No tienes favoritos aún</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm mx-auto">
                      Marca con un corazón las apuestas que sigues para tener acceso rápido a ellas desde aquí.
                    </p>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white font-bold rounded-xl hover:scale-105 transition-transform">
                       Explorar Mercados
                    </Link>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {favMarkets.map(market => (
                      <div key={market.id} className="relative group">
                         <Link href={`/market/${market.id}`} className="block">
                            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:ring-2 hover:ring-red-500/50 transition-all shadow-sm">
                               <div className="flex items-center justify-between mb-4">
                                  <span className="text-[10px] uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400">
                                    {market.category}
                                  </span>
                                   <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1.5 text-zinc-400">
                                         <Globe className="w-3.5 h-3.5" />
                                         <span className="text-xs font-medium">${market.volume.toLocaleString()}</span>
                                      </div>
                                      <button 
                                         onClick={(e) => {
                                           e.preventDefault();
                                           e.stopPropagation();
                                           toggleFavorite(market.id);
                                         }}
                                         className="p-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-full hover:scale-110 active:scale-90 transition-all shadow-sm"
                                         title="Quitar de favoritos"
                                       >
                                         <Heart className="w-4 h-4 fill-current" />
                                      </button>
                                   </div>
                               </div>
                               <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4 line-clamp-2 pr-6">
                                 {market.title}
                               </h3>
                               <div className="flex items-end justify-between">
                                  <div>
                                     <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-tighter">Estado</p>
                                     <span className="text-sm font-bold text-blue-500">{getMarketLabel(market)}</span>
                                  </div>
                                  <div className="flex gap-2">
                                     <span className="px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-500 rounded-lg text-xs font-black">SÍ</span>
                                     <span className="px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-500 rounded-lg text-xs font-black">NO</span>
                                  </div>
                               </div>
                            </div>
                         </Link>

                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {activeTab !== "profile" && activeTab !== "favorites" && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-6 mx-auto w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                {activeTab === 'security' ? <Shield className="w-8 h-8 text-zinc-400" /> : activeTab === 'notifications' ? <Bell className="w-8 h-8 text-zinc-400" /> : <CreditCard className="w-8 h-8 text-zinc-400" />}
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Próximamente</h2>
              <p className="text-zinc-500 dark:text-zinc-400">Esta sección de la configuración está bajo desarrollo activo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

