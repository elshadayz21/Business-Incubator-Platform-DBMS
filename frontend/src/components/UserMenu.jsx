import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, CircleUserRound, LogOut } from "lucide-react";

/**
 * Top-right account menu shared by Admin / Entrepreneur / Mentor portals.
 */
export default function UserMenu({
  user = {},
  roleLabel = "User",
  unreadCount = 0,
  onNotifications,
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const name = user.name || "User";
  const email = user.email || "";
  const profileImage = user.profile_image || null;
  const initial = name.charAt(0).toUpperCase();

  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleLogout =
    onLogout ||
    (async () => {
      if (!window.confirm('Are you sure you want to log out?')) return;
      try {
        await fetch("/v1/auth/logout", { method: "POST" });
      } catch (e) {
        console.error("Logout error:", e);
      }
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = "/admin/login";
    });

  return (
    <div className="flex items-center gap-2" ref={rootRef}>
      {typeof onNotifications === "function" && (
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onNotifications();
          }}
          className="relative grid h-10 w-10 place-items-center rounded-full border border-[#D6E4EA] bg-white text-[#006F9E] transition hover:bg-[#EAF8FC]"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E38524] px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-[#D6E4EA] bg-white py-1.5 pl-1.5 pr-3 text-left transition hover:bg-[#EAF8FC]"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-[#00ADEF] text-xs font-bold text-white">
            {profileImage ? (
              <img
                src={profileImage}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block max-w-[140px] truncate text-xs font-bold text-[#111827]">
              {name}
            </span>
            <span className="block text-[10px] font-semibold capitalize text-[#006F9E]">
              {roleLabel}
            </span>
          </span>
          <ChevronDown
            size={14}
            className={`text-[#526274] transition ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[#D6E4EA] bg-white py-1 shadow-lg">
            <div className="border-b border-[#D6E4EA] px-4 py-3">
              <p className="truncate text-xs font-bold text-[#111827]">{name}</p>
              {email ? (
                <p className="truncate text-[10px] font-medium text-[#526274]">
                  {email}
                </p>
              ) : null}
            </div>

            <a
              href="/v1/auth/profile"
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-[#111827] transition hover:bg-[#EAF8FC] hover:text-[#006F9E]"
              onClick={() => setOpen(false)}
            >
              <CircleUserRound size={15} />
              Profile
            </a>

            {/* No "Notifications" item here — the bell button next to this
                menu (rendered above, whenever onNotifications is passed)
                already does the same thing, so a duplicate entry inside the
                dropdown would just be two ways to trigger one action. */}

            <div className="my-1 border-t border-[#D6E4EA]" />

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-rose-700 transition hover:bg-rose-50"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
