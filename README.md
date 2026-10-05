# Vantload Downloader – website

The landing page for Vantload Downloader. Plain HTML, CSS and a little JavaScript: no build step, no
dependencies, no cookies, no analytics. It works on GitHub Pages and Cloudflare Pages as-is.

```
index.html              the page
404.html                not-found page
robots.txt, sitemap.xml SEO
favicon.ico
_headers                security + cache headers (Cloudflare Pages reads this; GitHub Pages ignores it)
.nojekyll               tells GitHub Pages to serve files untouched
assets/css/style.css
assets/js/config.js     ← the links you edit (download, privacy, contact, Chrome Store…)
assets/js/main.js       connection demo, quality picker, lightbox, mobile menu
assets/img/             real screenshots of the app (WebP), logo, favicons, social card
```

## Publish on GitHub Pages

1. Create a **new** repository named `vantload` (don't reuse `vantload-downloader`: that repo serves the
   privacy policy the Chrome Web Store listing points at, and its address must keep working).
2. Push this folder to it:

   ```bash
   git remote add origin https://github.com/zainasghar-fs/Vantload.git
   git push -u origin main
   ```

3. Repo → **Settings → Pages** → Source: *Deploy from a branch* → `main` / `(root)` → Save.
4. The site goes live at `https://zainasghar-fs.github.io/Vantload/`.

### If you pick a different repo name or a custom domain

The canonical/Open Graph/sitemap addresses are written out in full. Replace
`https://zainasghar-fs.github.io/Vantload/` in `index.html`, `404.html`, `robots.txt` and `sitemap.xml`:

```powershell
Get-ChildItem index.html,404.html,robots.txt,sitemap.xml | ForEach-Object {
  (Get-Content $_ -Raw).Replace('https://zainasghar-fs.github.io/Vantload/','https://YOUR-NEW-ADDRESS/') | Set-Content $_ -NoNewline
}
```

Also change `GITHUB_URL` / `DOWNLOAD_URL` in `assets/js/config.js` and the two `releases/latest` links in `index.html`
(they are the no-JavaScript fallbacks).

## Publish on Cloudflare Pages (later)

Connect the repo, framework preset **None**, build command empty, output directory `/`. `_headers` is picked up automatically.

## Before announcing it

- [ ] **Create a GitHub Release** in the new repo and attach `VantloadDownloaderSetup.exe` (~145 MB, so it can't live in the
      site itself; Cloudflare Pages' limit is 25 MB per file). For a one-click download, set `DOWNLOAD_URL` to
      `https://github.com/zainasghar-fs/Vantload/releases/latest/download/VantloadDownloaderSetup.exe`.
- [ ] When the Chrome Web Store listing is approved, paste its link into `CHROME_STORE_URL` in `assets/js/config.js`.
      Until then the "Add to Chrome" buttons show "coming soon" instead of a dead link.
- [ ] Check the repo's Pages URL matches the one above (see "different repo name").
- [ ] Optional: sign the installer. Until then the page tells visitors about the SmartScreen "unknown publisher" notice (FAQ).

## What the page claims (so it stays true)

Everything is something the app does today: up to 32 connections (default 8), pause/resume, Start/Pause Queue,
multi-select, per-download speed limit, categories/filters/search, tray icon, optional start with Windows, light/dark/system
theme, MP4/MKV picker with width×height labels, Chrome extension, single installer with .NET + yt-dlp + ffmpeg bundled.
It deliberately does **not** mention a scheduler, automatic retry, clipboard monitoring, cookies/login support or other
browsers. Add those lines only after they exist.

The screenshots are real captures of the shipping app (demo downloads, no personal data).
