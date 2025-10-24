import puppeteer from 'puppeteer';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

async function downloadPDFWithPuppeteer(url: string, outputPath: string): Promise<boolean> {
  console.log(`🌐 Launching browser...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-extensions',
      '--disable-plugins'
    ]
  });

  try {
    const page = await browser.newPage();

    // Set user agent to appear as a real browser
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    console.log(`📥 Navigating to ${url}...`);

    // Set up response tracking to capture PDF
    let pdfBuffer: Buffer | null = null;
    let pdfUrl: string | null = null;

    page.on('response', async (response) => {
      const contentType = response.headers()['content-type'];
      const responseUrl = response.url();

      if (contentType && contentType.includes('application/pdf')) {
        console.log(`   📄 Found PDF response: ${responseUrl}`);
        try {
          const buffer = await response.buffer();
          // Verify it's actually a PDF by checking magic number
          if (buffer.toString('utf8', 0, 4) === '%PDF') {
            console.log(`   ✓ Verified valid PDF (${(buffer.length / 1024).toFixed(2)} KB)`);
            pdfBuffer = buffer;
            pdfUrl = responseUrl;
          } else {
            console.log(`   ⚠️  Response claims to be PDF but isn't - skipping`);
          }
        } catch (e) {
          console.log(`   ⚠️  Could not buffer PDF response`);
        }
      }
    });

    // Navigate and wait for the PDF to load
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    if (!response) {
      console.log(`❌ No response received`);
      return false;
    }

    const status = response.status();
    console.log(`   Status: ${status}`);

    if (status === 403 || status === 404) {
      console.log(`❌ Access denied or not found`);
      return false;
    }

    // Wait a bit more for embedded PDF to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Use intercepted PDF buffer if we got one
    let buffer: Buffer;
    if (pdfBuffer) {
      buffer = pdfBuffer;
      console.log(`   ✓ Using intercepted PDF from: ${pdfUrl}`);
    } else {
      // Fallback: try to get buffer from initial response
      console.log(`   ⚠️  No valid PDF intercepted, trying initial response...`);
      buffer = await response.buffer();
      const isPDF = buffer.toString('utf8', 0, 4) === '%PDF';
      if (!isPDF) {
        console.log(`   ❌ Initial response is not a valid PDF either`);
        return false;
      }
    }

    // Ensure output directory exists
    const dir = resolve(outputPath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Save to file
    writeFileSync(outputPath, buffer);

    const sizeKB = (buffer.length / 1024).toFixed(2);
    console.log(`✓ Downloaded ${sizeKB} KB`);
    console.log(`✓ Saved to: ${outputPath}`);

    return true;

  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function main() {
  const url = 'https://www.sustainabilityreport2023.plmj.com/docs/GRI23_EN.pdf';
  const outputPath = '/tmp/plmj-puppeteer/report.pdf';

  console.log('======================================================================');
  console.log('🤖 PUPPETEER PDF DOWNLOAD TEST');
  console.log('======================================================================\n');
  console.log(`URL: ${url}\n`);

  const success = await downloadPDFWithPuppeteer(url, outputPath);

  if (success) {
    console.log('\n✅ SUCCESS: PDF downloaded with Puppeteer!');
    console.log(`   Saved to: ${outputPath}`);

    // Show comparison
    console.log('\n📊 COMPARISON:');
    console.log('   Direct curl: ❌ 403 Forbidden');
    console.log('   Puppeteer: ✅ Success!');
  } else {
    console.log('\n❌ FAILED: Could not download PDF with Puppeteer');
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
