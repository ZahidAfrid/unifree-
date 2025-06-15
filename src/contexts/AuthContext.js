import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "@/firebase/firebase.config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registrationChecked, setRegistrationChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        setRegistrationChecked(false);
        return;
      }

      try {
        const uid = firebaseUser.uid;
        
        // Get user document first
        const userDoc = await getDoc(doc(db, "users", uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        // Check client registration only if user is a client
        if (userData.userType === "client") {
          const clientDoc = await getDoc(doc(db, "client_registration", uid));
          const clientData = clientDoc.exists() ? clientDoc.data() : {};
          
          setUser({
            ...firebaseUser,
            ...userData,
            ...clientData,
            userType: "client",
            clientProfileCompleted: clientDoc.exists(),
          });
        } 
        // Check freelancer profile only if user is a freelancer
        else if (userData.userType === "freelancer") {
          console.log("🔍 User is a freelancer, checking profile completion...");
          const freelancerDoc = await getDoc(doc(db, "freelancer_profiles", uid));
          const freelancerData = freelancerDoc.exists() ? freelancerDoc.data() : {};
          
          console.log("📄 Freelancer profile exists:", freelancerDoc.exists());
          if (freelancerDoc.exists()) {
            console.log("✅ Freelancer profile data loaded:", {
              fullName: freelancerData.fullName,
              skills: freelancerData.skills?.length || 0
            });
          }
          
          setUser({
            ...firebaseUser,
            ...userData,
            ...freelancerData,
            userType: "freelancer",
            freelancerProfileCompleted: freelancerDoc.exists(),
          });
        } else {
          // No user type set yet
          setUser({
            ...firebaseUser,
            ...userData,
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setUser(firebaseUser);
      } finally {
        setLoading(false);
        setRegistrationChecked(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email, password, fullName, userType = "freelancer") => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: fullName,
      });

      // Save user data in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        fullName,
        userType,
        createdAt: new Date().toISOString(),
        profileCompleted: false,
      });

      return userCredential;
    } catch (error) {
      console.error("Error during signup:", error);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential;
    } catch (error) {
      console.error("Error during signin:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setRegistrationChecked(false);
    } catch (error) {
      console.error("Error during signout:", error);
      throw error;
    }
  };

  const updateUserType = async (userId, userType) => {
    try {
      console.log("🔄 Updating user type in AuthContext:", { userId, userType });
      await setDoc(
        doc(db, "users", userId),
        {
          userType,
          userTypeUpdatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log("✅ User type updated successfully in AuthContext");
    } catch (error) {
      console.error("❌ Error updating user type in AuthContext:", error);
      throw error;
    }
  };

  const getCurrentUserProfile = async () => {
    if (!user) return null;
    const docSnap = await getDoc(doc(db, "users", user.uid));
    return docSnap.exists() ? docSnap.data() : null;
  };

  const hasCompletedClientRegistration = async () => {
    if (!user || !registrationChecked) return false;
    return user.clientProfileCompleted || false;
  };

  const hasCompletedFreelancerRegistration = async () => {
    if (!user || !registrationChecked) return false;
    return user.freelancerProfileCompleted || false;
  };

  const getDashboardRoute = async () => {
    if (!user) return "/login";

    if (user.userType === "client") {
      return user.clientProfileCompleted ? "/client-dashboard" : "/client-registration";
    } else if (user.userType === "freelancer") {
      return user.freelancerProfileCompleted ? "/dashboard" : "/freelancer-registration";
    } else {
      return "/select-user-type";
    }
  };



  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signUp,
        signIn,
        signOut,
        updateUserType,
        getCurrentUserProfile,
        hasCompletedClientRegistration,
        hasCompletedFreelancerRegistration,
        getDashboardRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
