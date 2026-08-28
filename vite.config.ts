import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Percorsi relativi: funziona sia su un dominio proprio sia su
// https://<utente>.github.io/<repo>/ senza dover configurare nulla.
export default defineConfig({
  base: "./",
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
