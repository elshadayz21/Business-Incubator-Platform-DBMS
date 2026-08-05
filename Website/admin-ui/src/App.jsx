import { useState, useEffect } from "react";
import Admin from "./features/admin/admin";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
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
      
      // If not authenticated as admin, redirect to website home page
      window.location.href = "/";
    };

    checkAuth();

    // Listen for successful login
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);

    // Custom event for same-window updates
    window.addEventListener("auth-change", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-change", handleStorageChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{isAuthenticated ? <Admin /> : null}</>;
}

export default App;
