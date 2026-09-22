import fs from 'fs';
import path from 'path';

const pagesDir = path.resolve('src/pages');

// 12 new articles with their recommended plant IDs
const articlePlants = {
  'araceae-guide.html': 'plant-monstera,plant-pothos,plant-evergreen',
  'calathea-care.html': 'plant-peacock-calathea,plant-watermelon-peperomia,plant-snake',
  'succulent-summer.html': 'plant-pachyphytum,plant-bear-paw,plant-haworthia',
  'cactus-guide.html': 'plant-golden-barrel,plant-dragon-bone,plant-aloe',
  'phalaenopsis-care.html': 'plant-phalaenopsis,plant-dendrobium,plant-gardenia',
  'bulb-flower-guide.html': 'plant-hyacinth,plant-jasmine,plant-gardenia',
  'large-plant-guide.html': 'plant-fiddle,plant-rubber-plant,plant-areca-palm',
  'fiddle-leaf-fig-care.html': 'plant-fiddle,plant-rubber-plant,plant-bird-of-paradise',
  'hydroponic-guide.html': 'plant-pothos,plant-pennywort,plant-lucky-bamboo',
  'aquatic-plant-guide.html': 'plant-water-lily,plant-pennywort,plant-moss',
  'fern-care-guide.html': 'plant-fern,plant-moss,plant-tillandsia',
  'air-plant-guide.html': 'plant-tillandsia,plant-haworthia,plant-lithops',
};

let updated = 0;

for (const [filename, plantIds] of Object.entries(articlePlants)) {
  const filePath = path.join(pagesDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ! File not found: ${filename}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already has relatedPlants
  if (content.includes('relatedPlants:')) {
    console.log(`  - ${filename} already has relatedPlants, skipping`);
    continue;
  }

  const shortcode = `\n{{relatedPlants:${plantIds}}}\n`;

  // Insert before {{related: if it exists, otherwise before the end or after {{ad}}
  if (content.includes('{{related:')) {
    content = content.replace('{{related:', shortcode + '{{related:');
  } else if (content.includes('{{ad}}')) {
    content = content.replace('{{ad}}', '{{ad}}\n' + shortcode);
  } else {
    content = content.trimEnd() + '\n' + shortcode + '\n';
  }

  fs.writeFileSync(filePath, content);
  console.log(`  ✓ ${filename} → ${plantIds.split(',').length} plants`);
  updated++;
}

console.log(`\nDone! Updated ${updated} articles with plant recommendations`);
