import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://backend.permis.transports.gouv.ga',
        changeOrigin: true,
        secure: true,
        // Configuration pour les uploads de fichiers volumineux
        timeout: 60000, // 60 secondes
        // Pas de rewrite nécessaire, on garde /api dans le chemin
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('❌ Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📤 Proxying request:', req.method, req.url, '→', proxyReq.path);
            // Pour les requêtes multipart, s'assurer que les headers sont corrects
            if (req.headers['content-type']?.includes('multipart/form-data')) {
              console.log('📎 Multipart request detected, content-type:', req.headers['content-type']);
            }
            // Augmenter la taille limite pour les uploads
            proxyReq.setTimeout(60000);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📥 Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
})

