import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";

function spa404Fallback() {
  let outDir;

  return {
    name: "spa-404-fallback",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      await copyFile(resolve(outDir, "index.html"), resolve(outDir, "404.html"));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_BASE_URL || "https://kali-ai-mjqf.onrender.com";
  return {
    plugins: [react(), tailwindcss(), spa404Fallback()],
    server: {
      port: 3000,
      strictPort: true,
      allowedHosts: ["sb-1ifa1teutwyq.vercel.run"],
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
