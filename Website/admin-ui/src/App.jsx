import { useState, useEffect, useCallback } from "react";
import Admin from "./features/admin/admin";
import LoginPage from "./features/auth/login";
import EntrepreneurPortal from "./features/entrepreneur/EntrepreneurPortal";
import MentorPortal from "./features/mentor/MentorPortal";

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

  // A browser cookie (and therefore the server-side session) is shared by
  // every tab open on this site — there is no such thing as a separate
  // logged-in account per tab. So at any moment there is exactly one
  // "currently signed-in account", and it's whichever tab logged in most
  // recently. This function makes the CURRENT tab match that reality: it
  // asks the server who is actually logged in right now and, if this tab's
  // cached copy is out of date (a different account, or logged out), it
  // reloads so every part of the portal — sidebar, data fetches, everything
  // — comes up fresh and consistent for the account that's really active.
  const syncUserFromServer = useCallback(() => {
    const stored = sessionStorage.getItem("user");
    let storedUser = null;
    if (stored) {
      try {
        storedUser = JSON.parse(stored);
      } catch {
        storedUser = null;
      }
    }

    fetch("/api/admin/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const serverUser = data?.user || null;

        if (!serverUser) {
          // No one is signed in on this browser anymore (logged out from
          // another tab). Drop back to the login screen.
          if (storedUser) {
            sessionStorage.clear();
            localStorage.setItem("isLoggedIn", "false");
            window.location.reload();
          }
          return;
        }

        if (!storedUser || serverUser.id !== storedUser.id) {
          // A different account is now the active session for this browser
          // (someone signed in from another tab). Adopt it here too and
          // reload so this tab is fully re-initialized for that account,
          // instead of mixing a stale cached identity with fresh data.
          sessionStorage.setItem(
            "user",
            JSON.stringify({ ...storedUser, ...serverUser })
          );
          sessionStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("isLoggedIn", "true");
          window.location.reload();
          return;
        }

        // Same account — just refresh any fields that may have changed
        // (profile picture, name, etc.) without a full reload.
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
    // Cross-tab auth state changes (localStorage writes from another tab
    // logging in/out) - re-check this tab's own auth flag and resync
    // against whichever account is now actually signed in.
    const handleStorageChange = () => {
      checkAuth();
      syncUserFromServer();
    };

    // Same-tab login/logout updates - re-check and refresh this tab's data.
    const handleAuthChange = () => {
      checkAuth();
      syncUserFromServer();
    };

    // When the user switches back to this tab (it's now "the tab being
    // used"), make sure it reflects whichever account is currently signed
    // in, in case a login/logout happened in another tab while this one
    // was in the background.
    const handleFocusOrVisible = () => {
      if (document.visibilityState === "hidden") return;
      syncUserFromServer();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-change", handleAuthChange);
    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    const initialCheck = setTimeout(() => checkAuth(), 0);

    return () => {
      clearTimeout(initialCheck);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-change", handleAuthChange);
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
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
