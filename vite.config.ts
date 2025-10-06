import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // allow network access (required for ngrok)
    allowedHosts: [
      "localhost",
      "f545699ff6cb.ngrok-free.app", // your ngrok URL
    ],
  },
  plugins: [
    react(), // React plugin
    mode === "development" && componentTagger(), // run componentTagger only in dev
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // alias @ -> src folder
    },
  },
}));
