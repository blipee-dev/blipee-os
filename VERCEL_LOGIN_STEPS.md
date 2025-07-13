# Vercel Login Steps

## Quick Login Process:

1. **In your terminal, run:**
   ```bash
   vercel login
   ```

2. **Select "Continue with GitHub"** (press Enter)

3. **It will show a URL like:**
   ```
   > Please visit https://vercel.com/verify/[some-code]
   ```

4. **Copy that URL and open in your browser**

5. **Click "Verify" in the browser**

6. **Return to terminal** - you'll see "Success!"

## After Login:

Run the deployment:
```bash
./deploy-now.sh
```

Or directly:
```bash
vercel --prod --env-file=.env.staging --yes
```

## Alternative: Use Vercel Token

If you have a Vercel token, you can use it directly:
```bash
export VERCEL_TOKEN="your-vercel-token"
vercel --prod --env-file=.env.staging --yes --token $VERCEL_TOKEN
```

The retail module is built and ready - just needs your authentication to deploy!