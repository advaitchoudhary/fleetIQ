/* Tour for the Vehicles list page (Vehicles.tsx → route /vehicles). */

export const VEHICLES_TOUR_KEY = "vehicles";

export const vehiclesSteps = [
  {
    id: "welcome",
    title: "Vehicle Management",
    text: "Your full fleet registry — VINs, plates, insurance, and operational status. Short 25-second tour.",
  },
  {
    id: "actions",
    title: "Add or export your fleet",
    text: "Register a new vehicle, or export the current filtered list to Excel for offline review or reporting.",
    attachTo: { element: '[data-tour="vehicles-actions"]', on: "bottom" as const },
    skipIf: () => !document.querySelector('[data-tour="vehicles-actions"]'),
  },
  {
    id: "stats",
    title: "Fleet status at a glance",
    text: "These tiles show how many vehicles are active, in maintenance, or out of service right now.",
    attachTo: { element: '[data-tour="vehicles-stats"]', on: "bottom" as const },
    skipIf: () => !document.querySelector('[data-tour="vehicles-stats"]'),
  },
  {
    id: "search",
    title: "Find vehicles fast",
    text: "Search by unit number, make, model, or plate. Useful when the fleet grows beyond a single page.",
    attachTo: { element: '[data-tour="vehicles-search"]', on: "bottom" as const },
    skipIf: () => !document.querySelector('[data-tour="vehicles-search"]'),
  },
  {
    id: "list",
    title: "Vehicle list",
    text: "Click a vehicle row to edit details, change status, or assign a driver. Each vehicle is one click away from its maintenance and tracking history.",
    attachTo: { element: '[data-tour="vehicles-list"]', on: "top" as const },
    skipIf: () => !document.querySelector('[data-tour="vehicles-list"]'),
  },
];
