import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { updateUser } from '@/config/functions';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, countryOfResidenceId?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pendingCountryOfResidence = useRef<string | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // If user just signed in, create/get user in Firestore
      if (firebaseUser) {
        try {
          const username = firebaseUser.email?.split('@')[0] || 'User';
          const email = firebaseUser.email || '';
          
          // Get country from ref if it was set during registration
          const countryId = pendingCountryOfResidence.current;
          pendingCountryOfResidence.current = undefined; // Clear it after use
          
          const response = await updateUser(username, email, countryId);
          
          if (response.success) {
            console.log('User created/retrieved:', response.user);
          } else {
            console.warn('Failed to create user in Firestore:', response.message);
            // Continue anyway - user is authenticated
          }
        } catch (error: any) {
          // If functions aren't deployed or there's a network issue, just log and continue
          console.warn('Could not call updateUser function:', error?.code || error?.message || error);
          console.log('User is still authenticated, continuing without Firestore user doc');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, password: string, countryOfResidenceId?: string) => {
    try {
      // Store country ID in ref so it can be used in onAuthStateChanged
      pendingCountryOfResidence.current = countryOfResidenceId;
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      // Clear the pending country if registration fails
      pendingCountryOfResidence.current = undefined;
      console.error('Error registering:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, registerWithEmail, signOut }}>
      <View style={styles.container}>
        {children}
      </View>
    </AuthContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
