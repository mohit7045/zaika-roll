# ZaikaRoll Website

Restaurant ordering website — static HTML/CSS/JS frontend + Firebase (Firestore + Authentication) backend.

## Folder Structure

```
zaikaroll-website/
├── index.html              # Customer-facing site (menu, cart, checkout)
├── page2.html               # Admin panel
├── delivery.html            # Delivery partner login
├── delivery-dashboard.html  # Delivery partner dashboard
│
├── css/
│   ├── main.css             # index.html styles
│   ├── admin.css            # page2.html styles
│   └── delivery.css         # delivery.html / delivery-dashboard.html styles
│
├── js/
│   ├── script.js            # index.html logic (menu, cart, checkout, App Check)
│   └── admin.js             # page2.html logic (admin panel)
│
├── images/
│   ├── roll.jpeg
│   └── roll2.jpg
│
├── firestore.rules          # Firestore Security Rules — deploy via Firebase Console
│
├── functions/                # OPTIONAL Cloud Function for server-side price verification
│   ├── index.js
│   └── package.json
│
├── .gitignore
└── README.md                 # (this file)
```

## Deploy Checklist

1. **Firestore Rules** — Firebase Console → Firestore Database → Rules → paste `firestore.rules` content → Publish.
2. **Push to GitHub** — `git add . && git commit -m "..." && git push` → Netlify auto-deploys.
3. **App Check** — already wired into `js/script.js`, `js/admin.js`, `delivery.html`, `delivery-dashboard.html`. Register in Firebase Console → App Check → reCAPTCHA v3, confirm the site key matches, then switch from Monitor to Enforce once verified.
4. **(Optional) Cloud Function** — for full server-side price verification, requires Firebase Blaze plan:
   ```
   firebase init functions   # point it at this project
   # replace generated functions/index.js and package.json with the ones here
   cd functions && npm install && cd ..
   firebase deploy --only functions
   ```

## Full Security Reference

See `website-security-guide.pdf` (shared separately) for the complete writeup: what was fixed, why, how to detect issues, how to fix them, and a full guide for building future projects securely.
