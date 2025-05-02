import { useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "./Navabr";
import Footer from "./Footer";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

export default function Layout({ children }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // ✅ Handle auth redirects safely
  useEffect(() => {
    if (!router.isReady || authLoading) return;

    // Prevent redirect loop from /login or /signup pages
    if (
      !user &&
      router.pathname !== "/login" &&
      router.pathname !== "/signup"
    ) {
      router.replace("/login");
    }
  }, [router.isReady, authLoading, user, router.pathname]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
