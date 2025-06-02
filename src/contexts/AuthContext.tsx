import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  async function registerWithEmail(email: string, password: string, name: string) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      
      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email || '',
        name: name,
        photoURL: result.user.photoURL || '',
        preferredCurrency: 'INR',
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      setUserProfile(userProfile);
    } catch (error) {
      throw error;
    }
  }
  
  async function loginWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  
  async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user profile exists, if not create one
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        const newUserProfile: UserProfile = {
          uid: result.user.uid,
          email: result.user.email || '',
          name: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          preferredCurrency: 'INR',
          createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', result.user.uid), newUserProfile);
        setUserProfile(newUserProfile);
      } else {
        setUserProfile(userDoc.data() as UserProfile);
      }
    } catch (error) {
      throw error;
    }
  }
  
  async function logout() {
    return signOut(auth);
  }
  
  async function updateUserProfile(data: Partial<UserProfile>) {
    if (!user) throw new Error('No user logged in');
    
    const updatedProfile = { ...userProfile, ...data };
    await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
    setUserProfile(updatedProfile as UserProfile);
  }
  
  const value = {
    user,
    userProfile,
    loading,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
    updateUserProfile
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}