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
      "f545699ff6cb.ngrok-free.app",
      "a83212c2178c.ngrok-free.app"
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
