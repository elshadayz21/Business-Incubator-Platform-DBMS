import { useState, useEffect } from "react";
import Admin from "./features/admin/admin";
import LoginPage from "./features/auth/login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = () => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    const user = sessionStorage.getItem("user");

    if (isLoggedIn === "true" && user) {
      try {
        const userData = JSON.parse(user);
        const role = userData.role?.toUpperCase();
        if (role === "ADMIN" || role === "SUPERADMIN") {
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
  };

  useEffect(() => {
    checkAuth();

    // Listen for storage changes across tabs or windows
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    // Custom event for same-window login/logout updates
    window.addEventListener("auth-change", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-change", handleStorageChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F6FAFC]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#00ADEF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#006F9E]">Loading DxValley Admin Portal...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Admin /> : <LoginPage />;
}

export default App;
