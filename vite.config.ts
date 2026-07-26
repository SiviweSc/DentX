import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Use absolute root base for cleaner canonical URLs and route output.
  base: "/",

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ["**/*.svg", "**/*.csv"],

  build: {
    // Ensure assets are generated with proper relative paths
    outDir: "dist",
    assetsDir: "assets",
    // Generate source maps for debugging (can be disabled for production)
    sourcemap: false,
    minify: "esbuild",
    cssMinify: true,
    cssCodeSplit: true,
    modulePreload: {
      polyfill: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          ui: ["@mui/material", "@mui/icons-material", "lucide-react"],
          charts: ["recharts", "react-big-calendar"],
        },
      },
    },
  },
});
