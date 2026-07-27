/**
 * Génère les icônes PNG de l'application à partir d'un SVG.
 *
 * Elles sont indispensables : sans elles, le manifeste pointe dans le vide et
 * la PWA n'est pas installable sur téléphone — or c'est précisément l'usage
 * visé, réviser dans les transports.
 *
 * Le rendu passe par Chromium plutôt que par une bibliothèque d'images : le
 * navigateur est déjà là pour les tests de bout en bout, et cela évite une
 * dépendance native de plus dans un projet qui doit rester simple à reprendre.
 *
 * Lancement : node apps/web/scripts/generate-icons.mjs
 * À relancer uniquement si le dessin change.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const PUBLIC_DIR = fileURLToPath(new URL('../public', import.meta.url));

/**
 * Bulle de parole sur fond sombre.
 *
 * Le dessin tient dans les 80 % centraux : Android rogne les icônes
 * « maskables » selon une forme qui varie d'un fabricant à l'autre, et tout ce
 * qui déborde de cette zone peut être coupé.
 */
const icon = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bulle" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8fb3ff"/>
      <stop offset="100%" stop-color="#6b8ff0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="#1a1b26"/>
  <g transform="translate(0,-8)">
    <path fill="url(#bulle)" d="
      M 146 130
      h 220
      a 54 54 0 0 1 54 54
      v 132
      a 54 54 0 0 1 -54 54
      h -96
      l -74 62
      v -62
      h -50
      a 54 54 0 0 1 -54 -54
      v -132
      a 54 54 0 0 1 54 -54
      z"/>
    <g fill="#1a1b26">
      <circle cx="196" cy="250" r="21"/>
      <circle cx="256" cy="250" r="21"/>
      <circle cx="316" cy="250" r="21"/>
    </g>
  </g>
</svg>`;

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);

await mkdir(PUBLIC_DIR, { recursive: true });

for (const size of [192, 512]) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:#1a1b26}svg{display:block}</style>${icon(size)}`,
  );
  const buffer = await page.screenshot({ omitBackground: false });
  await writeFile(`${PUBLIC_DIR}/icon-${size}.png`, buffer);
  await page.close();
  console.log(`icon-${size}.png généré`);
}

// La même image sert de favicon, pour que l'onglet et l'écran d'accueil
// montrent la même chose.
await writeFile(`${PUBLIC_DIR}/favicon.svg`, `${icon(512).trim()}\n`);
console.log('favicon.svg mis à jour');

await browser.close();
