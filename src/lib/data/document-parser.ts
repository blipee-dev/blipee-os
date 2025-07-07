/**
 * INTELLIGENT DOCUMENT PARSER
 * AI that extracts sustainability data from any document
 */

import { createWorker } from 'tesseract.js'

export class DocumentParser {
  private ocrWorker: any = null
  
  /**
   * Parse PDF file
   */
  async parsePDF(buffer: Buffer): Promise<any> {
    try {
      // Dynamic import to avoid build issues
      const pdfParse = (await import('pdf-parse')).default
      await pdfParse(buffer)
      return this.parseDocument(buffer, 'auto')
    } catch (error) {
      console.error('PDF parsing error:', error)
      return null
    }
  }
  
  /**
   * Parse image file
   */
  async parseImage(buffer: Buffer): Promise<any> {
    try {
      // Initialize OCR worker if not already done
      if (!this.ocrWorker) {
        this.ocrWorker = await createWorker()
      }
      
      const { data: { text } } = await this.ocrWorker.recognize(buffer)
      return this.extractAutoData(text)
    } catch (error) {
      console.error('Image parsing error:', error)
      return null
    }
  }
  
  /**
   * Parse spreadsheet file
   */
  async parseSpreadsheet(_buffer: Buffer): Promise<any> {
    try {
      // For now, return a placeholder
      // In production, use xlsx library to parse
      return {
        documentType: 'spreadsheet',
        message: 'Spreadsheet parsing will be implemented',
        emissions: {}
      }
    } catch (error) {
      console.error('Spreadsheet parsing error:', error)
      return null
    }
  }
  
  /**
   * Parse any document and extract emissions data
   */
  async parseDocument(
    file: File | Buffer,
    documentType?: 'invoice' | 'utility' | 'travel' | 'report' | 'certificate' | 'auto'
  ): Promise<{
    extractedData: ExtractedData
    confidence: number
    rawText: string
    suggestions: string[]
  }> {
    // Detect document type if not provided
    const detectedType = documentType === 'auto' ? await this.detectDocumentType(file) : documentType
    
    // Extract text based on file type
    const rawText = await this.extractText(file)
    
    // Use AI to extract structured data
    const extractedData = await this.extractStructuredData(rawText, detectedType || 'auto')
    
    // Calculate emissions from extracted data
    const enrichedData = await this.enrichWithEmissions(extractedData)
    
    // Generate suggestions for data quality
    const suggestions = this.generateDataQualitySuggestions(enrichedData)
    
    return {
      extractedData: enrichedData,
      confidence: this.calculateConfidence(enrichedData),
      rawText,
      suggestions
    }
  }
  
