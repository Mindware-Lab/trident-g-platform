Yes. On the new machine, the key transition is not the old local folder, but the repo, cloud project settings, and secrets.

**Carry Over**
- GitHub repo: `https://github.com/Mindware-Lab/trident-g-platform`
- Main branch: `main`
- IQ Pro app path: `products/trident-g-iq/apps/iq-pro`
- IQMindware website path: `products/trident-g-iq/websites/iqmindware`
- Latest pushed IQ Pro fix commit: `be30ab9 Fix zone route resume button`

**New Machine Setup**
```powershell
git clone https://github.com/Mindware-Lab/trident-g-platform
cd trident-g-platform/products/trident-g-iq/apps/iq-pro
npm install
npm run dev
```

For production build testing:

```powershell
npm run build
```

**Do Not Transfer**
- `node_modules/`
- `dist/`
- local `.env` files with real secrets
- browser `localStorage` unless you specifically need to debug one user/device state

**Secrets / Cloud Config To Recreate**
In `products/trident-g-iq/apps/iq-pro`, create local env from:

```text
.env.example
```

You’ll need the real values from Cloudflare/Supabase, especially:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_IQ_PRO_REQUIRED_BUNDLE
VITE_IQ_PRO_ALLOW_LOCAL_DEMO
SUPABASE_SERVICE_ROLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_IQ_PRO
```

Do not commit real `.env` files.

**Cloudflare Pages**
Confirm the Pages project is still connected to GitHub `main`.

For the IQ Pro app, the important settings are:

```text
Project root: products/trident-g-iq/apps/iq-pro
Build command: npm run build
Build output: dist
Functions directory: functions
```

For `iqmindware.com`, check whether it deploys from:

```text
products/trident-g-iq/websites/iqmindware
```

or from a wider repo/root Pages project. That determines where website edits should be made.

**Git / Push Access**
Set Git identity and authenticate GitHub:

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
gh auth login
```

Or use Git Credential Manager if preferred.

**Codex Context**
When you start fresh Codex, tell it:

```text
Repo: trident-g-platform
Work mainly in:
- products/trident-g-iq/apps/iq-pro for IQ Pro app
- products/trident-g-iq/websites/iqmindware for iqmindware.com website
Branch: main
Deployment: Cloudflare Pages auto-deploys from main
```

That is enough to continue cleanly from another computer.
