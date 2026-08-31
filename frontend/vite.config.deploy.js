import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Separate Vite config used ONLY for the Vercel deployment of the
// React admin/portal UI. Builds a standalone SPA into ./dist with absolute
// asset paths, instead of the default bundle that is emitted into
// ../backend/public/admin for the Express-served /admin page.
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});