/**
 * Parcours de bout en bout du dialogue.
 *
 * Un dialogue ne se débloque qu'une fois 60 % du vocabulaire de son unité
 * rencontré : il est donc invisible pour un apprenant qui démarre, et le
 * parcours principal ne le traverse jamais. Ce script enchaîne assez de
 * sessions pour l'atteindre, puis vérifie les trois temps de l'exercice —
 * écoute, questions, relecture.
 *
 * Lancement :
 *   npm run build && npm run preview &
 *   node apps/web/e2e/dialogue.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const OUT = process.env.SCREENSHOT_DIR ?? 'e2e-screenshots';
const shot = (name) => `${OUT}/${name}.png`;

const errors = [];
const log = (...args) => console.log(...args);

const executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('h1', { timeout: 15000 });

/** Joue une session entière, quel que soit l'exercice servi. */
async function playSession() {
  await page.getByRole('button', { name: /session|Réviser/i }).first().click();
  await page.waitForTimeout(2500);

  for (let step = 0; step < 80; step++) {
    if (await page.getByText('Session terminée').isVisible().catch(() => false)) return 'done';
    // Le dialogue clôt la session : on le reconnaît à son en-tête.
    if (await page.getByText('Écoutez l’échange en entier', { exact: false }).isVisible().catch(() => false)) {
      return 'dialogue';
    }
    if (await page.locator('.dialogue-head').isVisible().catch(() => false)) return 'dialogue';

    const reveal = page.getByRole('button', { name: 'Afficher la réponse' });
    if (await reveal.isVisible().catch(() => false)) {
      await reveal.click();
      await page.waitForTimeout(100);
    }

    const ratings = page.locator('.rating');
    if ((await ratings.count()) > 0) {
      await page.getByRole('button', { name: /^Correct/ }).first().click();
      await page.waitForTimeout(200);
      continue;
    }

    const choices = page.locator('.choice');
    if ((await choices.count()) > 0) {
      await choices.first().click();
      await page.waitForTimeout(2100);
      continue;
    }

    const input = page.locator('input.input');
    if (await input.isVisible().catch(() => false)) {
      await input.fill('réponse');
      await page.getByRole('button', { name: 'Valider' }).click();
      await page.waitForTimeout(200);
      await page.getByRole('button', { name: 'Continuer' }).click();
      await page.waitForTimeout(200);
      continue;
    }

    const verify = page.getByRole('button', { name: 'Vérifier' });
    if (await verify.isVisible().catch(() => false)) {
      const pool = page.locator('.tokens').last();
      for (let i = await pool.locator('.token:not(.token--used)').count(); i > 0; i--) {
        await pool.locator('.token:not(.token--used)').first().click();
        await page.waitForTimeout(50);
      }
      await verify.click();
      await page.waitForTimeout(200);
      await page.getByRole('button', { name: 'Continuer' }).click();
      await page.waitForTimeout(200);
      continue;
    }

    const spoke = page.getByRole('button', { name: /J’ai répété|Passer l’enregistrement/ });
    if (await spoke.isVisible().catch(() => false)) {
      await spoke.click();
      await page.waitForTimeout(150);
      await page.getByRole('button', { name: /^Correcte/ }).first().click();
      await page.waitForTimeout(200);
      continue;
    }

    return 'stuck';
  }
  return 'stuck';
}

// Assez de sessions pour franchir le seuil de déblocage de la première unité.
let reached = false;
for (let session = 1; session <= 6 && !reached; session++) {
  const outcome = await playSession();
  log(`session ${session} : ${outcome}`);
  if (outcome === 'dialogue') {
    reached = true;
    break;
  }
  if (outcome === 'stuck') {
    errors.push(`session ${session} bloquée`);
    await page.screenshot({ path: shot('d-bloque') });
    break;
  }
  await page.getByRole('button', { name: 'Terminer' }).click();
  await page.waitForTimeout(600);
}

log('DIALOGUE ATTEINT :', reached);

if (reached) {
  await page.screenshot({ path: shot('d1-ecoute') });

  const title = await page.locator('.dialogue-head h2').innerText();
  log('TITRE :', title);

  // Deux comportements légitimes, selon que l'appareil dispose d'une voix.
  // Avec audio, le texte doit rester masqué — sinon l'exercice mesure la
  // lecture et non l'écoute. Sans voix (Chromium nu, arabe tunisien), le repli
  // en compréhension écrite est voulu et doit être annoncé.
  const scriptVisible = await page.locator('.script').isVisible().catch(() => false);
  const fallbackNotice = await page
    .getByText('Aucune voix de synthèse', { exact: false })
    .isVisible()
    .catch(() => false);

  if (fallbackNotice) {
    log('MODE LECTURE (aucune voix) — script affiché :', scriptVisible);
    if (!scriptVisible) errors.push('Repli en lecture annoncé mais script absent.');
  } else {
    log('MODE ÉCOUTE — texte masqué :', !scriptVisible);
    if (scriptVisible) errors.push('Le script est visible pendant la phase d’écoute.');
  }

  await page.getByRole('button', { name: 'Répondre aux questions' }).click();
  await page.waitForTimeout(500);

  const questionCount = await page.locator('.card .choices').count();
  log('QUESTIONS POSÉES :', questionCount);
  await page.screenshot({ path: shot('d2-questions'), fullPage: true });

  // Répondre à chaque question en prenant la première option.
  for (let i = 0; i < questionCount; i++) {
    await page.locator('.card .choices').nth(i).locator('.choice').first().click();
    await page.waitForTimeout(120);
  }
  await page.getByRole('button', { name: 'Vérifier' }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: shot('d3-correction'), fullPage: true });

  await page.getByRole('button', { name: 'Relire le dialogue' }).click();
  await page.waitForTimeout(400);
  const lines = await page.locator('.script__line').count();
  log('RÉPLIQUES EN RELECTURE :', lines);
  await page.screenshot({ path: shot('d4-relecture'), fullPage: true });

  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.waitForTimeout(600);
  const summaryShown = await page.getByText('Session terminée').isVisible().catch(() => false);
  log('BILAN AFFICHÉ APRÈS DIALOGUE :', summaryShown);
  if (!summaryShown) errors.push('Le bilan ne s’affiche pas après le dialogue.');
  await page.screenshot({ path: shot('d5-bilan'), fullPage: true });
} else {
  errors.push('Le dialogue n’a pas été atteint après six sessions.');
}

await browser.close();

log('\n--- ERREURS ---');
if (errors.length === 0) log('aucune');
else errors.slice(0, 10).forEach((e) => log(e));
process.exit(errors.length > 0 ? 1 : 0);
