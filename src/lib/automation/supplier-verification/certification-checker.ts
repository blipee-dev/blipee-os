/**
 * Supplier Sustainability Certification Checker
 * Verifies supplier sustainability claims and certifications
 * Supports: B Corp, ISO 14001, LEED, Carbon Neutral, etc.
 */

import { BaseScraper } from '../base-scraper';
import { ScraperResult, SupplierSustainabilityData } from '../types';

// Certification registries
const CERTIFICATION_URLS = {
  bCorp: 'https://www.bcorporation.net/en-us/find-a-b-corp',
  iso14001: 'https://committee.iso.org/sites/tc207/home/projects/published/iso-14001-environmental-managem.html',
  carbonNeutral: 'https://www.carbonneutral.com/certified-partners',
};

export class SupplierCertificationChecker extends BaseScraper<SupplierSustainabilityData> {
  private supplierName: string;
  private supplierWebsite: string;

  constructor(
    config: any,
    supplierName: string,
    supplierWebsite: string
  ) {
    super(config);
    this.supplierName = supplierName;
    this.supplierWebsite = supplierWebsite;
  }

  async scrape(): Promise<ScraperResult<SupplierSustainabilityData>> {
    try {
      await this.logActivity('supplier_verification_started', {
        supplier: this.supplierName,
      });

      const data: SupplierSustainabilityData = {
        supplierName: this.supplierName,
        website: this.supplierWebsite,
        certifications: [],
      };

      // Check various certifications
      data.certifications.push(...await this.checkBCorpCertification());
      data.certifications.push(...await this.checkISO14001());
      data.certifications.push(...await this.checkCarbonNeutral());

      // Scrape supplier's own sustainability page
      const supplierData = await this.scrapeSupplierWebsite();
      if (supplierData.sustainabilityReport) {
        data.sustainabilityReport = supplierData.sustainabilityReport;
      }
      if (supplierData.esgScore) {
        data.esgScore = supplierData.esgScore;
      }

      // Take screenshot for audit trail
      await this.takeScreenshot(`supplier_${this.sanitizeFilename(this.supplierName)}`);

      await this.logActivity('supplier_verification_completed', {
        supplier: this.supplierName,
        certificationsFound: data.certifications.length,
      });

      const result: ScraperResult<SupplierSustainabilityData> = {
        success: true,
        data,
        timestamp: new Date(),
        source: 'supplier-verification',
      };

      await this.saveResult(result);
      return result;
    } catch (error) {
      const errorResult: ScraperResult<SupplierSustainabilityData> = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        source: 'supplier-verification',
      };

      await this.logActivity('supplier_verification_failed', {
        supplier: this.supplierName,
        error: errorResult.error,
      });

      return errorResult;
    }
  }

  /**
   * Check if supplier is a certified B Corporation
   */
  private async checkBCorpCertification(): Promise<SupplierSustainabilityData['certifications']> {
    try {
      await this.navigateToUrl(CERTIFICATION_URLS.bCorp);
      await this.waitForElement('input[name="search"]', 5000);

      // Search for supplier
      await this.fillField('input[name="search"]', this.supplierName);
      await this.clickElement('button[type="submit"]');
      await this.sleep(2000);

      const isCertified = await this.executeScript(`
        const results = document.querySelectorAll('.company-card');
        return results.length > 0;
      `);

      if (isCertified) {
        const proofUrl = await this.takeScreenshot(`bcorp_${this.sanitizeFilename(this.supplierName)}`);

        return [{
          type: 'b-corp',
          verified: true,
          proofUrl,
        }];
      }
    } catch (error) {
      console.error('[SupplierChecker] B Corp check failed:', error);
    }

    return [];
  }

  /**
   * Check ISO 14001 certification
   */
  private async checkISO14001(): Promise<SupplierSustainabilityData['certifications']> {
    // ISO 14001 verification would typically require:
    // 1. Accessing certification body databases (BSI, TÜV, etc.)
    // 2. Or checking supplier's website for certificate
    // This is a simplified version

    try {
      await this.navigateToUrl(this.supplierWebsite);
      await this.waitForElement('body', 5000);

      // Look for ISO 14001 mentions on supplier site
      const hasISO = await this.executeScript(`
        const bodyText = document.body.textContent.toLowerCase();
        return bodyText.includes('iso 14001') || bodyText.includes('iso14001');
      `);

      if (hasISO) {
        const proofUrl = await this.takeScreenshot(`iso14001_${this.sanitizeFilename(this.supplierName)}`);

        return [{
          type: 'iso-14001',
          verified: true,
          proofUrl,
        }];
      }
    } catch (error) {
      console.error('[SupplierChecker] ISO 14001 check failed:', error);
    }

    return [];
  }

  /**
   * Check Carbon Neutral certification
   */
  private async checkCarbonNeutral(): Promise<SupplierSustainabilityData['certifications']> {
    try {
      await this.navigateToUrl(CERTIFICATION_URLS.carbonNeutral);
      await this.waitForElement('.partners-list', 5000);

      const isCertified = await this.executeScript(`
        const partnersList = document.querySelector('.partners-list');
        const text = partnersList?.textContent?.toLowerCase() || '';
        return text.includes('${this.supplierName.toLowerCase()}');
      `);

      if (isCertified) {
        const proofUrl = await this.takeScreenshot(`carbon_neutral_${this.sanitizeFilename(this.supplierName)}`);

        return [{
          type: 'carbon-neutral',
          verified: true,
          proofUrl,
        }];
      }
    } catch (error) {
      console.error('[SupplierChecker] Carbon Neutral check failed:', error);
    }

    return [];
  }

  /**
   * Scrape supplier's own website for sustainability information
   */
  private async scrapeSupplierWebsite(): Promise<Partial<SupplierSustainabilityData>> {
    try {
      // Common sustainability page paths
      const sustainabilityPaths = [
        '/sustainability',
        '/esg',
        '/corporate-responsibility',
        '/environmental',
        '/about/sustainability',
      ];

      for (const path of sustainabilityPaths) {
        try {
          const url = this.supplierWebsite + path;
          await this.navigateToUrl(url);
          await this.sleep(2000);

          // Extract sustainability report links
          const reportData = await this.executeScript(`
            const links = [];
            document.querySelectorAll('a[href*="report"], a[href*="sustainability"]').forEach(link => {
              const href = link.href;
              const text = link.textContent;
              if (href.includes('.pdf') || text.includes('report')) {
                links.push({ url: href, text });
              }
            });
            return links;
          `);

          if (reportData && reportData.length > 0) {
            // Parse year from report link/text
            const yearMatch = reportData[0].text.match(/20\d{2}/);
            const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

            return {
              sustainabilityReport: {
                year,
                url: reportData[0].url,
                scope1: 0, // Would need to parse PDF
                scope2: 0,
                scope3: 0,
              },
            };
          }
        } catch (error) {
          // Try next path
          continue;
        }
      }
    } catch (error) {
      console.error('[SupplierChecker] Website scraping failed:', error);
    }

    return {};
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  protected getJobType(): string {
    return 'supplier-verification';
  }
}

/**
 * Convenience function to verify supplier sustainability
 */
export async function verifySupplierSustainability(
  organizationId: string,
  userId: string,
  supplierName: string,
  supplierWebsite: string
): Promise<ScraperResult<SupplierSustainabilityData>> {
  const checker = new SupplierCertificationChecker(
    { organizationId, userId },
    supplierName,
    supplierWebsite
  );

  return await checker.scrape();
}
