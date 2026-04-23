import { defineConfig } from 'vite';

// https://vitejs.dev/config
// The Forge vite template bundles everything into `.vite/build/main.js` and
// the produced app.asar does NOT include node_modules. So only Electron
// itself (which is provided by the runtime) stays external — everything
// else needs to be bundled into the main-process output.
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron'],
    },
  },
});
