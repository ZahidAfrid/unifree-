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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "Auth state changed:",
        firebaseUser ? "User logged in" : "No user"
      );

      if (firebaseUser) {
        try {
          const uid = firebaseUser.uid;
          console.log("Checking client registration for:", uid);

          // Check if user is a client
          const clientDoc = await getDoc(doc(db, "client_registration", uid));
          if (clientDoc.exists()) {
            console.log("Client registration found:", clientDoc.data());
            const clientData = {
              ...firebaseUser,
              ...clientDoc.data(),
              userType: "client",
              clientProfileCompleted: true,
            };
            console.log("Setting user as client:", clientData);
            setUser(clientData);
            setLoading(false);
            return;
          } else {
            console.log("No client registration found");
          }

          // Check if user is a freelancer
          const freelancerDoc = await getDoc(
            doc(db, "freelancer_profiles", uid)
          );
          if (freelancerDoc.exists()) {
            console.log("Freelancer profile found");
            setUser({
              ...firebaseUser,
              ...freelancerDoc.data(),
              userType: "freelancer",
              freelancerProfileCompleted: true,
            });
            setLoading(false);
            return;
          } else {
            console.log("No freelancer profile found");
          }

          // Fallback to users collection
          console.log("Checking generic user profile");
          const genericUserDoc = await getDoc(doc(db, "users", uid));
          if (genericUserDoc.exists()) {
            console.log("Generic user found:", genericUserDoc.data());
            setUser({
              ...firebaseUser,
              ...genericUserDoc.data(),
            });
          } else {
            console.log("No user profile found, using basic Firebase user");
            setUser(firebaseUser);
          }
        } catch (err) {
          console.error("Error fetching user info:", err);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email, password, fullName, userType = "freelancer") => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName: fullName });

    // ✅ Save selected user type in Firestore
    await setDoc(doc(db, "users", user.uid), {
      fullName,
      email,
      userType, // ✅ Save whether 'client' or 'freelancer'
      createdAt: new Date(),
    });

    return userCredential;
  };

  const signIn = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    toast.success("Signed out");
    setUser(null);
  };

  const updateUserType = async (userId, userType) => {
    console.log(`Updating user ${userId} to type: ${userType}`);

    try {
      // 1. Update the user type in Firestore
      await setDoc(
        doc(db, "users", userId),
        {
          userType,
          userTypeUpdatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // 2. Update the local user state with the new user type
      setUser((prev) => {
        if (!prev) return null;

        const updatedUser = {
          ...prev,
          userType,
        };

        console.log("Updated local user state:", updatedUser);
        return updatedUser;
      });

      // 3. Return true to indicate success
      return true;
    } catch (error) {
      console.error("Error updating user type:", error);
      // Re-throw the error so it can be caught by the caller
      throw error;
    }
  };

  const getCurrentUserProfile = async () => {
    if (!user) return null;
    const docSnap = await getDoc(doc(db, "users", user.uid));
    return docSnap.exists() ? docSnap.data() : null;
  };

  const hasCompletedClientRegistration = async () => {
    if (!user) return false;
    try {
      console.log("Checking if client registration completed for:", user.uid);
      const clientDoc = await getDoc(doc(db, "client_registration", user.uid));
      const exists = clientDoc.exists();
      console.log("Client registration exists:", exists);
      return exists;
    } catch (error) {
      console.error("Error checking client registration:", error);
      return false;
    }
  };

  const hasCompletedFreelancerRegistration = async () => {
    if (!user) return false;
    try {
      console.log(
        "Checking if freelancer registration completed for:",
        user.uid
      );
      const freelancerDoc = await getDoc(
        doc(db, "freelancer_profiles", user.uid)
      );
      const exists = freelancerDoc.exists();
      console.log("Freelancer registration exists:", exists);
      return exists;
    } catch (error) {
      console.error("Error checking freelancer registration:", error);
      return false;
    }
  };

  const getDashboardRoute = async () => {
    if (!user) return "/login";

    if (user.userType === "client") {
      const hasCompletedRegistration = await hasCompletedClientRegistration();
      return hasCompletedRegistration
        ? "/client-dashboard"
        : "/client-registration";
    } else if (user.userType === "freelancer") {
      // Check if freelancer has completed profile
      const hasCompletedRegistration =
        await hasCompletedFreelancerRegistration();
      return hasCompletedRegistration
        ? "/dashboard"
        : "/freelancer-registration";
    } else {
      // No user type selected yet
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
