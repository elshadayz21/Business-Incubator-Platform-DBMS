import { useState, useEffect } from "react";
import Admin from "./features/admin/admin";
import LoginPage from "./features/auth/login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = () => {
      const isLoggedIn = sessionStorage.getItem("isLoggedIn");
      const user = sessionStorage.getItem("user");
      const loginTime = sessionStorage.getItem("loginTime");

      if (isLoggedIn === "true" && user && loginTime) {
        try {
          const userData = JSON.parse(user);
          // Check if user is admin
          if (userData.role === "admin") {
            setIsAuthenticated(true);
          } else {
            // Clear session if not admin
            sessionStorage.clear();
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
          sessionStorage.clear();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
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

  return <>{isAuthenticated ? <Admin /> : <LoginPage />}</>;
}

export default App;
