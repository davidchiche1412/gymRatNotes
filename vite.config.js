import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// Plugin: inyecta hash del build en el SW para auto-invalidar cache
function swVersionPlugin() {
  return {
    name: 'sw-version',
    closeBundle() {
      const swPath = resolve('dist/sw.js');
      try {
        let sw = readFileSync(swPath, 'utf8');
        const hash = Date.now().toString(36);
        sw = sw.replace(/gymrat-notes-v\d+/, `gymrat-notes-${hash}`);
        writeFileSync(swPath, sw);
      } catch {
        // SW no encontrado en dist — skip
      }
    },
  };
}

export default defineConfig({
  base: '/gymRatNotes/',
  plugins: [react(), tailwindcss(), swVersionPlugin()],
  server: {
    allowedHosts: true,
  },
})
