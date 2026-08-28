import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './electronApiShim.js'
import App from './App.jsx'

// Global fetch override to automatically attach the CSRF token to state-changing requests
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  const method = options.method ? options.method.toUpperCase() : "GET";
  const csrfMethods = ["POST", "PUT", "DELETE", "PATCH"];

  if (csrfMethods.includes(method)) {
    const match = document.cookie.match(/(?:^|; )csrfToken=([^;]*)/);
    const csrfToken = match ? match[1] : null;
    if (csrfToken) {
      options.headers = {
        ...options.headers,
        "x-csrf-token": csrfToken,
      };
    }
  }
  return originalFetch(url, options);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
