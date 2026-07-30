export const login = async (credentials) => {
    try {
        if (!window.electron || !window.electron.invoke) {
            return { success: false, message: "Electron IPC is no   t available in this context" };
        }
        return await window.electron.invoke('auth:login', credentials);
    } catch (error) {
        return { success: false, message: error.response ? error.response.data : "Network Error" };
    }
};