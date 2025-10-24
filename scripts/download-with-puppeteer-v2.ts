import puppeteer from 'puppeteer';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import axios from 'axios';

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

    // Navigate to the page
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

    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if there's a download link
    const downloadLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const downloadLink = links.find(link =>
        link.href.includes('.pdf') ||
        link.textContent?.toLowerCase().includes('download')
      );
      return downloadLink?.href;
    });

    if (downloadLink) {
      console.log(`   📎 Found download link: ${downloadLink}`);

      // Get cookies from the page
      const cookies = await page.cookies();
      const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

      // Try downloading with axios using the same session
      try {
        console.log(`   📥 Downloading from link...`);
        const axiosResponse = await axios.get(downloadLink, {
          responseType: 'arraybuffer',
          headers: {
            'Cookie': cookieString,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Referer': url
          },
          timeout: 30000
        });

        const buffer = Buffer.from(axiosResponse.data);
        const isPDF = buffer.toString('utf8', 0, 4) === '%PDF';

        if (isPDF) {
          // Ensure output directory exists
          const dir = resolve(outputPath, '..');
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }

          writeFileSync(outputPath, buffer);
          const sizeKB = (buffer.length / 1024).toFixed(2);
          console.log(`✓ Downloaded ${sizeKB} KB via download link`);
          console.log(`✓ Saved to: ${outputPath}`);
          return true;
        }
      } catch (e) {
        console.log(`   ⚠️  Download link failed: ${e}`);
      }
    }

    // Strategy 2: Check if the page content is actually a PDF viewer
    const content = await response.text();
    if (content.includes('pdf') || content.includes('PDF')) {
      console.log(`   🔍 Page contains PDF references, trying direct fetch with session...`);

      // Get cookies
      const cookies = await page.cookies();
      const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

      try {
        const axiosResponse = await axios.get(url, {
          responseType: 'arraybuffer',
          headers: {
            'Cookie': cookieString,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/pdf,application/octet-stream,*/*'
          },
          timeout: 30000
        });

        const buffer = Buffer.from(axiosResponse.data);
        const isPDF = buffer.toString('utf8', 0, 4) === '%PDF';

        if (isPDF) {
          // Ensure output directory exists
          const dir = resolve(outputPath, '..');
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }

          writeFileSync(outputPath, buffer);
          const sizeKB = (buffer.length / 1024).toFixed(2);
          console.log(`✓ Downloaded ${sizeKB} KB via authenticated request`);
          console.log(`✓ Saved to: ${outputPath}`);
          return true;
        }
      } catch (e) {
        console.log(`   ⚠️  Direct fetch failed: ${e}`);
      }
    }

    console.log(`   ❌ Could not extract PDF from page`);
    return false;

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
  console.log('🤖 PUPPETEER PDF DOWNLOAD TEST V2');
  console.log('======================================================================\n');
  console.log(`URL: ${url}\n`);

  const success = await downloadPDFWithPuppeteer(url, outputPath);

  if (success) {
    console.log('\n✅ SUCCESS: PDF downloaded with Puppeteer!');
    console.log(`   Saved to: ${outputPath}`);

    // Show comparison
    console.log('\n📊 COMPARISON:');
    console.log('   Direct curl: ❌ 403 Forbidden');
    console.log('   Puppeteer V2: ✅ Success!');
  } else {
    console.log('\n❌ FAILED: Could not download PDF with Puppeteer V2');
    console.log('\n💡 This PDF appears to be heavily protected.');
    console.log('   The website may be using advanced anti-bot measures.');
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
