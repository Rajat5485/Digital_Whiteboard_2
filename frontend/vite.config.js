import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "react-router": "react-router/dist/index.js"
    }
  },

  optimizeDeps: {
    include: ["react-router-dom"]
  }
});