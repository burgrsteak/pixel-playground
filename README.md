# Snap Pixel Playground

A static storefront for testing **Snap Pixel events** — no Apps Script, no server, no build step.

Eight HTML pages simulate a real e-commerce funnel. Each page fires the correct Snap Pixel events:

| Page | Events |
|---|---|
| `index.html` | `PAGE_VIEW` |
| `collection.html` | `PAGE_VIEW`, `LIST_VIEW` |
| `product.html?sku=NB-1002` | `PAGE_VIEW`, `VIEW_CONTENT` |
| `cart.html` | `PAGE_VIEW`, `ADD_CART` |
| `checkout.html` | `PAGE_VIEW`, `START_CHECKOUT` |
| `payment.html` | `PAGE_VIEW`, `ADD_BILLING` |
| `thankyou.html` | `PAGE_VIEW`, `PURCHASE` |
| `signup.html` | `PAGE_VIEW`, `SIGN_UP` |

## Run locally

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>. **Do not open `index.html` directly** — `localStorage` requires an `http://` origin.

## Deploy

This site is hosted on **GitHub Pages**. Any static host works: Netlify, Cloudflare Pages, Vercel, S3.

## Project structure

```
snap-pixel-playground/
├── index.html
├── collection.html
├── product.html
├── signup.html
├── cart.html
├── checkout.html
├── payment.html
├── thankyou.html
└── assets/
    ├── css/store.css
    └── js/
        ├── store.js
        ├── pixel.js
        ├── gtm.js
        ├── codegen.js
        ├── console.js
        ├── terms.js
        ├── shell.js
        └── page-home.js
```

## Verify it works

1. Accept the terms overlay on first load
2. Set a test Pixel ID in **Console → Setup**
3. Walk the funnel: Home → Shop All → Product → Add to cart → Checkout → Payment → Place order
4. Check the **Events tab** on each page — one plan per document load
5. Open the **Snap Pixel Helper** — it now works on a real static origin
