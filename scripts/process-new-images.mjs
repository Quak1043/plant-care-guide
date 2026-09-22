import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const encyclopediaDir = path.resolve('assets/encyclopedia');
const manifestPath = path.resolve('assets/manifest.json');
const plantsPath = path.resolve('src/data/plants.json');

// 25 new plants with their image base names
const newPlants = [
  { base: 'plant-calathea' },
  { base: 'plant-peperomia' },
  { base: 'plant-rubber' },
  { base: 'plant-parlor-palm' },
  { base: 'plant-hoya' },
  { base: 'plant-pachyphytum' },
  { base: 'plant-bear-paw' },
  { base: 'plant-haworthia' },
  { base: 'plant-golden-barrel' },
  { base: 'plant-dragon-bone' },
  { base: 'plant-turtle-back' },
  { base: 'plant-aloe' },
  { base: 'plant-lithops' },
  { base: 'plant-phalaenopsis' },
  { base: 'plant-dendrobium' },
  { base: 'plant-hyacinth' },
  { base: 'plant-jasmine' },
  { base: 'plant-gardenia' },
  { base: 'plant-areca-palm' },
  { base: 'plant-yucca' },
  { base: 'plant-water-lily' },
  { base: 'plant-pennywort' },
  { base: 'plant-air-plant' },
  { base: 'plant-venus-flytrap' },
  { base: 'plant-moss' },
];

const widths = [320, 640];

async function processImage(baseName) {
  const sourcePath = path.join(encyclopediaDir, `${baseName}.jpg`);
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
    const avifOut = path.join(encyclopediaDir, `${baseName}-${w}.avif`);
    const webpOut = path.join(encyclopediaDir, `${baseName}-${w}.webp`);
    const jpegOut = path.join(encyclopediaDir, `${baseName}-${w}.jpg`);

    await sharp(sourcePath).resize(w, null, { withoutEnlargement: false }).avif({ quality: 60 }).toFile(avifOut);
    await sharp(sourcePath).resize(w, null, { withoutEnlargement: false }).webp({ quality: 75 }).toFile(webpOut);
    await sharp(sourcePath).resize(w, null, { withoutEnlargement: false }).jpeg({ quality: 80 }).toFile(jpegOut);

    entry.avif[String(w)] = `assets/encyclopedia/${baseName}-${w}.avif`;
    entry.webp[String(w)] = `assets/encyclopedia/${baseName}-${w}.webp`;
    entry.jpeg[String(w)] = `assets/encyclopedia/${baseName}-${w}.jpg`;
  }

  console.log(`  ✓ ${baseName} (${intrinsic.width}x${intrinsic.height})`);
  return entry;
}

async function main() {
  console.log('Processing 25 new plant images...\n');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  let added = 0;

  for (const plant of newPlants) {
    const key = `encyclopedia/${plant.base}`;
    if (manifest[key]) {
      console.log(`  - ${plant.base} already exists, skipping`);
      continue;
    }
    const entry = await processImage(plant.base);
    if (entry) {
      manifest[key] = entry;
      added++;
    }
  }

  // Sort manifest keys alphabetically for consistency
  const sorted = {};
  Object.keys(manifest).sort().forEach(key => { sorted[key] = manifest[key]; });

  fs.writeFileSync(manifestPath, JSON.stringify(sorted, null, 2) + '\n');
  console.log(`\nDone! Added ${added} new entries to manifest.json`);

  // Now update plants.json image paths
  console.log('\nUpdating plants.json image paths...');
  const plants = JSON.parse(fs.readFileSync(plantsPath, 'utf-8'));

  const imageMappings = {
    'plant-peacock-calathea': 'assets/encyclopedia/plant-calathea',
    'plant-watermelon-peperomia': 'assets/encyclopedia/plant-peperomia',
    'plant-rubber-plant': 'assets/encyclopedia/plant-rubber',
    'plant-parlor-palm': 'assets/encyclopedia/plant-parlor-palm',
    'plant-hoya': 'assets/encyclopedia/plant-hoya',
    'plant-pachyphytum': 'assets/encyclopedia/plant-pachyphytum',
    'plant-bear-paw': 'assets/encyclopedia/plant-bear-paw',
    'plant-haworthia': 'assets/encyclopedia/plant-haworthia',
    'plant-golden-barrel': 'assets/encyclopedia/plant-golden-barrel',
    'plant-dragon-bone': 'assets/encyclopedia/plant-dragon-bone',
    'plant-turtle-back': 'assets/encyclopedia/plant-turtle-back',
    'plant-aloe': 'assets/encyclopedia/plant-aloe',
    'plant-lithops': 'assets/encyclopedia/plant-lithops',
    'plant-phalaenopsis': 'assets/encyclopedia/plant-phalaenopsis',
    'plant-dendrobium': 'assets/encyclopedia/plant-dendrobium',
    'plant-hyacinth': 'assets/encyclopedia/plant-hyacinth',
    'plant-jasmine': 'assets/encyclopedia/plant-jasmine',
    'plant-gardenia': 'assets/encyclopedia/plant-gardenia',
    'plant-areca-palm': 'assets/encyclopedia/plant-areca-palm',
    'plant-yucca': 'assets/encyclopedia/plant-yucca',
    'plant-water-lily': 'assets/encyclopedia/plant-water-lily',
    'plant-pennywort': 'assets/encyclopedia/plant-pennywort',
    'plant-tillandsia': 'assets/encyclopedia/plant-air-plant',
    'plant-sundew': 'assets/encyclopedia/plant-venus-flytrap',
    'plant-moss': 'assets/encyclopedia/plant-moss',
  };

  let updated = 0;
  for (const plant of plants) {
    if (imageMappings[plant.id]) {
      plant.image = imageMappings[plant.id];
      updated++;
      console.log(`  ✓ ${plant.id} → ${plant.image}`);
    }
  }

  fs.writeFileSync(plantsPath, JSON.stringify(plants, null, 2) + '\n');
  console.log(`\nDone! Updated ${updated} plant image paths in plants.json`);
}

main().catch(err => { console.error(err); process.exit(1); });
