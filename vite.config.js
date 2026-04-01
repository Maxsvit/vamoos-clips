import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    /* APP_PUBLIC_URL у .env бекенда має бути цей же хост:порт (після OAuth редірект на фронт) */
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
      "/auth": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
  /* preview (npm run preview) без проксі не бачить /api — тоді порожній стан і зламані fetch */
  preview: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
      "/auth": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
});
