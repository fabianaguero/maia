import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  clearScreen: false,
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 1421,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    target: "es2020",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("react") || id.includes("scheduler")) {
            return "vendor-react";
          }

          if (id.includes("lucide-react")) {
            return "vendor-icons";
          }

          if (id.includes("@tauri-apps")) {
            return "vendor-tauri";
          }

          return "vendor";
        },
      },
    },
  },
});
