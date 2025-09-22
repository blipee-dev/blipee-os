import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export type ExportFormat = 'png' | 'svg' | 'pdf' | 'excel' | 'csv' | 'json' | 'html';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  quality?: number;
  orientation?: 'portrait' | 'landscape';
  size?: 'a4' | 'letter' | 'legal';
  includeMetadata?: boolean;
  dateRange?: { start: Date; end: Date };
}

export class ExportService {
  /**
   * Export dashboard or chart to specified format
   */
  static async export(
    element: HTMLElement | null,
    data: any,
    options: ExportOptions
  ): Promise<void> {
    if (!element && !data) {
      throw new Error('Either element or data must be provided for export');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `export-${timestamp}`;
    const filename = options.filename || defaultFilename;

    switch (options.format) {
      case 'png':
        await this.exportPNG(element!, filename, options.quality);
        break;
      case 'svg':
        await this.exportSVG(element!, filename);
        break;
      case 'pdf':
        await this.exportPDF(element!, filename, options);
        break;
      case 'excel':
        await this.exportExcel(data, filename, options);
        break;
      case 'csv':
        await this.exportCSV(data, filename);
        break;
      case 'json':
        await this.exportJSON(data, filename, options);
        break;
      case 'html':
        await this.exportHTML(element!, filename, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export as PNG image
   */
  private static async exportPNG(
    element: HTMLElement,
    filename: string,
    quality: number = 1.0
  ): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
        },
        'image/png',
        quality
      );
    } catch (error) {
      console.error('Error exporting PNG:', error);
      throw error;
    }
  }

  /**
   * Export as SVG
   */
  private static async exportSVG(element: HTMLElement, filename: string): Promise<void> {
    try {
      // Find SVG elements within the container
      const svgElements = element.querySelectorAll('svg');

      if (svgElements.length === 0) {
        throw new Error('No SVG elements found to export');
      }

      // If multiple SVGs, combine them
      let combinedSVG = '<svg xmlns="http://www.w3.org/2000/svg">';
      let yOffset = 0;

      svgElements.forEach((svg) => {
        const svgString = new XMLSerializer().serializeToString(svg);
        const height = svg.getBoundingClientRect().height;

        combinedSVG += `<g transform="translate(0, ${yOffset})">${svgString}</g>`;
        yOffset += height + 20; // Add spacing
      });

      combinedSVG += '</svg>';

      const blob = new Blob([combinedSVG], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting SVG:', error);
      throw error;
    }
  }

  /**
   * Export as PDF document
   */
  private static async exportPDF(
    element: HTMLElement,
    filename: string,
    options: ExportOptions
  ): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const orientation = options.orientation || 'landscape';
      const format = options.size || 'a4';

      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10; // Top margin

      // Add header if metadata included
      if (options.includeMetadata) {
        pdf.setFontSize(20);
        pdf.text('Sustainability Dashboard Export', pageWidth / 2, 15, { align: 'center' });

        pdf.setFontSize(10);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 22, { align: 'center' });

        if (options.dateRange) {
          pdf.text(
            `Date Range: ${options.dateRange.start.toLocaleDateString()} - ${options.dateRange.end.toLocaleDateString()}`,
            pageWidth / 2,
            28,
            { align: 'center' }
          );
        }

        position = 35;
      }

      // Add image
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - position - 10; // Account for bottom margin

      // Add additional pages if needed
      while (heightLeft > 0) {
        pdf.addPage();
        position = -pageHeight + 10;
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20; // Account for margins
      }

      // Add footer on each page
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }

      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  }

  /**
   * Export data as Excel spreadsheet
   */
  private static async exportExcel(
    data: any,
    filename: string,
    options: ExportOptions
  ): Promise<void> {
    try {
      const workbook = XLSX.utils.book_new();

      // Convert data to worksheets
      if (Array.isArray(data)) {
        // Single sheet with array data
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      } else if (typeof data === 'object') {
        // Multiple sheets for different data sections
        Object.keys(data).forEach((key) => {
          if (Array.isArray(data[key])) {
            const worksheet = XLSX.utils.json_to_sheet(data[key]);
            XLSX.utils.book_append_sheet(workbook, worksheet, key);
          }
        });
      }

      // Add metadata sheet if requested
      if (options.includeMetadata) {
        const metadata = {
          exportDate: new Date().toISOString(),
          dateRange: options.dateRange ? {
            start: options.dateRange.start.toISOString(),
            end: options.dateRange.end.toISOString()
          } : null,
          format: 'Excel',
          version: '1.0'
        };

        const metadataSheet = XLSX.utils.json_to_sheet([metadata]);
        XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
      }

      // Generate and download file
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      throw error;
    }
  }

  /**
   * Export data as CSV
   */
  private static async exportCSV(data: any[], filename: string): Promise<void> {
    try {
      if (!Array.isArray(data)) {
        throw new Error('CSV export requires array data');
      }

      // Convert to CSV string
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header];
            // Escape values containing commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    }
  }

  /**
   * Export data as JSON
   */
  private static async exportJSON(
    data: any,
    filename: string,
    options: ExportOptions
  ): Promise<void> {
    try {
      const exportData = options.includeMetadata ? {
        metadata: {
          exportDate: new Date().toISOString(),
          dateRange: options.dateRange,
          format: 'JSON',
          version: '1.0'
        },
        data
      } : data;

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting JSON:', error);
      throw error;
    }
  }

  /**
   * Export as HTML document
   */
  private static async exportHTML(
    element: HTMLElement,
    filename: string,
    options: ExportOptions
  ): Promise<void> {
    try {
      // Clone the element to avoid modifying the original
      const clonedElement = element.cloneNode(true) as HTMLElement;

      // Create HTML document structure
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }
        .header h1 {
            color: #1f2937;
            margin: 0 0 10px 0;
        }
        .header p {
            color: #6b7280;
            margin: 0;
        }
        .content {
            ${this.extractStyles(element)}
        }
        @media print {
            body {
                background: white;
            }
            .container {
                box-shadow: none;
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        ${options.includeMetadata ? `
        <div class="header">
            <h1>Sustainability Dashboard Export</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            ${options.dateRange ? `
            <p>Date Range: ${options.dateRange.start.toLocaleDateString()} - ${options.dateRange.end.toLocaleDateString()}</p>
            ` : ''}
        </div>
        ` : ''}
        <div class="content">
            ${clonedElement.innerHTML}
        </div>
    </div>
</body>
</html>`;

      // Create and download file
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.html`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting HTML:', error);
      throw error;
    }
  }

  /**
   * Extract inline styles from element
   */
  private static extractStyles(element: HTMLElement): string {
    const computedStyle = window.getComputedStyle(element);
    const importantProps = [
      'display', 'position', 'width', 'height',
      'margin', 'padding', 'border', 'background',
      'color', 'font-size', 'font-family'
    ];

    return importantProps
      .map(prop => `${prop}: ${computedStyle.getPropertyValue(prop)};`)
      .join('\n            ');
  }

  /**
   * Batch export multiple formats
   */
  static async batchExport(
    element: HTMLElement,
    data: any,
    formats: ExportFormat[],
    baseFilename?: string
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = baseFilename || `batch-export-${timestamp}`;

    for (const format of formats) {
      try {
        await this.export(element, data, {
          format,
          filename: `${filename}`,
          includeMetadata: true
        });

        // Add delay between exports to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to export ${format}:`, error);
      }
    }
  }
}

export default ExportService;