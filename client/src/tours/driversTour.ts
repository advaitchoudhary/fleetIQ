/* Tour for the Drivers list page (Drivers.tsx → route /users).
   Selectors must match data-tour attrs on the page. */

export const DRIVERS_TOUR_KEY = "drivers";

export const driversSteps = [
  {
    id: "welcome",
    title: "Driver Management",
    text: "Everything about your drivers — onboarding, compliance, and rates — lives on this page. Quick 20-second walkthrough.",
  },
  {
    id: "actions",
    title: "Add or export drivers",
    text: "Use these buttons to onboard a new driver or export the current filtered list to Excel for offline review.",
    attachTo: { element: '[data-tour="drivers-actions"]', on: "bottom" as const },
    skipIf: () => !document.querySelector('[data-tour="drivers-actions"]'),
  },
  {
    id: "search",
    title: "Search & sort",
    text: "Filter by name, email, or badge ID. Sort by active hours to find your busiest (or under-utilized) drivers.",
    attachTo: { element: '[data-tour="drivers-search"]', on: "bottom" as const },
    skipIf: () => !document.querySelector('[data-tour="drivers-search"]'),
  },
  {
    id: "table",
    title: "Driver list",
    text: "Click any driver to view their full profile — license, work authorization, training proofs, and bank details.",
    attachTo: { element: '[data-tour="drivers-table"]', on: "top" as const },
    skipIf: () => !document.querySelector('[data-tour="drivers-table"]'),
  },
];
