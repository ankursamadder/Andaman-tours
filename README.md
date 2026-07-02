# Andaman Voyages — Tour Package Website

A React + Tailwind CSS site for browsing Andaman & Nicobar tour packages, viewing
day-by-day itineraries, and submitting a trip enquiry.

## Run it locally

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

To build a production bundle:

```bash
npm run build
npm run preview
```

## Project structure

```
index.html                     entry HTML (loads Google Fonts)
src/
  main.jsx                     React root
  App.jsx                      page layout / shared state
  index.css                    Tailwind + a couple of custom utilities
  data/packages.js             all 6 tour packages: pricing, itineraries, images
  components/
    Navbar.jsx                 sticky nav
    Hero.jsx                   full-bleed hero banner
    PackagesGrid.jsx           filterable package grid
    PackageCard.jsx            individual package card
    ItineraryModal.jsx         day-by-day itinerary popup
    WhyUs.jsx                  trust section
    Gallery.jsx                photo gallery
    EnquiryForm.jsx            enquiry form (see note below)
    Footer.jsx                 footer
```

## Wiring up the enquiry form to actually send enquiries

Right now `EnquiryForm.jsx`'s `handleSubmit` just shows a confirmation screen —
it does **not** send data anywhere yet. To make it functional, replace the
comment block inside `handleSubmit` with a real request, for example:

```js
await fetch("https://your-backend.example.com/api/enquiries", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ...form, packages: selectedPackages.map(p => p.name) }),
});
```

Common options: a simple Node/Express endpoint, a Google Sheets webhook (e.g.
via Sheet.best or a Google Apps Script), Formspree, or EmailJS if you want to
avoid running your own backend.

## Editing tour packages

All package content — name, price, images, itinerary, inclusions/exclusions —
lives in `src/data/packages.js`. Add a new object to the `packages` array to
add a new package; it will automatically appear in the grid and filters.

## Images

Photos are hotlinked from Unsplash (free-to-use, no attribution required) via
`images.unsplash.com` URLs in `src/data/packages.js`. For production, consider
downloading and self-hosting them (or swapping in your own photography) for
reliability and faster load times.
