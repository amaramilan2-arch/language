/**
 * Parcours de bout en bout.
 *
 * Joue une session complète dans un vrai navigateur, puis vérifie que la
 * progression a survécu à un rechargement. Les tests unitaires valident la
 * logique ; celui-ci valide que l'ensemble s'assemble — c'est le seul capable
 * de détecter un exercice qui ne rend rien ou une transaction qui n'écrit pas.
 *
 * Lancement :
 *   npm run build
 *   npm run preview &
 *   npm run e2e
 *
 * Le navigateur est celui de Playwright. Définissez CHROMIUM_PATH pour en
 * imposer un autre, ou laissez Playwright résoudre son installation par défaut.
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

page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('h1', { timeout: 15000 });
log('ACCUEIL :', await page.locator('h1').first().innerText());
await page.screenshot({ path: shot('01-accueil') });

// --- Session --------------------------------------------------------------
await page.getByRole('button', { name: /session|Réviser/i }).first().click();
await page.waitForTimeout(2500);
await page.screenshot({ path: shot('02-session') });

let answered = 0;
for (let step = 0; step < 60; step++) {
  if (await page.getByText('Session terminée').isVisible().catch(() => false)) break;

  // Carte mémoire : révéler puis noter.
  const reveal = page.getByRole('button', { name: 'Afficher la réponse' });
  if (await reveal.isVisible().catch(() => false)) {
    await reveal.click();
    await page.waitForTimeout(120);
    await page.getByRole('button', { name: /^Correct/ }).first().click();
    answered++;
    await page.waitForTimeout(250);
    continue;
  }

  // Carte mémoire déjà retournée (première rencontre) : noter directement.
  const ratings = page.locator('.rating');
  if ((await ratings.count()) > 0) {
    await page.getByRole('button', { name: /^Correct/ }).first().click();
    answered++;
    await page.waitForTimeout(250);
    continue;
  }

  // Choix multiple.
  const choices = page.locator('.choice');
  if ((await choices.count()) > 0) {
    await choices.first().click();
    answered++;
    await page.waitForTimeout(2100);
    continue;
  }

  // Saisie libre.
  const input = page.locator('input.input');
  if (await input.isVisible().catch(() => false)) {
    await input.fill('réponse quelconque');
    await page.getByRole('button', { name: 'Valider' }).click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: 'Continuer' }).click();
    answered++;
    await page.waitForTimeout(250);
    continue;
  }

  // Reconstitution de phrase : poser tous les blocs disponibles.
  const verify = page.getByRole('button', { name: 'Vérifier' });
  if (await verify.isVisible().catch(() => false)) {
    const tokens = page.locator('.tokens').last().locator('.token:not(.token--used)');
    for (let i = await tokens.count(); i > 0; i--) {
      await page.locator('.tokens').last().locator('.token:not(.token--used)').first().click();
      await page.waitForTimeout(60);
    }
    await verify.click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: 'Continuer' }).click();
    answered++;
    await page.waitForTimeout(250);
    continue;
  }

  // Expression orale : pas de micro ici, on passe par l'auto-évaluation.
  const spoke = page.getByRole('button', { name: /J’ai répété|Passer l’enregistrement/ });
  if (await spoke.isVisible().catch(() => false)) {
    await spoke.click();
    await page.waitForTimeout(150);
    await page.getByRole('button', { name: /^Correcte/ }).first().click();
    answered++;
    await page.waitForTimeout(250);
    continue;
  }

  log('!! Aucun contrôle reconnu à l’étape', step);
  await page.screenshot({ path: shot('99-bloque') });
  errors.push('Session bloquée : aucun contrôle reconnu.');
  break;
}

log('EXERCICES RÉPONDUS :', answered);
const finished = await page.getByText('Session terminée').isVisible().catch(() => false);
log('SESSION TERMINÉE :', finished);
await page.screenshot({ path: shot('03-bilan') });

if (finished) {
  await page.getByRole('button', { name: 'Terminer' }).click();
  await page.waitForTimeout(600);
}

// --- Progression ----------------------------------------------------------
await page.getByRole('button', { name: 'Progrès' }).click();
await page.waitForTimeout(1200);
const progressText = await page.locator('.page').innerText();
log('PROGRÈS contient des statistiques :', !progressText.includes('Rien à afficher'));
await page.screenshot({ path: shot('04-progres'), fullPage: true });

// --- Contenu --------------------------------------------------------------
await page.getByRole('button', { name: 'Contenu' }).click();
await page.waitForTimeout(700);
await page.locator('.card button').first().click();
await page.waitForTimeout(400);
await page.screenshot({ path: shot('05-contenu'), fullPage: true });

// --- Réglages -------------------------------------------------------------
await page.getByRole('button', { name: 'Réglages' }).click();
await page.waitForTimeout(700);
await page.screenshot({ path: shot('06-reglages'), fullPage: true });

// --- Arabe tunisien : sens d'écriture et translittération ------------------
await page.getByRole('button', { name: /Arabe tunisien/ }).click();
await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Contenu' }).click();
await page.waitForTimeout(700);
await page.locator('.card button').first().click();
await page.waitForTimeout(400);
const rtlCount = await page.locator('.target--rtl').count();
const translitCount = await page.locator('.translit').count();
log('ARABE — éléments en RTL :', rtlCount, '| translittérations :', translitCount);
await page.screenshot({ path: shot('07-arabe'), fullPage: true });

// --- Persistance après rechargement ---------------------------------------
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Le réglage de langue active doit avoir survécu au rechargement.
await page.getByRole('button', { name: 'Contenu' }).click();
await page.waitForTimeout(600);
const keptLanguage = (await page.locator('h1').first().innerText()).includes('Arabe');
log('RÉGLAGE conservé après rechargement :', keptLanguage);

// On revient à l'anglais, la langue effectivement révisée, pour vérifier que la
// progression elle-même a bien été persistée.
await page.getByRole('button', { name: 'Réglages' }).click();
await page.waitForTimeout(500);
await page.getByRole('button', { name: /Anglais/ }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Progrès' }).click();
await page.waitForTimeout(1200);
const afterReload = await page.locator('.page').innerText();
const persisted = !afterReload.includes('Rien à afficher');
log('PROGRESSION conservée après rechargement :', persisted);
if (!persisted) errors.push('La progression n’a pas survécu au rechargement.');
await page.screenshot({ path: shot('08-apres-rechargement'), fullPage: true });

await browser.close();

log('\n--- ERREURS CONSOLE ---');
if (errors.length === 0) log('aucune');
else errors.slice(0, 15).forEach((e) => log(e));
process.exit(errors.length > 0 || !finished ? 1 : 0);
