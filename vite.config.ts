import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/admin/",
  plugins: [react()],
  root: resolve(__dirname, "src/admin"),
  build: {
    emptyOutDir: true,
    outDir: resolve(__dirname, "dist"),
    rollupOptions: {
      input: resolve(__dirname, "src/admin/index.html"),
    },
  },
});
