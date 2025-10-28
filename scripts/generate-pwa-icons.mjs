/**
 * Generate PWA Icons from SVG Favicon
 *
 * This script converts the SVG favicon to PNG icons for PWA
 * Requires: npm install sharp
 *
 * Usage: node scripts/generate-pwa-icons.mjs
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');
const faviconSvg = path.join(publicDir, 'favicon-black-white.svg');

// Icon sizes to generate
const sizes = [
  { size: 192, name: 'icon-192.png', monochrome: false },
  { size: 512, name: 'icon-512.png', monochrome: false },
  { size: 180, name: 'apple-touch-icon.png', monochrome: false }, // For iOS home screen
  { size: 96, name: 'badge-icon.png', monochrome: true } // For iOS badge (monochrome)
];

async function generateIcons() {
  console.log('🎨 Generating PWA icons from favicon-black-white.svg...\n');

  if (!fs.existsSync(faviconSvg)) {
    console.error('❌ favicon-black-white.svg not found in public directory');
    process.exit(1);
  }

  try {
    // Read SVG file
    const svgBuffer = fs.readFileSync(faviconSvg);

    // Generate each size
    for (const { size, name, monochrome } of sizes) {
      console.log(`   Generating ${name} (${size}x${size})${monochrome ? ' [monochrome]' : ''}...`);

      const outputPath = path.join(publicDir, name);

      let pipeline = sharp(svgBuffer).resize(size, size);

      // Apply monochrome processing for badge icons
      if (monochrome) {
        pipeline = pipeline
          .grayscale()
          .normalise(); // Increase contrast
      }

      await pipeline.png().toFile(outputPath);

      console.log(`   ✓ Created ${name}`);
    }

    console.log('\n✅ All PWA icons generated successfully!\n');
    console.log('📋 Generated files:');
    sizes.forEach(({ name }) => {
      console.log(`   - public/${name}`);
    });
    console.log('\n');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.error('\nMake sure sharp is installed:');
    console.error('   npm install sharp\n');
    process.exit(1);
  }
}

generateIcons();
