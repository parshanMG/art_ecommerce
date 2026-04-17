# Art Ecommerce (React + Vite)

This project has been migrated from a single HTML file with CDN scripts to a proper React development setup using Vite.

## Project structure

- `index.html`: Main HTML entry point for Vite.
- `src/`: React app source code.
- `src/components/FeaturedProductsCarousel.jsx`: Product carousel component.
- `src/services/productsService.js`: Data-fetching functions.
- `public/data/products.json`: Product data file.
- `public/images/`: Static image assets.
- `public/navbar.js`: Existing navbar script loaded on page startup.
- `.env`: Project environment variables.

## Install

```bash
npm install
```

## Run development server

```bash
npm run dev
```

Vite will print a local URL (usually http://localhost:5173).

## Build for production

```bash
npm run build
```

Build output goes to `dist/`.

## Preview production build

```bash
npm run preview
```

## Environment variables

The project uses Vite environment variables with a `VITE_` prefix.

Current variable:

- `VITE_PRODUCTS_ENDPOINT=/data/products.json`

You can change this in `.env` if you later move the product API/data path.

## How data loading works

1. `FeaturedProductsCarousel` calls `fetchProducts()` from `src/services/productsService.js`.
2. `fetchProducts()` reads from `VITE_PRODUCTS_ENDPOINT`.
3. Products are filtered with `getFeaturedProducts()`.
4. The carousel renders those featured items.
