import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const resolvePath = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

/**
 * Chemin racine du site.
 *
 * Vaut « / » en développement et en prévisualisation locale. Sur GitHub Pages,
 * le site est servi sous le nom du dépôt (« /language/ ») : sans ce préfixe,
 * toutes les ressources sont demandées à la racine du domaine et la page reste
 * blanche. Le workflow de déploiement fournit la valeur via BASE_PATH.
 *
 * La barre finale est obligatoire — le service worker construit son périmètre
 * à partir de cette chaîne, et « /language » sans barre le placerait à côté.
 */
const rawBase = process.env.BASE_PATH ?? '/';
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@polyglotte/core': resolvePath('../../packages/core/src/index.ts'),
      '@polyglotte/content': resolvePath('../../packages/content/src/index.ts'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        // Tout est précaché : l'application doit démarrer dans le métro, en
        // avion, dans un train sans réseau. C'est une condition pour réviser
        // tous les jours, et donc pour tenir dans la durée.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Sans le préfixe, une navigation hors-ligne retomberait sur la racine
        // du domaine, qui n'appartient pas à l'application.
        navigateFallback: `${base}index.html`,
      },
      manifest: {
        name: 'Polyglotte',
        short_name: 'Polyglotte',
        description: "Apprendre l'anglais, l'espagnol, l'italien et l'arabe tunisien",
        lang: 'fr',
        theme_color: '#1a1b26',
        background_color: '#1a1b26',
        display: 'standalone',
        // `scope` délimite ce que l'application installée considère comme
        // sien : en dehors, le téléphone rouvrirait le navigateur.
        scope: base,
        start_url: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
