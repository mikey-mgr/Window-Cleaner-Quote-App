# WindowCleanerApp

Cross-platform quoting and customer management app for a window-cleaning service. Built with React + Vite + Tailwind and packaged for mobile using Capacitor. Includes offline-first data storage, window template pricing, quote calculations, and WhatsApp sharing.

**Key Features**
- Offline-first customers, quotes, and templates (localStorage-backed)
- Window template image uploads and pricing
- Quote modifiers (heavy dirt / second story) and customer discounts
- Neighborhood multipliers for pricing
- WhatsApp quote sharing with formatted summary
- Android build via Capacitor

**Tech Stack**
- React + Vite
- Tailwind CSS
- Capacitor (Android wrapper)

## Getting Started

**Install dependencies**
```bash
npm install
```

**Run locally (web)**
```bash
npm run dev
```

**Build web app**
```bash
npm run build
```

## Android (Capacitor)

**Add Android platform (first time only)**
```bash
npx cap add android
```

**Copy web build into Android**
```bash
npx cap copy android
```

**Open in Android Studio**
```bash
npx cap open android
```

Build the APK from Android Studio and install on a device.

## iOS (Capacitor)

iOS builds require macOS + Xcode.

```bash
npx cap add ios
npm run build
npx cap copy ios
npx cap open ios
```

## Hosting (Web)

This is a static Vite build. After `npm run build`, upload the `dist/` folder to any static host:
- Netlify
- Vercel
- GitHub Pages
- Cloudflare Pages

## License

Private/internal project unless otherwise specified.
