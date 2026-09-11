# Sarvestan Extension — Install for Testers

## Quick install (Chrome / Edge / Brave)

1. Unzip the release package if needed.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Turn on **Developer mode** (top-right).
4. Click **Load unpacked** and select the **`dist`** folder inside the package (the folder that contains `manifest.json`).
5. Open [behestan.kntu.ac.ir](https://behestan.kntu.ac.ir/) and log in with your university account.
6. Wait a few seconds, then click the Sarvestan toolbar icon or the floating button on Behestan.

## What to expect

- Dashboard opens as a full tab or overlay on Behestan.
- Data (schedule, grades, finance, …) syncs slowly on purpose (anti-ban), not instantly.
- Payment is **view-only**; real payment must be done in official Behestan.

## After code changes (developer)

```powershell
cd "W:\sarv dashboard"
npm run build
```

Then reload the extension from `chrome://extensions` (refresh button).

## Do **not** send to testers

- `*.har` files (contain your private data)
- `node_modules/`
- source folders unless needed

Only ship the **`dist`** folder (or a zip of it).
