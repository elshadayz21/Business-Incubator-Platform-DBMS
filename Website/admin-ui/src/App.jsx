import { useState, useEffect, useCallback } from "react";
import Admin from "./features/admin/admin";
import LoginPage from "./features/auth/login";
import EntrepreneurPortal from "./features/entrepreneur/EntrepreneurPortal";
import MentorPortal from "./features/mentor/MentorPortal";
import { apiFetch } from "./config/api";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [, setUserVersion] = useState(0);

  const checkAuth = useCallback(() => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    const user = sessionStorage.getItem("user");

    if (isLoggedIn === "true" && user) {
      try {
        const userData = JSON.parse(user);
        const role = userData.role?.toLowerCase();
        if (["admin", "superadmin", "entrepreneur", "mentor"].includes(role)) {
          setUserRole(role);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        sessionStorage.clear();
      }
    }

    setIsAuthenticated(false);
    setIsLoading(false);
  }, []);

  const syncUserFromServer = useCallback(() => {
    const stored = sessionStorage.getItem("user");
    if (!stored) return;

    let storedUser;
    try {
      storedUser = JSON.parse(stored);
    } catch {
      return;
    }

    apiFetch("/v1/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.user) return;
        const serverUser = data.user;

        // The session cookie is shared across tabs, but sessionStorage is
        // per-tab. Only refresh this tab's data when the server session
        // belongs to the SAME account, otherwise this tab could pick up
        // another account's profile image.
        if (!serverUser.id || !storedUser.id || serverUser.id !== storedUser.id) {
          return;
        }

        try {
          storedUser.profile_image =
            serverUser.profile_image ?? storedUser.profile_image ?? null;
          storedUser.name = serverUser.name ?? storedUser.name;
          storedUser.email = serverUser.email ?? storedUser.email;
          storedUser.role = serverUser.role ?? storedUser.role;
          sessionStorage.setItem("user", JSON.stringify(storedUser));
          setUserVersion((v) => v + 1);
        } catch (error) {
          console.error("Error syncing user data:", error);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Cross-tab auth state changes (localStorage writes) - only re-check
    // this tab's own sessionStorage, never re-fetch the shared session.
    const handleStorageChange = () => {
      checkAuth();
    };

    // Same-tab login/logout updates - re-check and refresh this tab's data.
    const handleAuthChange = () => {
      checkAuth();
      syncUserFromServer();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-change", handleAuthChange);

    const initialCheck = setTimeout(() => checkAuth(), 0);

    return () => {
      clearTimeout(initialCheck);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, [checkAuth, syncUserFromServer]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Refresh the latest user data (profile image, etc.) from the server
    const syncTimer = setTimeout(syncUserFromServer, 0);

    return () => clearTimeout(syncTimer);
  }, [isAuthenticated, syncUserFromServer]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F6FAFC]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#00ADEF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#006F9E]">Loading DxValley Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  if (userRole === "entrepreneur") return <EntrepreneurPortal />;
  if (userRole === "mentor") return <MentorPortal />;

  return <Admin />;
}

export default App;
