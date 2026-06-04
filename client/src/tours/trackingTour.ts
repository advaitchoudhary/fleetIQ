/* Tour for the Live Tracking page (Tracking.tsx → route /tracking). */

export const TRACKING_TOUR_KEY = "tracking";

export const trackingSteps = [
  {
    id: "welcome",
    title: "Live Tracking",
    text: "See where every vehicle is right now, and replay any past trip. The map refreshes every 30 seconds automatically.",
  },
  {
    id: "vehicle-list",
    title: "Vehicle list",
    text: "Every vehicle in your fleet, with a live status dot — green is an active trip in progress. Click any vehicle to focus the map and pull up its trip history.",
    attachTo: { element: '[data-tour="tracking-sidebar"]', on: "right" as const },
    skipIf: () => !document.querySelector('[data-tour="tracking-sidebar"]'),
  },
  {
    id: "map",
    title: "Live map",
    text: "Each pin is one vehicle. Click a pin to see the driver, speed, and last update time. The map auto-refreshes every 30s — no need to reload.",
    attachTo: { element: '[data-tour="tracking-map"]', on: "left" as const },
    skipIf: () => !document.querySelector('[data-tour="tracking-map"]'),
  },
  {
    id: "trip-history",
    title: "Replay past trips",
    text: "When you select a vehicle in the list, its 20 most recent trips appear below. Click any trip to draw its route on the map.",
    attachTo: { element: '[data-tour="tracking-sidebar"]', on: "right" as const },
    skipIf: () => !document.querySelector('[data-tour="tracking-sidebar"]'),
  },
];
