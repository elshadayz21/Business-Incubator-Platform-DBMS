export const login = async (credentials) => {
    try {
        if (window.electron && window.electron.invoke) {
            return await window.electron.invoke('auth:login', credentials);
        }
        
        const res = await fetch("/api/admin/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials)
        });
        if (res.status === 429) {
            return { success: false, message: "Too many login attempts. Please try again after 1 minute." };
        }
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            return { success: false, message: errData.message || errData.error || `HTTP Error ${res.status}` };
        }
        return await res.json();
    } catch (error) {
        return { success: false, message: error.message || "Network Error" };
    }
};