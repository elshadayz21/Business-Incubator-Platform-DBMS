import { useState, useEffect, useCallback } from "react";
import Admin from "./features/admin/admin";
import LoginPage from "./features/auth/login";
import EntrepreneurPortal from "./features/entrepreneur/EntrepreneurPortal";
import MentorPortal from "./features/mentor/MentorPortal";

// Each role gets its own top-level URL under /admin so the browser address
// bar (and refresh/bookmark/back-button behaviour) reflects who's signed in.
// The backend's SPA fallback (app.get(/^\/admin(\/.*)?$/)) serves index.html
// for all of these, so any of them can be loaded/refreshed directly.
const ROLE_PATHS = {
  admin: "/admin",
  superadmin: "/admin/superadmin",
  entrepreneur: "/admin/entrepreneur",
  mentor: "/admin/mentor",
};
const LOGIN_PATH = "/admin/login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [, setUserVersion] = useState(0);

  // Capture ?openChat=<userId> or ?openTab=<tabName> from an email
  // notification link before the auth gate below rewrites the URL. Stashed
  // in sessionStorage so it survives being bounced to /admin/login
  // (unauthenticated visitors must log in first); the destination portal
  // reads and clears it once mounted.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openChat = params.get("openChat");
    const openTab = params.get("openTab");
    if (openChat) {
      sessionStorage.setItem("pending_open_chat", openChat);
    }
    if (openTab) {
      sessionStorage.setItem("pending_open_tab", openTab);
    }
  }, []);

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

    // On the login page itself, there's no point silently probing for a
    // server session: if a valid session existed, the user wouldn't have
    // been sent here in the first place (or they can just log in again).
    // Skipping this avoids a confusing, expected-but-noisy 401 in the
    // console every time someone opens /admin/login.
    const currentPath = window.location.pathname.replace(/\/+$/, "") || "/admin";
    if (currentPath === LOGIN_PATH) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    // Check server session when navigating directly to /admin
    fetch("/v1/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.role) {
          const role = data.user.role.toLowerCase();
          if (["admin", "superadmin", "entrepreneur", "mentor"].includes(role)) {
            sessionStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("user", JSON.stringify(data.user));
            setUserRole(role);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }
        setIsAuthenticated(false);
        setIsLoading(false);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setIsLoading(false);
      });
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

    fetch("/v1/auth/me")
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
          storedUser.bio = serverUser.bio ?? storedUser.bio ?? null;
          storedUser.company = serverUser.company ?? storedUser.company ?? null;
          storedUser.expertise = serverUser.expertise ?? storedUser.expertise ?? null;
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

  // Keep the address bar in sync with who's signed in: each role has its
  // own URL (/admin, /admin/superadmin, /admin/entrepreneur, /admin/mentor),
  // and signed-out visitors always land on /admin/login. This runs after
  // auth resolves so a direct visit/refresh/bookmark of any of these URLs
  // ends up correct.
  useEffect(() => {
    if (isLoading) return;

    const currentPath = window.location.pathname.replace(/\/+$/, "") || "/admin";

    if (!isAuthenticated) {
      if (currentPath !== LOGIN_PATH) {
        window.history.replaceState(null, "", LOGIN_PATH);
      }
      return;
    }

    const expectedPath = ROLE_PATHS[userRole] || "/admin";
    if (currentPath !== expectedPath) {
      window.history.replaceState(null, "", expectedPath);
    }
  }, [isLoading, isAuthenticated, userRole]);

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
