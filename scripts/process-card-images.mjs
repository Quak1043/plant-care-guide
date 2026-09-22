import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('assets');
const manifestPath = path.resolve('assets/manifest.json');
const pagesPath = path.resolve('src/data/pages.json');

// Strip comments from JSON (supports /* */ and // comments)
function stripJsonComments(str) {
  let result = '';
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const next = str[i + 1];
    if (inString) {
      result += ch;
      if (ch === '\\' && next) { result += next; i++; continue; }
      if (ch === '"') inString = false;
    } else if (inLineComment) {
      if (ch === '\n') { inLineComment = false; result += ch; }
    } else if (inBlockComment) {
      if (ch === '*' && next === '/') { inBlockComment = false; i++; }
    } else {
      if (ch === '"') { inString = true; result += ch; }
      else if (ch === '/' && next === '/') { inLineComment = true; i++; }
      else if (ch === '/' && next === '*') { inBlockComment = true; i++; }
      else result += ch;
    }
  }
  return result;
}

// New card images for 12 articles
const articleCards = [
  { base: 'card-araceae', articleId: 'araceae-guide' },
  { base: 'card-calathea', articleId: 'calathea-care' },
  { base: 'card-succulent-summer', articleId: 'succulent-summer' },
  { base: 'card-cactus-guide', articleId: 'cactus-guide' },
  { base: 'card-phalaenopsis-care', articleId: 'phalaenopsis-care' },
  { base: 'card-bulb-flower', articleId: 'bulb-flower-guide' },
  { base: 'card-large-plants-guide', articleId: 'large-plant-guide' },
  { base: 'card-fiddle-leaf-fig', articleId: 'fiddle-leaf-fig-care' },
  { base: 'card-hydroponic', articleId: 'hydroponic-guide' },
  { base: 'card-aquatic-plants', articleId: 'aquatic-plant-guide' },
  { base: 'card-fern-care', articleId: 'fern-care-guide' },
  { base: 'card-air-plant-guide', articleId: 'air-plant-guide' },
];

// New category images for 6 top-level categories
const categoryCats = [
  { base: 'cat-foliage' },
  { base: 'cat-succulent' },
  { base: 'cat-flowering' },
  { base: 'cat-large-plants' },
  { base: 'cat-hydroponic' },
  { base: 'cat-fern-special' },
];

const widths = [400, 800, 1216]; // Match existing card image sizes

async function processCard(baseName) {
  const sourcePath = path.join(assetsDir, `${baseName}.jpg`);
  if (!fs.existsSync(sourcePath)) {
    console.warn(`  ! Source not found: ${baseName}.jpg`);
    return null;
  }

  const metadata = await sharp(sourcePath).metadata();
  const intrinsic = { width: metadata.width, height: metadata.height };
  const ratio = Math.round((metadata.width / metadata.height) * 10000) / 10000;

  const entry = {
    base: baseName,
    intrinsic,
    ratio,
    source: `${baseName}.jpg`,
    avif: {},
    webp: {},
    jpeg: {},
  };

  for (const w of widths) {
    const avifOut = path.join(assetsDir, `${baseName}-${w}.avif`);
    const webpOut = path.join(assetsDir, `${baseName}-${w}.webp`);
    const jpegOut = path.join(assetsDir, `${baseName}-${w}.jpg`);

    await sharp(sourcePath).resize(w, null, { withoutEnlargement: false }).avif({ quality: 60 }).toFile(avifOut);
    await sharp(sourcePath).resize(w, null, { withoutEnlargement: false }).webp({ quality: 75 }).toFile(webpOut);
    await sharp(sourcePath).resize(w, null, { withoutEnlargement: false }).jpeg({ quality: 82 }).toFile(jpegOut);

    entry.avif[String(w)] = `assets/${baseName}-${w}.avif`;
    entry.webp[String(w)] = `assets/${baseName}-${w}.webp`;
    entry.jpeg[String(w)] = `assets/${baseName}-${w}.jpg`;
  }

  console.log(`  ✓ ${baseName} (${intrinsic.width}x${intrinsic.height})`);
  return entry;
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const pages = JSON.parse(fs.readFileSync(pagesPath, 'utf-8'));

  console.log('Processing 12 article card images...\n');
  let added = 0;
  for (const card of articleCards) {
    if (manifest[card.base]) {
      console.log(`  - ${card.base} already exists, skipping`);
      continue;
    }
    const entry = await processCard(card.base);
    if (entry) {
      manifest[card.base] = entry;
      added++;
    }
  }

  console.log(`\nProcessing 6 category cover images...\n`);
  for (const cat of categoryCats) {
    // Always regenerate category images
    const entry = await processCard(cat.base);
    if (entry) {
      manifest[cat.base] = entry;
      added++;
    }
  }

  // Sort manifest
  const sorted = {};
  Object.keys(manifest).sort().forEach(key => { sorted[key] = manifest[key]; });
  fs.writeFileSync(manifestPath, JSON.stringify(sorted, null, 2) + '\n');
  console.log(`\nManifest updated: ${added} entries added/updated`);

  // Update pages.json
  console.log('\nUpdating article images in pages.json...');
  let pageUpdates = 0;
  for (const card of articleCards) {
    const page = pages.find(p => p.id === card.articleId);
    if (page) {
      page.image = card.base;
      pageUpdates++;
      console.log(`  ✓ ${card.articleId} → ${card.base}`);
    }
  }
  fs.writeFileSync(pagesPath, JSON.stringify(pages, null, 2) + '\n');
  console.log(`\nPages updated: ${pageUpdates} articles`);

  console.log('\nAll done!');
}

main().catch(err => { console.error(err); process.exit(1); });
