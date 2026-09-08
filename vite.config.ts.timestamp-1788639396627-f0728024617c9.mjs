// vite.config.ts
import tailwindcss from "file:///app/applet/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///app/applet/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { defineConfig, loadEnv } from "file:///app/applet/node_modules/vite/dist/node/index.js";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        "@": path.resolve("."),
        "firebase/app": path.resolve("src/lib/firebase.ts"),
        "firebase/auth": path.resolve("src/lib/firebase.ts"),
        "firebase/firestore": path.resolve("src/lib/firebase.ts"),
        "firebase/storage": path.resolve("src/lib/firebase.ts")
      }
    },
    build: {
      chunkSizeWarningLimit: 1e3,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom"],
            "vendor-motion": ["motion"],
            "vendor-firebase": ["firebase/app", "firebase/auth", "firebase/firestore"],
            "vendor-utils": ["lucide-react", "html2canvas", "jspdf"]
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true"
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2FwcGxldFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2FwcC9hcHBsZXQvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2FwcC9hcHBsZXQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtkZWZpbmVDb25maWcsIGxvYWRFbnZ9IGZyb20gJ3ZpdGUnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHttb2RlfSkgPT4ge1xuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsICcuJywgJycpO1xuICByZXR1cm4ge1xuICAgIHBsdWdpbnM6IFtyZWFjdCgpLCB0YWlsd2luZGNzcygpXSxcbiAgICBkZWZpbmU6IHtcbiAgICAgICdwcm9jZXNzLmVudi5HRU1JTklfQVBJX0tFWSc6IEpTT04uc3RyaW5naWZ5KGVudi5HRU1JTklfQVBJX0tFWSksXG4gICAgfSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZSgnLicpLFxuICAgICAgICAnZmlyZWJhc2UvYXBwJzogcGF0aC5yZXNvbHZlKCdzcmMvbGliL2ZpcmViYXNlLnRzJyksXG4gICAgICAgICdmaXJlYmFzZS9hdXRoJzogcGF0aC5yZXNvbHZlKCdzcmMvbGliL2ZpcmViYXNlLnRzJyksXG4gICAgICAgICdmaXJlYmFzZS9maXJlc3RvcmUnOiBwYXRoLnJlc29sdmUoJ3NyYy9saWIvZmlyZWJhc2UudHMnKSxcbiAgICAgICAgJ2ZpcmViYXNlL3N0b3JhZ2UnOiBwYXRoLnJlc29sdmUoJ3NyYy9saWIvZmlyZWJhc2UudHMnKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAgICd2ZW5kb3ItcmVhY3QnOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxuICAgICAgICAgICAgJ3ZlbmRvci1tb3Rpb24nOiBbJ21vdGlvbiddLFxuICAgICAgICAgICAgJ3ZlbmRvci1maXJlYmFzZSc6IFsnZmlyZWJhc2UvYXBwJywgJ2ZpcmViYXNlL2F1dGgnLCAnZmlyZWJhc2UvZmlyZXN0b3JlJ10sXG4gICAgICAgICAgICAndmVuZG9yLXV0aWxzJzogWydsdWNpZGUtcmVhY3QnLCAnaHRtbDJjYW52YXMnLCAnanNwZGYnXVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgc2VydmVyOiB7XG4gICAgICAvLyBITVIgaXMgZGlzYWJsZWQgaW4gQUkgU3R1ZGlvIHZpYSBESVNBQkxFX0hNUiBlbnYgdmFyLlxuICAgICAgLy8gRG8gbm90IG1vZGlmeVx1MDBFMlx1MDA4MFx1MDA5NGZpbGUgd2F0Y2hpbmcgaXMgZGlzYWJsZWQgdG8gcHJldmVudCBmbGlja2VyaW5nIGR1cmluZyBhZ2VudCBlZGl0cy5cbiAgICAgIGhtcjogcHJvY2Vzcy5lbnYuRElTQUJMRV9ITVIgIT09ICd0cnVlJyxcbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW1OLE9BQU8saUJBQWlCO0FBQzNPLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUSxjQUFjLGVBQWM7QUFFcEMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBQyxLQUFJLE1BQU07QUFDdEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxLQUFLLEVBQUU7QUFDakMsU0FBTztBQUFBLElBQ0wsU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFBQSxJQUNoQyxRQUFRO0FBQUEsTUFDTiw4QkFBOEIsS0FBSyxVQUFVLElBQUksY0FBYztBQUFBLElBQ2pFO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxHQUFHO0FBQUEsUUFDckIsZ0JBQWdCLEtBQUssUUFBUSxxQkFBcUI7QUFBQSxRQUNsRCxpQkFBaUIsS0FBSyxRQUFRLHFCQUFxQjtBQUFBLFFBQ25ELHNCQUFzQixLQUFLLFFBQVEscUJBQXFCO0FBQUEsUUFDeEQsb0JBQW9CLEtBQUssUUFBUSxxQkFBcUI7QUFBQSxNQUN4RDtBQUFBLElBQ0Y7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLHVCQUF1QjtBQUFBLE1BQ3ZCLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxVQUNOLGNBQWM7QUFBQSxZQUNaLGdCQUFnQixDQUFDLFNBQVMsV0FBVztBQUFBLFlBQ3JDLGlCQUFpQixDQUFDLFFBQVE7QUFBQSxZQUMxQixtQkFBbUIsQ0FBQyxnQkFBZ0IsaUJBQWlCLG9CQUFvQjtBQUFBLFlBQ3pFLGdCQUFnQixDQUFDLGdCQUFnQixlQUFlLE9BQU87QUFBQSxVQUN6RDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBO0FBQUE7QUFBQSxNQUdOLEtBQUssUUFBUSxJQUFJLGdCQUFnQjtBQUFBLElBQ25DO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
