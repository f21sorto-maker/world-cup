import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const proxy = {
  "/espn": {
    target: "https://site.api.espn.com",
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/espn/, "")
  },
  "/poly": {
    target: "https://gamma-api.polymarket.com",
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/poly/, "")
  },
  "/fifa": {
    target: "https://inside.fifa.com",
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/fifa/, "")
  },
  "/fifa-api": {
    target: "https://api.fifa.com",
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/fifa-api/, "")
  }
};

export default defineConfig({
  plugins: [react],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    proxy
  }
});
