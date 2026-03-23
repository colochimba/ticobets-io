import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, Timestamp, FieldValue } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

interface Comment {
  id: string;
  marketId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: Timestamp | FieldValue;
}

export default function Comments({ marketId }: { marketId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    // Solo usamos 'where' para no requerir un Índice Compuesto en Firestore
    const q = query(
      collection(db, "comments"),
      where("marketId", "==", marketId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      
      // Ordenamos en el cliente (javascript) usando el Timestamp
      data.sort((a, b) => {
        const timeA = (a.createdAt as Timestamp)?.toMillis ? (a.createdAt as Timestamp).toMillis() : Date.now();
        const timeB = (b.createdAt as Timestamp)?.toMillis ? (b.createdAt as Timestamp).toMillis() : Date.now();
        return timeA - timeB;
      });

      setComments(data);
    }, (error) => {
      console.error("Error al obtener comentarios:", error);
    });

    return () => unsubscribe();
  }, [marketId]);

  const handlePost = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    setIsPosting(true);
    try {
      await addDoc(collection(db, "comments"), {
        marketId,
        userId: user.uid,
        userName: user.displayName || "Usuario Anónimo",
        userPhoto: user.photoURL || "",
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment("");
    } catch (error) {
       console.error("Error posting comment:", error);
    } finally {
       setIsPosting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 mt-8">
      <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-zinc-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
        </svg>
        Comentarios ({comments.length})
      </h3>

      <div className="space-y-6 mb-8 max-h-96 overflow-y-auto pr-2">
        {comments.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-4">Aún no hay mensajes. ¡Sé el primero en comentar!</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                {c.userPhoto ? (
                  <Image src={c.userPhoto} alt={c.userName} width={36} height={36} className="rounded-full bg-zinc-100" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 font-bold">
                    {c.userName[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl rounded-tl-none">
                <div className="flex items-center justify-between mb-1">
                   <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{c.userName}</span>
                   <span className="text-xs text-zinc-400">
                     {(c.createdAt as Timestamp)?.toDate ? new Intl.DateTimeFormat('es-CR', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: 'short'}).format((c.createdAt as Timestamp).toDate()) : 'Ahora'}
                   </span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{c.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {user ? (
        <form onSubmit={handlePost} className="flex gap-3 items-end">
          <div className="flex-1">
            <label htmlFor="comment" className="sr-only">Escribe tu opinión</label>
            <textarea
              id="comment"
              rows={2}
              className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-zinc-950 resize-none"
              placeholder="¿Qué opinas sobre este mercado?"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePost();
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isPosting || !newComment.trim()}
            className="flex-none rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition h-full"
          >
            {isPosting ? 'Enviando...' : 'Publicar'}
          </button>
        </form>
      ) : (
         <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 text-center border border-blue-100 dark:border-blue-800/20">
            <span className="text-sm text-blue-800 dark:text-blue-300 font-medium">Inicia sesión para participar en la discusión</span>
         </div>
      )}
    </div>
  );
}
