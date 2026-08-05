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
        return await res.json();
    } catch (error) {
        return { success: false, message: error.response ? error.response.data : (error.message || "Network Error") };
    }
};