import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { DocumentParser } from '../document-parser';
import { OCRService } from '../ocr-service';
import { AIService } from '@/lib/ai/service';

jest.mock('../ocr-service');
jest.mock('@/lib/ai/service');

describe('Document Parser - Complete Tests', () => {
  let parser: DocumentParser;
  let mockOCR: jest.Mocked<OCRService>;
  let mockAI: jest.Mocked<AIService>;

  beforeEach(() => {
    parser = new DocumentParser();
    mockOCR = new OCRService() as jest.Mocked<OCRService>;
    mockAI = new AIService() as jest.Mocked<AIService>;
  });

  describe('PDF Parsing', () => {
    it('should extract emissions data from utility bills', async () => {
      const pdfBuffer = Buffer.from('mock pdf');
      
      mockOCR.extractText.mockResolvedValue({
        text: 'Electricity Usage: 5,000 kWh\nNatural Gas: 200 therms\nTotal: $850.00',
        confidence: 0.95
      });

      mockAI.extractStructuredData.mockResolvedValue({
        electricity: { value: 5000, unit: 'kWh' },
        gas: { value: 200, unit: 'therms' },
        cost: 850,
        emissions: 2.5 // tons CO2
      });

      const result = await parser.parseUtilityBill(pdfBuffer);

      expect(result.electricity).toBe(5000);
      expect(result.gas).toBe(200);
      expect(result.emissions).toBe(2.5);
      expect(result.documentType).toBe('utility_bill');
    });

    it('should parse sustainability reports', async () => {
      const reportPDF = Buffer.from('sustainability report');

      mockAI.extractStructuredData.mockResolvedValue({
        scope1: 1000,
        scope2: 2000,
        scope3: 5000,
        targets: [
          { year: 2030, reduction: 50 },
          { year: 2050, reduction: 100 }
        ],
        initiatives: ['Solar installation', 'Fleet electrification']
      });

      const result = await parser.parseSustainabilityReport(reportPDF);

      expect(result.totalEmissions).toBe(8000);
      expect(result.targets).toHaveLength(2);
      expect(result.initiatives).toContain('Solar installation');
    });
  });

  describe('Image Processing', () => {
    it('should extract data from receipt images', async () => {
      const imageBuffer = Buffer.from('receipt image');

      mockOCR.extractFromImage.mockResolvedValue({
        text: 'UBER\nTrip: Airport to Office\nDistance: 25 miles\nTotal: $45.00',
        regions: [{ text: 'UBER', confidence: 0.98 }]
      });

      const result = await parser.parseTransportReceipt(imageBuffer);

      expect(result.type).toBe('rideshare');
      expect(result.distance).toBe(25);
      expect(result.emissions).toBeGreaterThan(0);
    });

    it('should handle handwritten notes', async () => {
      mockOCR.extractHandwriting.mockResolvedValue({
        text: 'Meeting notes: Reduce energy by 20%',
        confidence: 0.7
      });

      const result = await parser.parseHandwrittenNote(Buffer.from('image'));

      expect(result.extracted).toContain('Reduce energy by 20%');
      expect(result.confidence).toBe(0.7);
    });
  });

  describe('Spreadsheet Processing', () => {
    it('should parse Excel emissions data', async () => {
      const excelData = {
        sheets: [{
          name: 'Emissions',
          data: [
            ['Month', 'Electricity (kWh)', 'Gas (therms)', 'Emissions (tCO2)'],
            ['Jan', 5000, 200, 2.5],
            ['Feb', 4800, 180, 2.3]
          ]
        }]
      };

      const result = await parser.parseExcel(excelData);

      expect(result.months).toHaveLength(2);
      expect(result.totals.electricity).toBe(9800);
      expect(result.totals.emissions).toBe(4.8);
    });

    it('should validate data quality', async () => {
      const invalidData = {
        sheets: [{
          data: [
            ['Month', 'Usage'],
            ['Jan', 'invalid'],
            ['Feb', -100] // Negative value
          ]
        }]
      };

      const result = await parser.parseExcel(invalidData);

      expect(result.errors).toContainEqual(
        expect.objectContaining({
          row: 2,
          issue: 'Invalid number format'
        })
      );
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          row: 3,
          issue: 'Negative value'
        })
      );
    });
  });

  describe('Multi-Document Correlation', () => {
    it('should correlate data across multiple documents', async () => {
      const documents = [
        { type: 'utility_bill', month: 'Jan', electricity: 5000 },
        { type: 'receipt', month: 'Jan', travel: 500 },
        { type: 'invoice', month: 'Jan', supplies: 1000 }
      ];

      const correlated = await parser.correlateDocuments(documents);

      expect(correlated.january.total_emissions).toBe(
        expect.any(Number)
      );
      expect(correlated.january.breakdown).toHaveProperty('electricity');
      expect(correlated.january.breakdown).toHaveProperty('travel');
    });
  });
});