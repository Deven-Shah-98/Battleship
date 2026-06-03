import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Use a relative base so the built site works on any static host
// (e.g. devinapps.com subpaths or GitHub Pages).
export default defineConfig({
  base: "./",
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
  },
});
