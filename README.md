# Master Audio

Master Audio is a browser-based audio production suite that combines three workflows in one app:

- **Mastering Audio**: mastering controls, LUFS/true peak validation, meters, and WAV export.
- **Clean Noise**: browser audio cleanup powered by FFmpeg.
- **StemMix**: Demucs stem separation, mixer controls, waveform preview, and export.

Audio processing runs locally in the browser. Uploaded audio is not sent to an application server.

## Requirements

- Node.js 18 or newer
- npm
- A modern desktop browser
- Internet connection for the first run, because the StemMix model is downloaded automatically

## Local Setup

1. Clone the repository.

```bash
git clone <your-repo-url>
cd master-audio
```

2. Install dependencies.

```bash
npm install
```

3. Start the development server.

For macOS/Linux:

```bash
npm run dev
```

For Windows:

```bat
npm run dev:win
```

The app will download `htdemucs_embedded.onnx` into `public/models` if it is not already available.

4. Open the local URL shown in your terminal.

Common routes:

- `/` - landing page
- `/mastering` - mastering workspace
- `/noise-cleaner` - Clean Noise workspace
- `/stems` - StemMix workspace

## Build

For macOS/Linux:

```bash
npm run build
```

For Windows:

```bat
npm run build:win
```

The production output will be generated in `dist`.

## Large Model Asset

`public/models/htdemucs_embedded.onnx` is intentionally ignored by Git because it is a large model file.

The file is downloaded by:

- `download-assets.sh`
- `download-assets.bat`

If the download URL changes, update both scripts.

## Notes For Deployment

- Do not commit `node_modules`.
- Do not commit `public/models/*.onnx`.
- Before publishing, replace `https://master-audio.vercel.app` in `index.html`, `public/robots.txt`, `public/sitemap.xml`, and `public/llms.txt` with your final production domain.
- After deployment, submit `https://your-domain/sitemap.xml` to Google Search Console and Bing Webmaster Tools so search engines can discover the main pages faster.
- For Vercel, use:
  - Build command: `npm run build`
  - Output directory: `dist`
- `vercel.json` is included for SPA routing and worker/WASM headers.

## Useful Commands

```bash
npm run dev
npm run build
npm run preview
```

Windows equivalents:

```bat
npm run dev:win
npm run build:win
```
