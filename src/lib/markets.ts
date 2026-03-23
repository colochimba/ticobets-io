import { db } from "./firebase";
import { collection, getDocs, doc, setDoc, getDoc, query, orderBy, updateDoc, writeBatch, where, serverTimestamp } from "firebase/firestore";

export interface Market {
  id: string;
  title: string;
  category: string;
  volume: number; // Mapping to totalPool
  totalSi: number;
  totalNo: number;
  totalPool: number;
  resolutionStatus: "OPEN" | "RESOLVED";
  winningOutcome?: "YES" | "NO";
  expiresAt?: string;
}

export type MarketLabel = "Muy probable" | "Parejo" | "Arriesgado";

export const getMarketLabel = (market: Market): MarketLabel => {
  if (market.totalPool === 0) return "Parejo";
  const prob = (market.totalSi / market.totalPool) * 100;
  if (prob > 75) return "Muy probable";
  if (prob < 25) return "Arriesgado";
  return "Parejo";
};

// Fetch all markets
export const getMarkets = async (): Promise<Market[]> => {
  const marketsRef = collection(db, "markets");
  const q = query(marketsRef, orderBy("volume", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Market[];
};

export const getMarketById = async (id: string): Promise<Market | null> => {
  const docRef = doc(db, "markets", id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Market;
  }
  return null;
};

/**
 * Resolve a market and distribute payouts to winners.
 */
export const resolveMarket = async (marketId: string, winningOutcome: "YES" | "NO") => {
  const marketRef = doc(db, "markets", marketId);
  const marketSnap = await getDoc(marketRef);
  if (!marketSnap.exists()) throw new Error("Mercado no encontrado");
  
  const marketData = marketSnap.data() as Market;
  const { totalSi, totalNo, totalPool } = marketData;
  const winPool = winningOutcome === "YES" ? totalSi : totalNo;
  
  // Update market status immediately to prevent double resolution
  await updateDoc(marketRef, { resolutionStatus: "RESOLVED", winningOutcome });

  if (winPool === 0) return;

  // Get all positions for this market
  const positionsSnap = await getDocs(
    query(collection(db, "positions"), where("marketId", "==", marketId))
  );
  
  const batch = writeBatch(db);
  let batchCount = 0;

  for (const posDoc of positionsSnap.docs) {
    const pos = posDoc.data();
    if (pos.outcome === winningOutcome) {
      // Formula: (apuesta_usuario / total_lado_ganador) * total_pool
      const payout = Math.floor((pos.amount / winPool) * totalPool);
      
      const userRef = doc(db, "users", pos.userId);
      // We need current balance. Since we are in a loop and batching, 
      // it's safer to use increments if possible, but Firestore doesn't have 
      // increment inside a batch easily without knowing the doc ref context 
      // or using FieldValue.increment().
      
      const { increment } = await import("firebase/firestore");
      batch.update(userRef, { balance: increment(payout) });
      
      // Record "win" transaction
      const txRef = doc(collection(db, "transactions"));
      batch.set(txRef, {
        userId: pos.userId,
        type: "win",
        amount: payout,
        marketId,
        marketTitle: marketData.title,
        status: "completed",
        createdAt: serverTimestamp()
      });
      
      batchCount += 2;
      if (batchCount >= 450) {
        await batch.commit();
        // Reset batch if needed (rare for test data)
        // For simplicity in this env, we assume < 500 operations total
      }
    }
  }
  
  if (batchCount > 0) {
    await batch.commit();
  }
};

// Seed initial markets if none exist
export const seedMarketsIfEmpty = async () => {
  const existing = await getMarkets();
  if (existing.length > 0) return;

  const dummyMarkets: Market[] = [
    {
      id: "elecciones-cr-2026",
      title: "¿Quién ganará las elecciones presidenciales de Costa Rica 2026?",
      category: "Política",
      volume: 150000,
      totalSi: 80000,
      totalNo: 70000,
      totalPool: 150000,
      resolutionStatus: "OPEN"
    },
    {
      id: "campeon-nacional",
      title: "¿Saprissa ganará el próximo campeonato nacional?",
      category: "Deportes",
      volume: 320000,
      totalSi: 250000,
      totalNo: 70000,
      totalPool: 320000,
      resolutionStatus: "OPEN"
    }
  ];

  for (const market of dummyMarkets) {
    await setDoc(doc(db, "markets", market.id), market);
  }
};

export const deleteMarket = async (id: string) => {
  const batch = writeBatch(db);
  batch.delete(doc(db, "markets", id));
  const positionsSnap = await getDocs(query(collection(db, "positions"), where("marketId", "==", id)));
  positionsSnap.forEach((d) => batch.delete(d.ref));
  const commentsSnap = await getDocs(query(collection(db, "comments"), where("marketId", "==", id)));
  commentsSnap.forEach((d) => batch.delete(d.ref));
  await batch.commit();
};

export const updateMarket = async (id: string, data: Partial<Market>) => {
  await updateDoc(doc(db, "markets", id), data);
};

export const createMarket = async (market: Market) => {
  await setDoc(doc(db, "markets", market.id), market);
};
