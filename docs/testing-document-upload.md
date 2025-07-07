# Testing Document Upload in Production

## Pre-Production Checklist

### 1. Environment Variables Required
```bash
# AI Providers (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 2. Database Tables Needed
Ensure these tables exist in Supabase:
- `emissions`
- `esg_metrics`
- `sustainability_targets`
- `compliance_activities`

### 3. API Routes to Deploy
- `/api/import/sustainability-report` - Direct report import
- `/api/ai/chat-enhanced` - Chat with file upload support

## Safe Testing Steps

### Step 1: Test with Small PDF First
Create a simple test PDF with known values:

```
Test Sustainability Report 2024
Company: Test Corp
Scope 1 Emissions: 100 tonnes CO2e
Scope 2 Emissions: 200 tonnes CO2e
Scope 3 Emissions: 300 tonnes CO2e
Total: 600 tonnes CO2e
```

### Step 2: Test via API Directly
```bash
# Test the import endpoint
curl -X POST https://your-app.vercel.app/api/import/sustainability-report \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test-report.pdf" \
  -F "organizationId=your-org-id" \
  -F "userId=your-user-id" \
  -F "generateMonthly=false"
```

### Step 3: Check Database
Verify data was inserted correctly:
```sql
-- Check emissions table
SELECT * FROM emissions 
WHERE organization_id = 'your-org-id' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check ESG metrics
SELECT * FROM esg_metrics 
WHERE organization_id = 'your-org-id' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Step 4: Test in Chat Interface
1. Go to your chat interface
2. Upload the test PDF
3. Verify the response shows extracted data
4. Check if database was updated

### Step 5: Test with Real Report
Once test PDF works, try with a real sustainability report

## Monitoring & Debugging

### Check Logs
```bash
# Vercel logs
vercel logs --follow

# Check for errors
vercel logs --filter=error
```

### Common Issues & Solutions

1. **"API key missing" error**
   - Ensure environment variables are set in Vercel dashboard
   - Redeploy after adding env vars

2. **"Table does not exist" error**
   - Run migrations: `npx supabase db push`
   - Or create tables manually

3. **"File too large" error**
   - Vercel has 4.5MB body limit
   - Consider chunking large files or using external storage

4. **"Timeout" error**
   - Vercel has 10s limit for hobby, 60s for pro
   - Consider background processing for large files

## Testing Different Document Types

### 1. Sustainability Report
- Expected: Extracts emissions, energy, water, waste
- Creates: emissions records, ESG metrics, targets

### 2. Utility Bill
- Expected: Extracts usage, period, cost
- Creates: Scope 2 emissions record

### 3. Invoice
- Expected: Identifies emission-relevant items
- Creates: Scope 3 emissions records

### 4. Travel Document
- Expected: Extracts route, distance
- Creates: Scope 3 travel emissions

## Production Safety Tips

1. **Start Small**: Test with one document type first
2. **Use Test Organization**: Create a test org to avoid mixing data
3. **Monitor Costs**: Watch API usage for OpenAI/Anthropic
4. **Set Limits**: Add rate limiting to prevent abuse
5. **Backup First**: Export existing data before bulk imports

## Quick Test Script

Save as `test-upload.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Document Upload Test</title>
</head>
<body>
    <h1>Test Document Upload</h1>
    <form id="uploadForm">
        <input type="file" id="file" accept=".pdf" required>
        <input type="text" id="orgId" placeholder="Organization ID" required>
        <input type="text" id="userId" placeholder="User ID" required>
        <button type="submit">Upload</button>
    </form>
    <div id="result"></div>

    <script>
        document.getElementById('uploadForm').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('file', document.getElementById('file').files[0]);
            formData.append('organizationId', document.getElementById('orgId').value);
            formData.append('userId', document.getElementById('userId').value);
            formData.append('generateMonthly', 'true');
            
            const response = await fetch('/api/import/sustainability-report', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            document.getElementById('result').innerText = JSON.stringify(result, null, 2);
        };
    </script>
</body>
</html>
```

## Rollback Plan

If issues occur:
1. Remove new API routes
2. Revert to previous deployment
3. Clean up test data:
```sql
DELETE FROM emissions WHERE data_source = 'sustainability_report' AND created_at > '2024-01-07';
```