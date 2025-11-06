const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '../src/lib/data/gri.ts')
let content = fs.readFileSync(filePath, 'utf8')

// Add the prevYearSiteMap initialization after the scope breakdown variables
const searchPattern = `  let prevYearEmissionsTonnes = 0
  let prevYearScope1 = 0
  let prevYearScope2 = 0
  let prevYearScope3 = 0

  prevYearMetrics?.forEach`

const replacement = `  let prevYearEmissionsTonnes = 0
  let prevYearScope1 = 0
  let prevYearScope2 = 0
  let prevYearScope3 = 0

  // Track previous year emissions by site for per-site YoY
  const prevYearSiteMap = new Map<string, number>()

  prevYearMetrics?.forEach`

// Replace all occurrences
content = content.split(searchPattern).join(replacement)

// Add site tracking in the forEach loop
const forEachPattern = `prevYearMetrics?.forEach((metric: any) => {
    const metricCode = metric.metric?.code || ''
    const emissions = (metric.co2e_emissions || 0) / 1000 // Convert to tonnes

    if (metricCode.startsWith('scope1_')) {`

const forEachReplacement = `prevYearMetrics?.forEach((metric: any) => {
    const metricCode = metric.metric?.code || ''
    const emissions = (metric.co2e_emissions || 0) / 1000 // Convert to tonnes
    const siteId = metric.site_id

    if (metricCode.startsWith('scope1_')) {`

content = content.split(forEachPattern).join(forEachReplacement)

// Add site tracking at the end of forEach
const endForEachPattern = `    } else if (metricCode.startsWith('gri_305')) {
      prevYearEmissionsTonnes += emissions
    }
  })`

const endForEachReplacement = `    } else if (metricCode.startsWith('gri_305')) {
      prevYearEmissionsTonnes += emissions
    }

    // Track by site for per-site YoY
    if (siteId && (metricCode.startsWith('scope1_') || metricCode.startsWith('scope2_') || metricCode.startsWith('scope3_'))) {
      prevYearSiteMap.set(siteId, (prevYearSiteMap.get(siteId) || 0) + emissions)
    }
  })`

content = content.split(endForEachPattern).join(endForEachReplacement)

fs.writeFileSync(filePath, content, 'utf8')
console.log('Added site YoY tracking logic')
