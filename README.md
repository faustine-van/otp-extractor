# OTP Extractor

A Chrome extension that automatically detects OTP codes and verification links from your Gmail inbox in real time.

No need to open Gmail or switch tabs — it runs in the background and surfaces what matters instantly.

## Why I built this

I found myself constantly switching to Gmail just to copy OTP codes or open verification links.

So I built a solution that handles it automatically: detect, notify, copy, and even autofill when possible.

This project reflects my approach to building—starting from everyday problems and turning them into practical, usable tools.

---

## What it does

- Polls your Gmail every 30 seconds for new unread emails
- Detects OTP codes (4–8 digits) and verification links using proximity-based scoring
- Copies the detected value to your clipboard automatically
- Shows a Chrome notification instantly
- Auto-fills OTP into the active tab's input field if one is found
- Keeps a history of the last 10 detections in the popup
- Works silently in the background — even when the popup is closed

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 + TypeScript |
| Build | Vite + vite-plugin-web-extension |
| Styling | Custom CSS (no UI library) |
| Package manager | pnpm |
| Browser APIs | Chrome Extensions MV3 |
| Email | Gmail REST API v1 |
| Auth | Google OAuth 2.0 via chrome.identity |

---

## Project Structure

```
otp-extractor/
├── src/
│   ├── background/
│   │   ├── background.ts       # Service worker entry point
│   │   ├── gmail.ts            # Gmail API calls + body extraction
│   │   ├── notify.ts           # Chrome notifications + tab messaging
│   │   └── poll.ts             # Poll logic + alarm setup
│   ├── content/
│   │   └── content.ts          # Auto-fill + clipboard
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.tsx           # Popup entry point
│   │   ├── components/
│   │   │   ├── AuthScreen.tsx
│   │   │   ├── DetectionList.tsx
│   │   │   ├── EmptyScreen.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── LinkCard.tsx
│   │   │   ├── OTPCard.tsx
│   │   │   ├── RadarIllustration.tsx
│   │   │   └── StatusBar.tsx
│   │   └── styles/
│   │       ├── animations.css
│   │       ├── base.css
│   │       ├── buttons.css
│   │       ├── cards.css
│   │       ├── layout.css
│   │       └── screens.css
│   ├── auth/
│   │   └── auth.ts             # OAuth token management + caching
│   ├── utils/
│   │   ├── parser/
│   │   │   ├── index.ts        # Parser entry point
│   │   │   ├── otp.ts          # OTP detection + scoring
│   │   │   ├── link.ts         # Verification link detection
│   │   │   └── helpers.ts      # HTML stripping + shared utils
│   │   └── storage.ts          # chrome.storage helpers
│   └── types/
│       └── index.ts            # Shared TypeScript interfaces
├── public/
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── manifest.json
├── vite.config.ts
└── tsconfig.json
```

---

## Prerequisites

Before you start you need:

- [Node.js](https://nodejs.org) v18 or higher
- [pnpm](https://pnpm.io) — install with `npm install -g pnpm`
- A Google account
- A Google Cloud project with Gmail API enabled

---

## Google Cloud Setup

You need to do this once before the extension will work.

**1. Create a Google Cloud project**

Go to [console.cloud.google.com](https://console.cloud.google.com), create a new project and name it `otp-extractor`.

**2. Enable the Gmail API**

In the search bar type `Gmail API`, click it, then click **Enable**.

**3. Configure the OAuth consent screen**

Go to **APIs & Services → OAuth consent screen**:
- User type: External
- App name: OTP Extractor
- Add your Gmail address as a test user
- Add scope: `https://www.googleapis.com/auth/gmail.readonly`

**4. Create OAuth credentials**

Go to **APIs & Services → Credentials → Create Credentials → OAuth Client ID**:
- Application type: **Chrome Extension**
- Extension ID: you'll get this after loading the extension (step below)

Copy the **Client ID** — you'll need it in the next step.

---

## Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/otp-extractor.git
cd otp-extractor
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Add your Client ID**

Open `manifest.json` and replace the placeholder:

```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/gmail.readonly"
  ]
}
```

**4. Build the extension**

```bash
pnpm build
```

This generates a `dist/` folder.

**5. Load in Chrome**

- Go to `chrome://extensions`
- Enable **Developer mode** (top right)
- Click **Load unpacked**
- Select the `dist/` folder

**6. Update your OAuth credentials with the Extension ID**

- Copy your Extension ID from `chrome://extensions`
- Go back to Google Cloud Console → Credentials → your OAuth Client ID
- Paste the Extension ID in the **Application ID** field
- Save

**7. Pin the extension**

Click the puzzle icon in Chrome toolbar → pin **OTP Extractor**.

> **Note:** Because this is an unpacked extension, Chrome may disable it after a browser update or restart. If that happens, go to `chrome://extensions`, click **Reload** on the extension card, then re-pin it. To make reloading faster, save this path somewhere accessible — you only need to select the `dist/` folder again.

---

## Usage

1. Click the OTP Extractor icon in your toolbar
2. Click **Connect Gmail** and complete the Google sign-in
3. The extension is now monitoring your inbox

When a verification email arrives:
- A Chrome notification fires with the OTP code
- The code is copied to your clipboard automatically
- If you have an OTP input field open in the active tab, it gets filled in
- The popup history updates in real time

---

## Development

**Run a development build with watch mode:**

```bash
pnpm build --watch
```

After any code change, go to `chrome://extensions` and click the reload button on the extension card.

**Folder conventions:**
- Keep each file under 100 lines
- Background logic lives in `src/background/`
- Parser logic is split by concern in `src/utils/parser/`
- Each popup screen is its own component in `src/popup/components/`

---


## Important Notes

**This extension is not published on the Chrome Web Store.** It runs as an unpacked extension loaded from your local machine. This means:

- You need to keep the `dist/` folder on your computer
- If you remove the extension and reload it, you may get a new Extension ID — update your Google Cloud credentials if that happens
- The extension only works when Chrome is open. It monitors silently in the background as long as Chrome is running

**Gmail access is read-only.** The extension cannot read, send, delete, or modify any emails. It only scans incoming unread email bodies for OTP patterns.

---

## How Detection Works

The parser uses a scoring system rather than a simple regex:

- Numbers are only considered if they appear within 250 characters of an OTP keyword
- 6-digit codes score higher than 4 or 8 digit ones
- Numbers that look like years (1900–2099) are rejected
- Numbers inside URLs are rejected
- Numbers adjacent to dashes or dots (phone fragments) are rejected
- Verification links must contain token-like query parameters and pass a blacklist check for unsubscribe/tracking URLs

---

## License

This project is licensed under the MIT License.