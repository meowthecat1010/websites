# Open Schedule

A simple, no-account scheduling app. Users pick an open time slot and text you their details — no data stored on them whatsoever.

## Setup

### 1. Before you deploy — update your phone number
Open `src/App.jsx` and find this line near the top:

```js
const CONTACT_PHONE = "(555) 012-3456";
```

Replace it with your real number. You can also change `BUSINESS_NAME` here.

---

### 2. Run locally (optional)

```bash
npm install
npm run dev
```

Then open http://localhost:5173

---

### 3. Deploy to Vercel (free)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **Add New Project** → import your repo
4. Leave all settings as default → click **Deploy**
5. Done — Vercel gives you a live URL to share

That's it. No environment variables or config needed.

---

## File structure

```
├── index.html          # Entry HTML
├── vite.config.js      # Vite config
├── package.json        # Dependencies
└── src/
    ├── main.jsx        # React root
    └── App.jsx         # The entire app
```

## How it works

- **Admin tab** — set which hours you're available each day of the week. Toggle days on/off, pick hours, use quick presets (morning/afternoon/evening).
- **Book a Slot tab** — users see the weekly calendar, click an open slot, confirm with one tap, then see your phone number to text with their details.
- Bookings persist in the browser session. For persistent storage across devices, consider connecting a free [Supabase](https://supabase.com) database.
