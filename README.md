# Wall Calendar Challenge

An interactive wall-calendar concept built with Next.js, TypeScript, and CSS Modules. The layout is inspired by a printed hanging calendar, with a hero image, responsive month grid, date-range selection, and notes panels that persist in `localStorage`.

## Features

- Responsive wall-calendar layout with a physical paper and hanger treatment
- Start/end date range selection with visible in-range states
- Month notes and selected-range notes
- Client-side persistence with `localStorage`
- Month navigation and lightweight visual polish

## Run locally

1. Install dependencies:

```bash
npm install
```

If PowerShell blocks `npm`, use:

```bash
npm.cmd install
```

2. Start the development server:

```bash
npm run dev
```

3. Open `http://localhost:3000`

## Implementation notes

- The app uses the Next.js App Router.
- The calendar grid renders a fixed 6-week view starting on Monday.
- First click selects a start date, second click selects an end date, and a third click starts a new range.
- Notes are stored by month key and by selected range key in the browser.

## Suggested demo walkthrough

- Show the desktop layout and the wall-calendar styling
- Select a date range across the month grid
- Add a month note and a range-specific note
- Refresh to demonstrate `localStorage` persistence
- Resize to a mobile viewport and show touch-friendly usability
