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
        setSuccess("Authentication successful! Redirecting to dashboard...");
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
      {/* 1. Top Utility Bar - Matches Landing Page */}
      <div className="bg-[#00ADEF] text-white py-2 px-6 text-[11px] font-semibold tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap">
            <span className="flex items-center gap-1.5 font-bold">
              <i className="fa-solid fa-building-columns text-[10px] opacity-90" aria-hidden="true" />
              Cooperative Bank of Oromia
            </span>
            <span className="hidden sm:inline opacity-40">•</span>
            <span className="hidden sm:inline font-medium opacity-95">
              DxValley Incubation Center Management System (ICMS)
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-semibold opacity-90">
            <span>Admin Portal v1.0</span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar - Matches Landing Page */}
      <header className="border-b border-[#D6E4EA] bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6 lg:px-10">
          <div className="flex items-center gap-4">
            <a href="/" className="shrink-0">
              <img
                src="/brand/dxvalley-wordmark.jpeg"
                alt="DxValley Incubation Center"
                className="h-11 w-auto max-w-[200px] object-contain object-left mix-blend-multiply"
              />
            </a>
            <div className="hidden sm:block h-8 w-px bg-[#D6E4EA]" aria-hidden="true" />
            <div className="hidden sm:block text-[10px] font-semibold uppercase leading-tight tracking-[.16em] text-[#526274]">
              Incubation Arm of<br />
              <span className="text-[#006F9E] font-bold">Cooperative Bank of Oromia</span>
            </div>
          </div>

          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#D6E4EA] bg-[#F6FAFC] px-4 py-2 text-xs font-bold text-[#006F9E] transition hover:bg-[#EAF8FC] hover:border-[#00ADEF] shadow-sm"
          >
            <i className="fa-solid fa-arrow-left text-[11px]" aria-hidden="true" />
            Main Website
          </a>
        </div>
      </header>

      {/* 3. Hero Section - Exact Cyan Gradient Palette from Landing Page */}
      <main className="flex-1 relative overflow-hidden bg-gradient-to-br from-[#00ADEF] via-[#078CC8] to-[#0878B4] text-white py-12 lg:py-20 px-6 lg:px-10 flex items-center justify-center">
        
        {/* Decorative Background Concentric Rings (Matching Landing Page Hero) */}
        <div className="pointer-events-none absolute -left-24 -top-20 h-[460px] w-[620px] rounded-[48%] border-[70px] border-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-40 bottom-[-240px] h-[620px] w-[760px] rounded-[50%] border-[90px] border-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute right-[28%] top-14 h-20 w-20 rounded-full bg-white/10 blur-xl" aria-hidden="true" />

        {/* Sign-In Card */}
        <div className="relative w-full max-w-[480px]">
            <div className="relative rounded-[28px] border border-white/30 bg-white p-7 sm:p-9 text-[#111827] shadow-[0_20px_60px_rgba(0,63,102,0.3)]">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#D6E4EA] mb-6">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#006F9E] block mb-1">
                    System Authentication
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
                    Sign In To Your Portal
                  </h2>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#FFF1E3] text-[#E38524] text-xl shadow-sm border border-[#E38524]/20">
                  <i className="fa-solid fa-user-shield" aria-hidden="true" />
                </div>
              </div>

              {/* Success Alert */}
              {success && (
                <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800 flex items-start gap-3 text-sm">
                  <i className="fa-solid fa-circle-check text-green-600 text-lg mt-0.5" aria-hidden="true" />
                  <div className="font-semibold">{success}</div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 flex items-start gap-3 text-sm">
                  <i className="fa-solid fa-circle-exclamation text-red-600 text-lg mt-0.5" aria-hidden="true" />
                  <div className="font-semibold">{error}</div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="admin-email"
                    className="block text-xs font-extrabold uppercase tracking-[.15em] text-[#526274] mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#526274]">
                      <i className="fa-solid fa-envelope text-sm" aria-hidden="true" />
                    </div>
                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@dxvalley.com"
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-[#111827] font-medium text-sm outline-none transition focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="admin-password"
                      className="block text-xs font-extrabold uppercase tracking-[.15em] text-[#526274]"
                    >
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#526274]">
                      <i className="fa-solid fa-lock text-sm" aria-hidden="true" />
                    </div>
                    <input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-11 py-3.5 bg-[#F6FAFC] border border-[#D6E4EA] rounded-xl text-[#111827] font-medium text-sm outline-none transition focus:border-[#00ADEF] focus:bg-white focus:ring-2 focus:ring-[#00ADEF]/20 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#526274] hover:text-[#111827] transition"
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="bg-[#EAF8FC] rounded-xl p-3 border border-[#00ADEF]/20 flex items-center gap-2.5 text-xs text-[#006F9E] font-medium">
                  <i className="fa-solid fa-shield-halved text-[#00ADEF] text-sm shrink-0" aria-hidden="true" />
                  <span>Authorized Superadmins, Admins, Entrepreneurs &amp; Mentors access point.</span>
                </div>

                {/* Primary Orange Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-xl bg-[#E38524] text-white font-extrabold uppercase tracking-[.12em] text-sm shadow-[0_10px_24px_rgba(227,133,36,0.3)] hover:bg-[#C97019] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin text-base" aria-hidden="true" />
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

              {/* Card Footer Help */}
              <div className="mt-6 pt-4 border-t border-[#D6E4EA] text-center text-xs text-[#526274]">
                Need admin credentials? Contact{" "}
                <a
                  href="mailto:support@dxvalley.com"
                  className="text-[#006F9E] font-bold hover:underline"
                >
                  DxValley Technical Team
                </a>
              </div>

            </div>
          </div>

      </main>

      {/* 4. Footer - Matching Landing Page Footer Style */}
      <footer className="bg-[#006F9E] text-white py-6 px-6 lg:px-10 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-white/85">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">DxValley ICMS</span>
            <span>•</span>
            <span>Cooperative Bank of Oromia</span>
          </div>
          <p>© {new Date().getFullYear()} DxValley Incubation Center. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
