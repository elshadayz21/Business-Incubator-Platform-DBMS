import { useState } from "react";
import { login } from "../../services/authService.js";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        setSuccess("Authentication successful! Redirecting...");
        setEmail("");
        setPassword("");

        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("user", JSON.stringify(response.user));
        sessionStorage.setItem("loginTime", new Date().toISOString());

        // Trigger auth change event for App.jsx to pick up
        setTimeout(() => {
          window.dispatchEvent(new Event("auth-change"));
        }, 400);
      } else {
        setError(response?.message || "Login failed. Please check your email and password.");
      }
    } catch (err) {
      setError(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#F6FAFC] text-[#111827] flex flex-col font-sans selection:bg-[#E38524] selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-[#D6E4EA] bg-white sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6 lg:px-10">
          <a href="/" className="flex items-center gap-3 shrink-0">
            <img
              src="/brand/dxvalley-wordmark.jpeg"
              alt="DxValley Incubation Center"
              className="h-10 w-auto max-w-[190px] object-contain object-left mix-blend-multiply"
            />
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-gradient-to-br from-[#00ADEF] via-[#078CC8] to-[#0878B4] text-white py-12 px-6 flex items-center justify-center">
        {/* Background Decorative Rings */}
        <div className="pointer-events-none absolute -left-24 -top-20 h-[460px] w-[620px] rounded-[48%] border-[70px] border-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-40 bottom-[-240px] h-[620px] w-[760px] rounded-[50%] border-[90px] border-white/10" aria-hidden="true" />

        {/* Clean Login Card */}
        <div className="relative w-full max-w-[440px] rounded-[24px] border border-white/30 bg-white p-8 sm:p-9 text-[#111827] shadow-[0_20px_60px_rgba(0,63,102,0.25)]">
          {/* Card Header with Logo & Welcome Message */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/brand/dxvalley-wordmark.jpeg"
                alt="DxValley Logo"
                className="h-12 w-auto object-contain mix-blend-multiply"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
              Welcome Back!
            </h1>
            <p className="mt-1.5 text-xs font-semibold text-[#526274]">
              Sign in to access your portal account
            </p>
          </div>

          {/* Success Alert */}
          {success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-3.5 text-green-800 flex items-start gap-3 text-xs font-medium">
              <i className="fa-solid fa-circle-check text-green-600 text-base mt-0.5" aria-hidden="true" />
              <div>{success}</div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3.5 text-red-800 flex items-start gap-3 text-xs font-medium">
              <i className="fa-solid fa-circle-exclamation text-red-600 text-base mt-0.5" aria-hidden="true" />
              <div>{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-extrabold uppercase tracking-[.12em] text-[#526274] mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#526274]">
                  <i className="fa-solid fa-envelope text-xs" aria-hidden="true" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dxvalley.com"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-[#111827] font-medium text-sm outline-none transition focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-extrabold uppercase tracking-[.12em] text-[#526274] mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#526274]">
                  <i className="fa-solid fa-lock text-xs" aria-hidden="true" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-11 py-3 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-[#111827] font-medium text-sm outline-none transition focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#526274] hover:text-[#111827] transition"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-xs`} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Primary Orange Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-[#E38524] text-white font-extrabold uppercase tracking-[.1em] text-xs shadow-[0_8px_20px_rgba(227,133,36,0.3)] hover:bg-[#C97019] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin text-sm" aria-hidden="true" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In To Dashboard
                  <i className="fa-solid fa-arrow-right text-xs" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Footer help */}
          <div className="mt-6 pt-4 border-t border-[#D6E4EA] text-center text-[11px] text-[#526274]">
            Need credentials? Contact{" "}
            <a
              href="mailto:hello@dxvalley.com"
              className="text-[#006F9E] font-bold hover:underline"
            >
              DxValley Support
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#006F9E] text-white py-4 px-6 text-xs text-center">
        <p className="text-white/80">© {new Date().getFullYear()} DxValley Incubation Center. Cooperative Bank of Oromia.</p>
      </footer>
    </div>
  );
}
