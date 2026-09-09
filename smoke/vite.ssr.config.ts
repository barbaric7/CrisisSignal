import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  ssr: { noExternal: ["world-atlas"] },
  build: {
    ssr: "smoke/ssr-entry.tsx",
    outDir: "smoke/dist",
    emptyOutDir: true,
  },
});
