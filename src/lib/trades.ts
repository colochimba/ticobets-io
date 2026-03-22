import { db } from "./firebase";
import { collection, addDoc, doc, runTransaction, serverTimestamp, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { Market } from "./markets";

export interface Position {
  id?: string;
  userId: string;
  marketId: string;
  outcome: "YES" | "NO";
  amount: number; // CRC bet
  createdAt: any;
  marketTitle?: string;
}

export interface Transaction {
  id?: string;
  userId: string;
  type: "deposit" | "bet" | "win" | "reset";
  amount: number;
  marketId?: string;
  marketTitle?: string;
  createdAt: any;
  status: "completed";
}

/**
 * Execute a trade (bet) with balance validation and transaction recording.
 */
export const executeTrade = async (
  userId: string, 
  marketId: string, 
  outcome: "YES" | "NO", 
  amount: number
) => {
  const marketRef = doc(db, "markets", marketId);
  const userRef = doc(db, "users", userId);
  const positionRef = collection(db, "positions");
  const transactionRef = collection(db, "transactions");

  await runTransaction(db, async (transaction) => {
    const marketDoc = await transaction.get(marketRef);
    const userDoc = await transaction.get(userRef);

    if (!marketDoc.exists()) throw new Error("Mercado no encontrado");
    if (!userDoc.exists()) throw new Error("Usuario no encontrado");

    const marketData = marketDoc.data() as Market;
    const userData = userDoc.data();
    const currentBalance = userData.balance || 0;

    if (currentBalance < amount) {
      throw new Error("Saldo insuficiente");
    }

    // Update Market Pool
    const isYes = outcome === "YES";
    transaction.update(marketRef, {
      volume: (marketData.volume || 0) + amount,
      totalSi: (marketData.totalSi || 0) + (isYes ? amount : 0),
      totalNo: (marketData.totalNo || 0) + (!isYes ? amount : 0),
      totalPool: (marketData.totalPool || 0) + amount
    });

    // Deduct balance from User
    transaction.update(userRef, {
      balance: currentBalance - amount
    });

    // Create Position Document
    const newPosRef = doc(positionRef);
    transaction.set(newPosRef, {
      userId,
      marketId,
      marketTitle: marketData.title,
      outcome,
      amount,
      createdAt: serverTimestamp()
    });

    // Record Transaction
    const newTxRef = doc(transactionRef);
    transaction.set(newTxRef, {
      userId,
      type: "bet",
      amount,
      marketId,
      marketTitle: marketData.title,
      status: "completed",
      createdAt: serverTimestamp()
    });
  });
};

/**
 * Add virtual funds to a user's wallet.
 */
export const addFundsToWallet = async (userId: string, amount: number) => {
  const userRef = doc(db, "users", userId);
  const transactionRef = collection(db, "transactions");

  await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) throw new Error("Usuario no encontrado");

    const currentBalance = userDoc.data().balance || 0;
    
    // Simulate deposit limit (Optional)
    if (currentBalance + amount > 1000000) {
      throw new Error("Has alcanzado el límite máximo de saldo de prueba (₡1,000,000)");
    }

    transaction.update(userRef, {
      balance: currentBalance + amount
    });

    const newTxRef = doc(transactionRef);
    transaction.set(newTxRef, {
      userId,
      type: "deposit",
      amount,
      status: "completed",
      createdAt: serverTimestamp()
    });
  });
};

/**
 * Reset user's virtual wallet to the initial ₡10,000.
 */
export const resetWalletBalance = async (userId: string) => {
  const userRef = doc(db, "users", userId);
  const transactionRef = collection(db, "transactions");

  await runTransaction(db, async (transaction) => {
    transaction.update(userRef, { balance: 10000 });

    const newTxRef = doc(transactionRef);
    transaction.set(newTxRef, {
      userId,
      type: "reset",
      amount: 10000,
      status: "completed",
      createdAt: serverTimestamp()
    });
  });
};

/**
 * Fetch all transaction for a user.
 */
export const getTransactions = async (userId: string) => {
  const txRef = collection(db, "transactions");
  const q = query(
    txRef, 
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Transaction[];
};

/**
 * Fetch user's active positions.
 */
export const getUserPositions = async (userId: string) => {
  const positionsRef = collection(db, "positions");
  const q = query(
    positionsRef, 
    where("userId", "==", userId)
  );
  
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as (Position & { marketTitle?: string })[];

  // Client-side sort to avoid composite index requirement
  data.sort((a, b) => {
    const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
    const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
    return tB - tA; // desc
  });

  return data;
};