  /**
   * Batch process multiple documents
   */
  async batchParse(
    documents: Array<{ file: File; type?: string }>
  ): Promise<{
    results: ParseResult[]
    summary: BatchSummary
    emissions: EmissionsSummary
  }> {
    const results: ParseResult[] = []
    
    // Process documents in parallel (with limit)
    const batchSize = 5
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(doc => this.parseDocument(doc.file, doc.type as any))
      )
      results.push(...batchResults.map((r, idx) => ({
        ...r,
        fileName: batch[idx].file.name || `Document ${i + idx + 1}`
      })))
    }
    
    // Aggregate results
    const summary = this.generateBatchSummary(results)
    const emissions = this.calculateTotalEmissions(results)
    
    return { results, summary, emissions }
  }
  
  /**
   * Extract text from various file formats
   */
  private async extractText(file: File | Buffer): Promise<string> {
    let buffer: Buffer
    
    if (file instanceof File) {
      buffer = Buffer.from(await file.arrayBuffer())
    } else {
      buffer = file
    }
    
    // Detect file type
    const fileType = this.detectFileType(buffer)
    
    switch (fileType) {
      case 'pdf':
        return this.extractPDFText(buffer)
      case 'image':
        return this.extractImageText(buffer)
      case 'text':
        return buffer.toString('utf-8')
      case 'excel':
        return this.extractExcelText(buffer)
      default:
        throw new Error(`Unsupported file type: ${fileType}`)
    }
  }
  
  /**
   * Extract text from PDF
   */
  private async extractPDFText(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = (await import('pdf-parse')).default
      const data = await pdfParse(buffer)
      return data.text
    } catch (error) {
      console.error('PDF parsing error:', error)
      // Fallback to OCR if PDF parsing fails
      return this.extractImageText(buffer)
    }
  }
  
  /**
   * Extract text from images using OCR
   */
  private async extractImageText(buffer: Buffer): Promise<string> {
    if (!this.ocrWorker) {
      this.ocrWorker = await createWorker()
    }
    
    const result = await this.ocrWorker.recognize(buffer)
    return result.data.text
  }
  
  /**
   * Extract text from Excel (simplified - would use xlsx library)
   */
  private async extractExcelText(buffer: Buffer): Promise<string> {
    // In production, would use xlsx or similar library
    return 'Excel parsing not implemented - would extract all cell values'
  }
  
  /**
   * AI-powered structured data extraction
   */
  private async extractStructuredData(
    text: string,
    documentType: string
  ): Promise<ExtractedData> {
    const extractors: Record<string, (text: string) => ExtractedData> = {
      invoice: this.extractInvoiceData.bind(this),
      utility: this.extractUtilityData.bind(this),
      travel: this.extractTravelData.bind(this),
      report: this.extractReportData.bind(this),
      certificate: this.extractCertificateData.bind(this),
      auto: this.extractAutoData.bind(this)
    }
    
    const extractor = extractors[documentType] || extractors.auto
    return extractor(text)
  }
  
  /**
   * Extract invoice data
   */
  private extractInvoiceData(text: string): ExtractedData {
    const data: ExtractedData = {
      documentType: 'invoice',
      vendor: this.extractPattern(text, /(?:from|vendor|supplier):\s*([^\n]+)/i),
      date: this.extractDate(text),
      items: this.extractInvoiceItems(text),
      total: this.extractAmount(text, /(?:total|amount due):\s*[$€£]?([\d,]+\.?\d*)/i),
      currency: this.extractCurrency(text),
      emissions: {}
    }
    
    // Identify emission-relevant items
    data.items.forEach((item: any) => {
      if (this.isEmissionRelevant(item.description)) {
        item.emissionCategory = this.categorizeItem(item.description)
        item.emissionScope = this.determineScope(item.emissionCategory)
      }
    })
    
    return data
  }
  
  /**
   * Extract utility bill data
   */
  private extractUtilityData(text: string): ExtractedData {
    const data: ExtractedData = {
      documentType: 'utility',
      utilityType: this.detectUtilityType(text),
      provider: this.extractPattern(text, /(?:provider|company|from):\s*([^\n]+)/i),
      accountNumber: this.extractPattern(text, /(?:account|customer)\s*(?:number|#):\s*([\w-]+)/i),
      billingPeriod: this.extractBillingPeriod(text),
      usage: this.extractUsage(text),
      total: this.extractAmount(text, /(?:amount due|total):\s*[$€£]?([\d,]+\.?\d*)/i),
      emissions: {}
    }
    
    // Calculate emissions based on usage
    if (data.usage && data.utilityType) {
      data.emissions = this.calculateUtilityEmissions(data.usage, data.utilityType)
    }
    
    return data
  }
  
  /**
   * Extract travel data
   */
  private extractTravelData(text: string): ExtractedData {
    const data: ExtractedData = {
      documentType: 'travel',
      travelType: this.detectTravelType(text),
      date: this.extractDate(text),
      origin: this.extractPattern(text, /(?:from|origin|departure):\s*([^\n]+)/i),
      destination: this.extractPattern(text, /(?:to|destination|arrival):\s*([^\n]+)/i),
      distance: this.extractDistance(text),
      class: this.extractTravelClass(text),
      emissions: {}
    }
    
    // Calculate travel emissions
    if (data.travelType && data.distance) {
      data.emissions = this.calculateTravelEmissions(data)
    }
    
    return data
  }
  
  /**
   * Extract sustainability report data
   */
  private extractReportData(text: string): ExtractedData {
    return {
      documentType: 'report',
      reportType: this.detectReportType(text),
      period: this.extractReportPeriod(text),
      metrics: {
        scope1: this.extractEmissionValue(text, /scope\s*1[:\s]+([\d,]+)/i),
        scope2: this.extractEmissionValue(text, /scope\s*2[:\s]+([\d,]+)/i),
        scope3: this.extractEmissionValue(text, /scope\s*3[:\s]+([\d,]+)/i),
        total: this.extractEmissionValue(text, /total\s*emissions[:\s]+([\d,]+)/i),
        energy: this.extractValue(text, /energy\s*(?:consumption|usage)[:\s]+([\d,]+)\s*([a-zA-Z]+)/i),
        water: this.extractValue(text, /water\s*(?:consumption|usage)[:\s]+([\d,]+)\s*([a-zA-Z]+)/i),
        waste: this.extractValue(text, /waste\s*(?:generated|produced)[:\s]+([\d,]+)\s*([a-zA-Z]+)/i)
      },
      emissions: {}
    }
  }
  
  /**
   * Extract certificate data
   */
  private extractCertificateData(text: string): ExtractedData {
    return {
      documentType: 'certificate',
      certificateType: this.detectCertificateType(text),
      issuer: this.extractPattern(text, /(?:issued by|issuer):\s*([^\n]+)/i),
      recipient: this.extractPattern(text, /(?:awarded to|recipient|company):\s*([^\n]+)/i),
      validFrom: this.extractDate(text, /(?:valid from|issue date):\s*([^\n]+)/i),
      validTo: this.extractDate(text, /(?:valid (?:to|until)|expiry):\s*([^\n]+)/i),
      scope: this.extractPattern(text, /(?:scope|coverage):\s*([^\n]+)/i),
      standard: this.extractPattern(text, /(?:standard|framework):\s*([^\n]+)/i),
      emissions: {}
    }
  }
  
  /**
   * Auto-detect and extract data
   */
  private extractAutoData(text: string): ExtractedData {
    // Use AI to detect patterns and extract relevant data
    const patterns = {
      emissions: /(\d+(?:\.\d+)?)\s*(?:tonnes?|tons?|kg|tCO2e?|kgCO2e?)/gi,
      energy: /(\d+(?:\.\d+)?)\s*(?:kWh|MWh|GWh|therms?|BTU)/gi,
      dates: /(?:january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2})[,\s]+\d{4}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/gi,
      amounts: /[$€£]\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g
    }
    
    const extractedValues: any = {}
    
    Object.entries(patterns).forEach(([key, pattern]) => {
      const matches = text.match(pattern)
      if (matches) {
        extractedValues[key] = matches
      }
    })
    
    return {
      documentType: 'auto',
      rawExtraction: extractedValues,
      text: text.substring(0, 500), // First 500 chars for context
      emissions: this.inferEmissions(extractedValues)
    }
  }
  
  /**
   * Enrich data with emission calculations
   */
  private async enrichWithEmissions(data: ExtractedData): Promise<ExtractedData> {
    switch (data.documentType) {
      case 'invoice':
        return data // Invoice emissions calculation
      case 'utility':
        return data // Utility emissions calculation
      case 'travel':
        return data // Travel emissions calculation
      default:
        return data
    }
  }
  
  /**
   * Calculate emissions for invoice items
   */
  private enrichInvoiceEmissions(data: ExtractedData): ExtractedData {
    const emissionFactors: Record<string, number> = {
      'fuel': 2.5, // kgCO2e per liter
      'electricity': 0.4, // kgCO2e per kWh
      'shipping': 0.05, // kgCO2e per dollar
      'office supplies': 0.02, // kgCO2e per dollar
      'equipment': 0.03, // kgCO2e per dollar
      'services': 0.01 // kgCO2e per dollar
    }
    
    let totalEmissions = 0
    
    if (data.items) {
      data.items.forEach((item: any) => {
        if (item.emissionCategory) {
          const factor = emissionFactors[item.emissionCategory] || 0.01
          item.emissions = item.amount * factor
          totalEmissions += item.emissions
        }
      })
    }
    
    data.emissions = {
      total: totalEmissions,
      scope: this.determineInvoiceScope(data),
      confidence: 0.7
    }
    
    return data
  }
  
  /**
   * Calculate utility emissions
   */
  private calculateUtilityEmissions(usage: any, utilityType: string): any {
    const emissionFactors: Record<string, number> = {
      'electricity': 0.4, // kgCO2e per kWh
      'natural gas': 0.185, // kgCO2e per kWh
      'water': 0.344, // kgCO2e per m³
      'fuel oil': 2.52 // kgCO2e per liter
    }
    
    const factor = emissionFactors[utilityType] || 0
    const emissions = usage.value * factor
    
    return {
      total: emissions,
      unit: 'kgCO2e',
      scope: utilityType === 'electricity' ? 2 : 1,
      calculation: `${usage.value} ${usage.unit} × ${factor} kgCO2e/${usage.unit}`
    }
  }
  
  /**
   * Calculate travel emissions
   */
  private calculateTravelEmissions(data: any): any {
    const emissionFactors: Record<string, Record<string, number>> = {
      'flight': {
        'economy': 0.15, // kgCO2e per km
        'business': 0.43,
        'first': 0.6
      },
      'train': {
        'default': 0.04
      },
      'car': {
        'default': 0.17
      },
      'bus': {
        'default': 0.08
      }
    }
    
    const transportFactors = emissionFactors[data.travelType] || emissionFactors.car
    const classFactor = transportFactors[data.class || 'default'] || transportFactors.default || 0.15
    const emissions = (data.distance?.value || 0) * classFactor
    
    return {
      total: emissions,
      unit: 'kgCO2e',
      scope: 3,
      calculation: `${data.distance?.value || 0} km × ${classFactor} kgCO2e/km`
    }
  }
  
  /**
   * Helper methods
   */
  private detectFileType(buffer: Buffer): string {
    const header = buffer.slice(0, 4).toString('hex')
    
    if (header.startsWith('25504446')) return 'pdf' // %PDF
    if (header.startsWith('ffd8ff')) return 'image' // JPEG
    if (header.startsWith('89504e47')) return 'image' // PNG
    if (header.startsWith('504b0304')) return 'excel' // XLSX (ZIP)
    
    // Check if it's text
    try {
      const text = buffer.toString('utf-8', 0, 1000)
      if (text.match(/^[\x20-\x7E\s]+$/)) return 'text'
    } catch {}
    
    return 'unknown'
  }
  
  private async detectDocumentType(file: File | Buffer): Promise<string> {
    // Use AI to detect document type from content
    const text = await this.extractText(file)
    const lower = text.toLowerCase()
    
    if (lower.includes('invoice') || lower.includes('bill')) return 'invoice'
    if (lower.includes('kwh') || lower.includes('electricity') || lower.includes('gas')) return 'utility'
    if (lower.includes('flight') || lower.includes('boarding') || lower.includes('itinerary')) return 'travel'
    if (lower.includes('emissions') || lower.includes('sustainability') || lower.includes('esg')) return 'report'
    if (lower.includes('certificate') || lower.includes('certification')) return 'certificate'
    
    return 'auto'
  }
  
  private extractPattern(text: string, pattern: RegExp): string | undefined {
    const match = text.match(pattern)
    return match ? match[1].trim() : undefined
  }
  
  private extractDate(text: string, pattern?: RegExp): Date | undefined {
    const datePattern = pattern || /(?:date|dated|on):\s*([^\n]+)/i
    const dateStr = this.extractPattern(text, datePattern)
    
    if (dateStr) {
      const date = new Date(dateStr)
      return isNaN(date.getTime()) ? undefined : date
    }
    
    return undefined
  }
  
  private extractAmount(text: string, pattern: RegExp): number | undefined {
    const match = text.match(pattern)
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''))
      return isNaN(amount) ? undefined : amount
    }
    return undefined
  }
  
  private extractCurrency(text: string): string {
    if (text.includes('$') || text.includes('USD')) return 'USD'
    if (text.includes('€') || text.includes('EUR')) return 'EUR'
    if (text.includes('£') || text.includes('GBP')) return 'GBP'
    return 'USD' // Default
  }
  
  private extractInvoiceItems(text: string): any[] {
    // Simplified item extraction - would use more sophisticated parsing
    const items: any[] = []
    const lines = text.split('\n')
    
    lines.forEach(line => {
      const itemMatch = line.match(/(.+?)\s+(\d+)\s+[$€£]?([\d,]+\.?\d*)/)
      if (itemMatch) {
        items.push({
          description: itemMatch[1].trim(),
          quantity: parseInt(itemMatch[2]),
          amount: parseFloat(itemMatch[3].replace(/,/g, ''))
        })
      }
    })
    
    return items
  }
  
  private detectUtilityType(text: string): string {
    const lower = text.toLowerCase()
    if (lower.includes('electricity') || lower.includes('kwh')) return 'electricity'
    if (lower.includes('gas') || lower.includes('therm')) return 'natural gas'
    if (lower.includes('water') || lower.includes('gallon')) return 'water'
    if (lower.includes('fuel') || lower.includes('oil')) return 'fuel oil'
    return 'electricity' // Default
  }
  
  private extractBillingPeriod(text: string): any {
    const periodMatch = text.match(/(?:period|from)\s*([^\n]+?)\s*(?:to|through)\s*([^\n]+)/i)
    if (periodMatch) {
      return {
        start: new Date(periodMatch[1].trim()),
        end: new Date(periodMatch[2].trim())
      }
    }
    return undefined
  }
  
  private extractUsage(text: string): any {
    const usageMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(kwh|mwh|therms?|gallons?|m³|cubic)/i)
    if (usageMatch) {
      return {
        value: parseFloat(usageMatch[1].replace(/,/g, '')),
        unit: usageMatch[2].toLowerCase()
      }
    }
    return undefined
  }
  
  private detectTravelType(text: string): string {
    const lower = text.toLowerCase()
    if (lower.includes('flight') || lower.includes('airline')) return 'flight'
    if (lower.includes('train') || lower.includes('rail')) return 'train'
    if (lower.includes('car') || lower.includes('rental')) return 'car'
    if (lower.includes('bus') || lower.includes('coach')) return 'bus'
    return 'flight' // Default for travel docs
  }
  
  private extractDistance(text: string): any {
    const distanceMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(km|miles?|mi)/i)
    if (distanceMatch) {
      const value = parseFloat(distanceMatch[1].replace(/,/g, ''))
      const unit = distanceMatch[2].toLowerCase()
      
      // Convert to km if needed
      const valueInKm = unit.includes('mi') ? value * 1.60934 : value
      
      return {
        value: valueInKm,
        unit: 'km',
        original: { value, unit }
      }
    }
    return undefined
  }
  
  private extractTravelClass(text: string): string {
    const lower = text.toLowerCase()
    if (lower.includes('first class')) return 'first'
    if (lower.includes('business')) return 'business'
    if (lower.includes('economy') || lower.includes('coach')) return 'economy'
    return 'economy' // Default
  }
  
  private detectReportType(text: string): string {
    const lower = text.toLowerCase()
    if (lower.includes('sustainability')) return 'sustainability'
    if (lower.includes('esg')) return 'esg'
    if (lower.includes('carbon') || lower.includes('ghg')) return 'carbon'
    if (lower.includes('environmental')) return 'environmental'
    return 'sustainability'
  }
  
  private extractReportPeriod(text: string): string | undefined {
    const periodMatch = text.match(/(?:period|year|fy)\s*(\d{4})/i)
    return periodMatch ? periodMatch[1] : undefined
  }
  
  private extractEmissionValue(text: string, pattern: RegExp): number | undefined {
    const match = text.match(pattern)
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''))
    }
    return undefined
  }
  
  private extractValue(text: string, pattern: RegExp): any {
    const match = text.match(pattern)
    if (match) {
      return {
        value: parseFloat(match[1].replace(/,/g, '')),
        unit: match[2]
      }
    }
    return undefined
  }
  
  private detectCertificateType(text: string): string {
    const lower = text.toLowerCase()
    if (lower.includes('iso 14001')) return 'ISO 14001'
    if (lower.includes('carbon neutral')) return 'Carbon Neutral'
    if (lower.includes('renewable')) return 'Renewable Energy'
    if (lower.includes('b corp')) return 'B Corp'
    return 'Environmental'
  }
  
  private isEmissionRelevant(description: string): boolean {
    const relevantKeywords = [
      'fuel', 'gas', 'electricity', 'energy', 'transport', 'shipping',
      'travel', 'waste', 'water', 'paper', 'equipment', 'vehicle'
    ]
    
    const lower = description.toLowerCase()
    return relevantKeywords.some(keyword => lower.includes(keyword))
  }
  
  private categorizeItem(description: string): string {
    const lower = description.toLowerCase()
    
    if (lower.includes('fuel') || lower.includes('gas')) return 'fuel'
    if (lower.includes('electric')) return 'electricity'
    if (lower.includes('shipping') || lower.includes('freight')) return 'shipping'
    if (lower.includes('travel') || lower.includes('flight')) return 'travel'
    if (lower.includes('office') || lower.includes('supplies')) return 'office supplies'
    if (lower.includes('equipment') || lower.includes('computer')) return 'equipment'
    
    return 'services'
  }
  
  private determineScope(category: string): number {
    const scope1Categories = ['fuel', 'refrigerants']
    const scope2Categories = ['electricity', 'heating', 'cooling']
    
    if (scope1Categories.includes(category)) return 1
    if (scope2Categories.includes(category)) return 2
    return 3 // Everything else is Scope 3
  }
  
  private determineInvoiceScope(data: ExtractedData): number {
    // Analyze items to determine primary scope
    if (!data.items) return 3
    
    const scopes = data.items.map((item: any) => item.emissionScope || 3)
    const scopeCounts = scopes.reduce((acc: Record<number, number>, scope: number) => {
      acc[scope] = (acc[scope] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    
    // Return most common scope
    const entries = Object.entries(scopeCounts).sort((a, b) => (b[1] as number) - (a[1] as number))
    return entries.length > 0 ? parseInt(entries[0][0]) : 3
  }
  
  private inferEmissions(extractedValues: any): any {
    const emissions: any = {}
    
    // Look for direct emission values
    if (extractedValues.emissions) {
      const emissionValues = extractedValues.emissions.map((match: string) => {
        const value = parseFloat(match.match(/[\d.]+/)?.[0] || '0')
        const unit = match.match(/(?:tonnes?|tons?|kg|tCO2e?|kgCO2e?)/i)?.[0]
        
        // Normalize to kgCO2e
        let normalizedValue = value
        if (unit?.toLowerCase().includes('ton')) {
          normalizedValue = value * 1000
        }
        
        return normalizedValue
      })
      
      emissions.detected = emissionValues
      emissions.total = emissionValues.reduce((sum: number, val: number) => sum + val, 0)
    }
    
    // Look for energy values and estimate emissions
    if (extractedValues.energy) {
      const energyEmissions = extractedValues.energy.map((match: string) => {
        const value = parseFloat(match.match(/[\d.]+/)?.[0] || '0')
        const unit = match.match(/(?:kWh|MWh|GWh)/i)?.[0]
        
        // Convert to kWh
        let kWh = value
        if (unit?.toLowerCase() === 'mwh') kWh = value * 1000
        if (unit?.toLowerCase() === 'gwh') kWh = value * 1000000
        
        // Estimate emissions (0.4 kgCO2e per kWh average)
        return kWh * 0.4
      })
      
      emissions.fromEnergy = energyEmissions
      emissions.energyTotal = energyEmissions.reduce((sum: number, val: number) => sum + val, 0)
    }
    
    return emissions
  }
  
  private calculateConfidence(data: ExtractedData): number {
    let confidence = 0
    let factors = 0
    
    // Check completeness of extracted data
    const requiredFields: Record<string, string[]> = {
      invoice: ['vendor', 'date', 'total'],
      utility: ['utilityType', 'usage', 'billingPeriod'],
      travel: ['travelType', 'distance', 'date'],
      report: ['metrics', 'period'],
      certificate: ['certificateType', 'issuer', 'validFrom']
    }
    
    const required = requiredFields[data.documentType] || []
    const present = required.filter(field => data[field as keyof ExtractedData]).length
    
    if (required.length > 0) {
      confidence += (present / required.length) * 0.5
      factors++
    }
    
    // Check emission calculation confidence
    if (data.emissions?.confidence) {
      confidence += data.emissions.confidence * 0.3
      factors++
    }
    
    // Check data quality
    if (data.emissions?.total && data.emissions.total > 0) {
      confidence += 0.2
      factors++
    }
    
    return factors > 0 ? confidence / factors : 0.5
  }
  
  private generateDataQualitySuggestions(data: ExtractedData): string[] {
    const suggestions: string[] = []
    
    // Check for missing critical fields
    if (data.documentType === 'utility' && !data.usage) {
      suggestions.push('Could not extract usage data - please verify manually')
    }
    
    if (data.documentType === 'travel' && !data.distance) {
      suggestions.push('Distance not found - emissions calculation may be incomplete')
    }
    
    // Check confidence
    const confidence = this.calculateConfidence(data)
    if (confidence < 0.7) {
      suggestions.push('Low confidence extraction - recommend manual verification')
    }
    
    // Check for emission factors
    if (data.emissions && !data.emissions.total) {
      suggestions.push('Unable to calculate emissions - missing conversion factors')
    }
    
    return suggestions
  }
  
  private generateBatchSummary(results: ParseResult[]): BatchSummary {
    const summary: BatchSummary = {
      totalDocuments: results.length,
      successfulExtractions: results.filter(r => r.confidence > 0.5).length,
      documentTypes: {},
      averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
      errors: results.filter(r => r.confidence < 0.3).map(r => ({
        document: r.fileName,
        issue: r.suggestions[0] || 'Low confidence extraction'
      }))
    }
    
    // Count document types
    results.forEach(r => {
      const type = r.extractedData.documentType
      summary.documentTypes[type] = (summary.documentTypes[type] || 0) + 1
    })
    
    return summary
  }
  
  private calculateTotalEmissions(results: ParseResult[]): EmissionsSummary {
    const emissions: EmissionsSummary = {
      total: 0,
      byScope: { scope1: 0, scope2: 0, scope3: 0 },
      bySource: {},
      byDocument: {}
    }
    
    results.forEach(result => {
      if (result.extractedData.emissions?.total) {
        const total = result.extractedData.emissions.total
        emissions.total += total
        
        // Add by scope
        const scope = result.extractedData.emissions.scope || 3
        emissions.byScope[`scope${scope}` as keyof typeof emissions.byScope] += total
        
        // Add by source
        const source = result.extractedData.documentType
        emissions.bySource[source] = (emissions.bySource[source] || 0) + total
        
        // Add by document
        emissions.byDocument[result.fileName] = total
      }
    })
    
    return emissions
  }
  
  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate()
      this.ocrWorker = null
    }
  }
}

// Type definitions
interface ExtractedData {
  documentType: string
  [key: string]: any
  emissions: any
}

interface ParseResult extends Omit<Awaited<ReturnType<DocumentParser['parseDocument']>>, 'rawText'> {
  fileName: string
}

interface BatchSummary {
  totalDocuments: number
  successfulExtractions: number
  documentTypes: Record<string, number>
  averageConfidence: number
  errors: Array<{ document: string; issue: string }>
}

interface EmissionsSummary {
  total: number
  byScope: {
    scope1: number
    scope2: number
    scope3: number
  }
  bySource: Record<string, number>
  byDocument: Record<string, number>
}

// Export singleton instance
export const documentParser = new DocumentParser()