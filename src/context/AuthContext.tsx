"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { addFundsToWallet, resetWalletBalance } from "@/lib/trades";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  favorites: string[];
  balance: number;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleFavorite: (marketId: string) => Promise<void>;
  addFunds: (amount: number) => Promise<void>;
  resetBalance: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  favorites: [],
  balance: 0,
  loading: true,
  signInWithGoogle: async () => {},
  signUpWithEmail: async () => {},
  loginWithEmail: async () => {},
  logout: async () => {},
  toggleFavorite: async () => {},
  addFunds: async () => {},
  resetBalance: async () => {},
  refreshBalance: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const refreshBalance = useCallback(async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setBalance(userSnap.data().balance || 0);
      }
    } catch (error) {
      console.error("Error refreshing balance:", error);
    }
  }, [user]);

  // Sync user profile to Firestore
  const syncUserToFirestore = async (firebaseUser: User) => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const isAdminEmail = firebaseUser.email === "tiemkeylla@gmail.com";
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
         await setDoc(userRef, {
           id: firebaseUser.uid,
           email: firebaseUser.email,
           displayName: firebaseUser.displayName,
           photoURL: firebaseUser.photoURL,
           balance: 10000, // Initial 10,000 CRC
           isAdmin: isAdminEmail, 
           createdAt: new Date().toISOString(),
           favorites: []
         });
         setBalance(10000);
         setIsAdmin(isAdminEmail);
      } else {
         const data = userSnap.data();
         setFavorites(data?.favorites || []);
         setBalance(data?.balance || 0);
         const finalIsAdmin = isAdminEmail || (data?.isAdmin || false);
         setIsAdmin(finalIsAdmin);
      }
    } catch (error) {
       console.error("Error syncing user to Firestore:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
         await syncUserToFirestore(currentUser);
      } else {
         setBalance(0);
         setFavorites([]);
         setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    await syncUserToFirestore(cred.user);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const toggleFavorite = async (marketId: string) => {
    if (!user) return;
    const isFavorite = favorites.includes(marketId);
    const userRef = doc(db, "users", user.uid);
    try {
      if (isFavorite) {
        await updateDoc(userRef, { favorites: arrayRemove(marketId) });
        setFavorites(prev => prev.filter(id => id !== marketId));
      } else {
        await updateDoc(userRef, { favorites: arrayUnion(marketId) });
        setFavorites(prev => [...prev, marketId]);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const addFunds = async (amount: number) => {
    if (!user) return;
    await addFundsToWallet(user.uid, amount);
    await refreshBalance();
  };

  const resetBalance = async () => {
    if (!user) return;
    await resetWalletBalance(user.uid);
    await refreshBalance();
  };

  return (
    <AuthContext.Provider value={{ 
      user, isAdmin, favorites, balance, loading, 
      signInWithGoogle, signUpWithEmail, loginWithEmail, logout, 
      toggleFavorite, addFunds, resetBalance, refreshBalance 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
