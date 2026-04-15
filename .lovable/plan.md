

# Add GitHub Actions Secrets to New Repository

## Problem
The new repository `pageauditpro-7476caf4` has no secrets configured. The deploy workflow needs 3 FTP secrets to deploy to cPanel.

## Required Secrets

Add these 3 secrets in the new repo's **Settings → Secrets and variables → Actions → New repository secret**:

1. **FTP_SERVER** — Your cPanel FTP hostname (e.g. `pagelyzer.io` or `ftp.pagelyzer.io`)
2. **FTP_USERNAME** — Your cPanel FTP username
3. **FTP_PASSWORD** — Your cPanel FTP password

Copy these values from your old repo (`pageauditpro`) Settings → Secrets → Actions, or from your cPanel account.

## After Adding Secrets
No code changes needed. The workflow file is already correct in the new repo. Once secrets are added, the next push to `main` (or manual workflow trigger) will build and deploy to cPanel automatically.

## Note About Duplicate Workflow Files
The workflow file appears twice in your message — the second version (with sitemap verification) is the correct one already in the repo.

