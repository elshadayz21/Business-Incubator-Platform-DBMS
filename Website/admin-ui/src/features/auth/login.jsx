import { useState } from "react";
import { login } from "../../services/authService.js";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await login({ email, password });

      if (response?.success) {
        setSuccess("Login successful! Welcome back.");
        setEmail("");
        setPassword("");

        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("user", JSON.stringify(response.user));
        sessionStorage.setItem("loginTime", new Date().toISOString());

        // Trigger auth change event for App.jsx to pick up
        window.dispatchEvent(new Event("auth-change"));
      } else {
        setError(response?.message || "Login failed. Please try again.");
      }
    } catch (err) {
      setError(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white h-screen w-screen flex flex-col relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-10 left-5 md:left-20 pointer-events-none z-0 opacity-80">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-yellow-300 border-2 border-black rounded-full flex items-center justify-center text-3xl md:text-4xl shadow-lg transform -rotate-12">
          🔐
        </div>
      </div>
      <div className="absolute bottom-32 right-5 md:right-32 pointer-events-none z-0 opacity-80">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-pink-500 text-white border-2 border-black rounded-full flex items-center justify-center text-4xl md:text-5xl shadow-lg transform rotate-12">
          🚀
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-4 leading-tight">
              Welcome <br />
              <span className="bg-yellow-300 px-4 md:px-6 border-2 border-black transform -rotate-2 inline-block shadow-lg">
                Back
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 font-medium mt-6">
              Sign in to continue your startup journey
            </p>
          </div>
          {/* Login Form Card */}
          <div className="bg-white border-4 border-black rounded-3xl p-8 md:p-12 shadow-xl">
            {/* Success Message */}
            {success && (
              <div className="bg-green-300 border-3 border-black rounded-2xl p-4 mb-6 flex items-start gap-3">
                <span className="text-3xl">✅</span>
                <div>
                  <h3 className="font-bold text-lg text-black">Success!</h3>
                  <p className="text-gray-800">{success}</p>
                </div>
              </div>
            )}
            {/* Error Message */}
            {error && (
              <div className="bg-red-300 border-3 border-black rounded-2xl p-4 mb-6 flex items-start gap-3">
                <span className="text-3xl">❌</span>
                <div>
                  <h3 className="font-bold text-lg text-black">Error</h3>
                  <p className="text-gray-800">{error}</p>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-lg font-bold text-black mb-3"
                >
                  📧 Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className="w-full px-5 py-4 rounded-2xl border-3 border-black text-lg font-medium focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                />
              </div>
              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-lg font-bold text-black mb-3"
                >
                  🔒 Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="w-full px-5 py-4 rounded-2xl border-3 border-black text-lg font-medium focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                />
              </div>
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 md:py-5 rounded-2xl bg-yellow-300 text-black border-3 border-black font-bold text-lg md:text-xl shadow-lg hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-3 border-black border-t-transparent"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Sign In & Launch
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
