# Deployment

This app can run as a hosted Vite site with Supabase cloud sync.

## Supabase

1. Create a Supabase project.
2. Open `SQL Editor`.
3. Run the contents of `supabase/schema.sql`.
4. Copy the project URL and anon public key from `Project Settings -> API`.
5. After the Vercel site is live, set `Authentication -> URL Configuration`:
   - `Site URL`: the Vercel production URL
   - `Redirect URLs`: the same URL with `/**`

## Vercel

Import the GitHub repository and use these settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Set these environment variables in Vercel:

```text
VITE_SUPABASE_URL=your Supabase Project URL
VITE_SUPABASE_ANON_KEY=your Supabase anon public key
```

Redeploy after changing environment variables.
