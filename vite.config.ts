import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const brand = process.env.VITE_BRAND || 'crm-pyme';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  define: {
    __CRM_BRAND__: JSON.stringify(brand),
  },
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
