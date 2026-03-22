"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMarkets, deleteMarket, updateMarket, createMarket, resolveMarket, Market } from "@/lib/markets";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { ShieldAlert, PlusCircle, Edit3, Save, X, Trash2, Pencil, List, Calendar, CheckCircle2 } from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import "flatpickr/dist/themes/dark.css";

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  // Form State for New/Edit Market
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Market>>({
    id: "",
    title: "",
    category: "",
    volume: 0,
    totalSi: 0,
    totalNo: 0,
    totalPool: 0,
    resolutionStatus: "OPEN",
    expiresAt: ""
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/");
    }
  }, [loading, isAdmin, router]);

  const loadMarkets = async () => {
    setIsFetching(true);
    const data = await getMarkets();
    setMarkets(data);
    setIsFetching(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadMarkets();
    }
  }, [isAdmin]);

  const handleSave = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!form.id || !form.title) {
       Swal.fire({ title: 'Atención', text: 'Faltan campos obligatorios', icon: 'warning', background: '#18181b', color: '#fff' });
       return;
     }
     
     try {
       if (editingId) {
         await updateMarket(editingId, form);
       } else {
         await createMarket(form as Market);
       }
       setEditingId(null);
       setForm({ id: "", title: "", category: "", volume: 0, totalSi: 0, totalNo: 0, totalPool: 0, resolutionStatus: "OPEN", expiresAt: "" });
       loadMarkets();
       Swal.fire({ title: '¡Guardado!', icon: 'success', background: '#18181b', color: '#fff', timer: 1500, showConfirmButton: false });
     } catch (error: any) {
       Swal.fire({ title: 'Error', text: error.message, icon: 'error', background: '#18181b', color: '#fff' });
     }
  };

  const handleResolve = async (id: string) => {
    const { value: outcome } = await Swal.fire({
      title: 'Resolver Mercado',
      text: "¿Cuál fue el resultado ganador?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ganó SÍ',
      cancelButtonText: 'Ganó NO',
      showDenyButton: true,
      denyButtonText: 'Cancelar',
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#ef4444',
      denyButtonColor: '#3f3f46',
      background: '#18181b',
      color: '#fff'
    });

    // Swal returns true/false for confirm/cancel, but Deny is actually Deny.
    // Let's use custom buttons or radio for clarity
    const resultOutcome = outcome === true ? "YES" : outcome === false ? "NO" : null;
    
    if (resultOutcome) {
       Swal.fire({
         title: 'Procesando pagos...',
         text: 'Por favor espera mientras se distribuyen las ganancias.',
         allowOutsideClick: false,
         didOpen: () => Swal.showLoading(),
         background: '#18181b',
         color: '#fff'
       });

       try {
         await resolveMarket(id, resultOutcome);
         await loadMarkets();
         Swal.fire({ title: 'Mercado Resuelto', text: 'Los pagos han sido distribuidos.', icon: 'success', background: '#18181b', color: '#fff' });
       } catch (err: any) {
         Swal.fire({ title: 'Error', text: err.message, icon: 'error', background: '#18181b', color: '#fff' });
       }
    }
  };

  const handleEdit = (market: Market) => {
     setEditingId(market.id);
     setForm(market);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción borrará este mercado y todo su historial para siempre.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
      background: '#18181b',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        await deleteMarket(id);
        loadMarkets();
        Swal.fire({ title: '¡Borrado!', icon: 'success', background: '#18181b', color: '#fff', showConfirmButton: false, timer: 1500 });
      } catch (err: any) {
        Swal.fire({ title: 'Error', text: err.message, icon: 'error', background: '#18181b', color: '#fff' });
      }
    }
  };

  if (loading || isFetching) return <div className="p-20 text-center">Cargando panel de control...</div>;
  if (!isAdmin) return null; // Redirection handled in useEffect

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-red-600 mb-8 flex items-center">
        <ShieldAlert className="w-8 h-8 mr-3" />
        Panel de Administración
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Form */}
         <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 h-fit sticky top-24">
            <h2 className="text-xl font-bold mb-4 flex items-center text-zinc-900 dark:text-zinc-100">
              {editingId ? <><Edit3 className="w-5 h-5 mr-2 text-blue-500" /> Editar Mercado</> : <><PlusCircle className="w-5 h-5 mr-2 text-green-500" /> Nuevo Mercado</>}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">ID Único (url-slug)</label>
                 <input 
                   type="text" 
                   value={form.id} 
                   disabled={!!editingId}
                   onChange={e => setForm({...form, id: e.target.value})} 
                   className="mt-1 block w-full rounded-md border-0 py-1.5 text-zinc-900 dark:text-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6 disabled:opacity-50" 
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Título</label>
                 <textarea 
                   rows={2}
                   value={form.title} 
                   onChange={e => setForm({...form, title: e.target.value})} 
                   className="mt-1 block w-full rounded-md border-0 py-1.5 text-zinc-900 dark:text-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6 resize-none" 
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Categoría</label>
                   <input 
                     type="text" 
                     value={form.category} 
                     onChange={e => setForm({...form, category: e.target.value})} 
                     className="mt-1 block w-full rounded-md border-0 py-1.5 text-zinc-900 dark:text-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6" 
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Pool Inicial (₡)</label>
                   <input 
                     type="number" 
                     value={form.totalPool} 
                     onChange={e => setForm({...form, totalPool: parseInt(e.target.value), volume: parseInt(e.target.value)})} 
                     className="mt-1 block w-full rounded-md border-0 py-1.5 text-zinc-900 dark:text-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6" 
                   />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                     <Calendar className="w-3.5 h-3.5" /> Expira el
                   </label>
                   <Flatpickr
                     data-enable-time
                     value={form.expiresAt || ""}
                     onChange={([date]) => setForm({ ...form, expiresAt: date.toISOString() })}
                     options={{
                       dateFormat: "Y-m-d H:i",
                       time_24hr: true,
                       locale: { firstDayOfWeek: 1 }
                     }}
                     className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-zinc-900 dark:text-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
                     placeholder="Seleccionar fecha..."
                   />
                 </div>
               </div>
               <div className="pt-2 flex gap-2">
                 <button type="submit" className="flex-1 bg-red-600 px-4 py-2 rounded-md text-white font-bold hover:bg-red-500 transition flex items-center justify-center gap-2">
                   <Save className="w-4 h-4" /> {editingId ? "Actualizar" : "Crear"}
                 </button>
                 {editingId && (
                   <button type="button" onClick={() => { setEditingId(null); setForm({ id: "", title: "", category: "", volume: 0, totalSi: 0, totalNo: 0, totalPool: 0, resolutionStatus: "OPEN", expiresAt: "" }); }} className="bg-zinc-200 dark:bg-zinc-800 px-4 py-2 rounded-md font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 transition flex items-center justify-center gap-2">
                     <X className="w-4 h-4" /> Cancelar
                   </button>
                 )}
               </div>
            </form>
         </div>

         {/* List */}
         <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
            <h2 className="text-xl font-bold mb-4 flex items-center text-zinc-900 dark:text-zinc-100">
              <List className="w-5 h-5 mr-2 text-zinc-500" /> Gestión de Mercados
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Mercado</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {markets.map(m => (
                    <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3">
                         <div className="font-bold text-zinc-900 dark:text-zinc-100">{m.title}</div>
                         <div className="text-xs text-zinc-500">{m.category} • Pool: ₡{m.totalPool?.toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-3">
                         <span className={`px-2 py-1 rounded-md text-xs font-bold ${m.resolutionStatus === 'OPEN' ? 'bg-green-100 text-green-700 dark:bg-green-500/20' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20'}`}>
                           {m.resolutionStatus} {m.resolutionStatus === 'RESOLVED' && `(${m.winningOutcome})`}
                         </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                         {m.resolutionStatus === 'OPEN' && (
                            <button onClick={() => handleResolve(m.id)} className="text-green-600 hover:text-green-500 mr-4 font-bold inline-flex items-center gap-1 transition"><CheckCircle2 className="w-4 h-4" /> Resolver</button>
                         )}
                         <button onClick={() => handleEdit(m)} className="text-blue-600 hover:text-blue-500 mr-4 font-semibold inline-flex items-center gap-1 transition"><Pencil className="w-4 h-4" /> Editar</button>
                         <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:text-red-500 font-semibold inline-flex items-center gap-1 transition"><Trash2 className="w-4 h-4" /> Borrar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         </div>
      </div>
    </div>
  );
}
