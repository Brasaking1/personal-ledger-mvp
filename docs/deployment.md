# Deployment

This app runs on GitHub Pages with Supabase cloud sync.

## GitHub Pages

The repository includes `.github/workflows/deploy-pages.yml`. Every push to `main` builds the Vite app and deploys `dist` to GitHub Pages.

Production URL:

```text
https://brasaking1.github.io/personal-ledger-mvp/
```

The workflow sets:

```text
VITE_BASE_PATH=/personal-ledger-mvp/
```

so built assets load correctly from the GitHub Pages project path.

## Supabase

1. Create a Supabase project.
2. Open `SQL Editor`.
3. Run the contents of `supabase/schema.sql`.
4. Copy the project URL and anon public key from `Project Settings -> API`.
5. Add these GitHub repository secrets:

```text
VITE_SUPABASE_URL=your Supabase Project URL
VITE_SUPABASE_ANON_KEY=your Supabase anon public key
```

6. In Supabase, set `Authentication -> URL Configuration`:
   - `Site URL`: `https://brasaking1.github.io/personal-ledger-mvp/`
   - `Redirect URLs`: `https://brasaking1.github.io/personal-ledger-mvp/**`
