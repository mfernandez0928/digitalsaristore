import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, inMemoryPersistence } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { StoreSettings } from "../types";
import { handleFirestoreError, OperationType } from "../lib/errorHandling";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  storeSettings: StoreSettings | null;
  userData: any | null;
  updateSettings: (settings: Partial<StoreSettings>) => Promise<void>;
  updateUserProfile: (data: {
    displayName?: string;
    phone?: string;
    address?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(
    null,
  );
  const [userData, setUserData] = useState<any | null>(null);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    auth._persistence = inMemoryPersistence;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user && db) {
        try {
          // Fetch store settings
          const settingsDoc = await getDoc(doc(db, "settings", "config"));
          if (settingsDoc.exists()) {
            const data = settingsDoc.data() as StoreSettings;
            setStoreSettings(data);
            setIsAdmin(
              user.email === data.adminEmail ||
                user.email === "triosstore26@gmail.com",
            );
          } else {
            const initialSettings: StoreSettings = {
              storeName: "My Sari-Sari Store",
              adminEmail: "triosstore26@gmail.com",
            };
            try {
              await setDoc(doc(db, "settings", "config"), initialSettings);
              setStoreSettings(initialSettings);
              setIsAdmin(true);
            } catch (err) {
              console.error("Failed to initialize store settings:", err);
              // If we can't create it, we just set the local state to initial
              setStoreSettings(initialSettings);
            }
          }

          // Fetch user profile data
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            const initialUserData = {
              email: user.email,
              displayName: user.displayName || "",
              phone: "",
              address: "",
              createdAt: new Date(),
            };
            await setDoc(doc(db, "users", user.uid), initialUserData);
            setUserData(initialUserData);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, "settings/config");
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateSettings = async (settings: Partial<StoreSettings>) => {
    if (!isAdmin || !db || !storeSettings) return;
    const updated = { ...storeSettings, ...settings };
    await setDoc(doc(db, "settings", "config"), updated, { merge: true });
    setStoreSettings(updated);
  };

  const updateUserProfile = async (data: {
    displayName?: string;
    phone?: string;
    address?: string;
  }) => {
    if (!user || !db) return;

    try {
      // Update Firebase Auth profile if displayName is provided
      if (data.displayName && auth.currentUser) {
        const { updateProfile } = await import("firebase/auth");
        await updateProfile(auth.currentUser, {
          displayName: data.displayName,
        });
      }

      // Update Firestore user document
      const updatedData = { ...userData, ...data, updatedAt: new Date() };
      await setDoc(doc(db, "users", user.uid), updatedData, { merge: true });
      setUserData(updatedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const logout = async () => {
    if (!auth) return;
    await auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        storeSettings,
        userData,
        updateSettings,
        updateUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
