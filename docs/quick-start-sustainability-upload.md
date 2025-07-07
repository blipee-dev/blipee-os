# Quick Start: Upload Sustainability Reports in Blipee Assistant

## How to Use

1. **Open Blipee Assistant**
   - Go to http://localhost:3000 (or your production URL)
   - The conversational interface will open

2. **Upload Your Sustainability Report**
   - Click the 📎 paperclip icon in the input area
   - Select your PDF sustainability report
   - Or simply drag & drop the PDF into the chat window

3. **Blipee Automatically Extracts Data**
   - The AI will analyze your report
   - Extract emissions data (Scope 1, 2, 3)
   - Extract ESG metrics (energy, water, waste)
   - Store everything in your Supabase database

4. **Ask Follow-up Questions**
   After upload, you can ask:
   - "Compare this report with last year"
   - "Show me the emissions breakdown"
   - "What are our biggest improvement areas?"
   - "Generate a CSRD-compliant summary"

## What Gets Extracted - Full ESG Analysis

### 🌍 Environmental Data
- ✅ **Emissions**: Scope 1, 2, 3 (tonnes CO₂e), intensity metrics
- ✅ **Energy**: Total consumption, renewable %, energy intensity
- ✅ **Water**: Consumption, recycled %, water stress areas
- ✅ **Waste**: Total generated, recycled %, hazardous waste
- ✅ **Biodiversity**: Impacts, protected areas, restoration projects
- ✅ **Circular Economy**: Recycled materials, product lifecycle

### 👥 Social Data
- ✅ **Employees**: Total count, diversity % (gender, ethnicity), turnover rate
- ✅ **Health & Safety**: LTIFR, TRIFR, fatalities, near misses
- ✅ **Training**: Hours per employee, programs, skill development
- ✅ **Community**: Investment, volunteer hours, beneficiaries
- ✅ **Human Rights**: Assessments, violations, remediation
- ✅ **Supply Chain**: Audits completed, violations found, corrective actions

### ⚖️ Governance Data
- ✅ **Board**: Composition, independence %, diversity %
- ✅ **Ethics**: Code violations, whistleblower reports, training completion
- ✅ **Compliance**: Fines, penalties, legal actions
- ✅ **Risk Management**: Key risks identified, mitigation measures
- ✅ **Cybersecurity**: Incidents, data breaches, training
- ✅ **Executive Compensation**: CEO pay ratio, ESG-linked compensation %

### 🎯 Targets & Commitments
- ✅ Net Zero targets and progress
- ✅ Science-based targets (SBTi)
- ✅ UN SDG alignments
- ✅ Other commitments and deadlines

### 🏆 Certifications
- ✅ ISO certifications (14001, 45001, 27001, etc.)
- ✅ B Corp status
- ✅ Other sustainability certifications

From utility bills:
- ✅ Usage amounts (kWh, m³)
- ✅ Billing periods
- ✅ Automatic emission calculations

From invoices:
- ✅ Emission-relevant purchases
- ✅ Travel expenses
- ✅ Fuel/energy costs

## Supported File Types

- PDF (sustainability reports, utility bills, invoices)
- Images (JPG, PNG) - coming soon with AI vision
- Spreadsheets (CSV, XLSX) - coming soon

## Environment Variables Required

Make sure these are set in your `.env.local`:

```bash
# At least one AI provider
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Testing

1. **Test with a small PDF first**
   Create a simple test PDF with:
   ```
   Test Report 2024
   Scope 1: 100 tonnes CO2e
   Scope 2: 200 tonnes CO2e
   ```

2. **Check the response**
   For a simple test, Blipee responds with:
   ```
   I've successfully analyzed your sustainability report!
   
   📊 Emissions Summary:
   • Scope 1: 100 tonnes CO₂e
   • Scope 2: 200 tonnes CO₂e
   • Total: 300 tonnes CO₂e
   
   I've stored 2 emission records in your database.
   ```

   For a real sustainability report, you'll get comprehensive ESG analysis:
   ```
   I've successfully analyzed your sustainability report! Here's a comprehensive breakdown:

   🌍 ENVIRONMENTAL PERFORMANCE

   📊 Emissions:
   • Scope 1: 45,230 tonnes CO₂e
   • Scope 2: 89,450 tonnes CO₂e
   • Scope 3: 234,000 tonnes CO₂e
   • Total: 368,680 tonnes CO₂e

   ⚡ Energy:
   • Total consumption: 450,000 MWh
   • Renewable energy: 34%

   💧 Water:
   • Consumption: 2,300,000 m³
   • Recycled: 45%

   👥 SOCIAL PERFORMANCE

   Workforce:
   • Total employees: 12,450
   • Gender diversity: 38% women
   • Turnover rate: 12%

   🦺 Health & Safety:
   • LTIFR: 0.23
   • TRIFR: 1.45
   • Fatalities: 0

   ⚖️ GOVERNANCE

   Board Composition:
   • Independent directors: 75%
   • Board diversity: 45%

   🎯 TARGETS & COMMITMENTS
   • Net Zero target: 2040
   • Science-based targets: ✓ Approved

   ✅ I've stored 15 emission records and 25 ESG metrics in your database.
   ```

3. **Verify in Supabase**
   Check your emissions table:
   ```sql
   SELECT * FROM emissions 
   WHERE data_source = 'sustainability_report'
   ORDER BY created_at DESC;
   ```

## That's It! 🎉

You can now upload any sustainability report and Blipee will:
1. Extract all the data using AI
2. Store it in your Supabase tables
3. Let you analyze it conversationally

No complex setup, no manual data entry - just drag, drop, and ask!