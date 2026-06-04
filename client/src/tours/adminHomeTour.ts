/* Tour key & step config for the admin landing page (AdminHome.tsx).
   Targets elements via data-tour="..." attributes — keep those in sync if you refactor. */

export const ADMIN_HOME_TOUR_KEY = "adminHome";

export const adminHomeSteps = [
  {
    id: "welcome",
    title: "Welcome to FleetIQ",
    text: "Quick 30-second walkthrough so you know what each part of the dashboard does. You can skip anytime.",
  },
  {
    id: "stats",
    title: "Your fleet at a glance",
    text: "These cards summarize what's happening across your fleet right now — vehicles, drivers, and active jobs. They refresh on every visit.",
    attachTo: { element: '[data-tour="stats-row"]', on: "bottom" as const },
    skipIf: () => !document.querySelector('[data-tour="stats-row"]'),
  },
  {
    id: "compliance-banner",
    title: "Set up your compliance requirements",
    text: "Start here — define the documents and trainings every driver in your org must upload. This turns on the compliance flow for the rest of the app.",
    attachTo: { element: '[data-tour="compliance-banner"]', on: "bottom" as const },
    skipIf: () => !document.querySelector('[data-tour="compliance-banner"]'),
  },
  {
    id: "feature-sections",
    title: "Your modules",
    text: "Driver Management and Vehicle Operations are grouped here. Each card opens a full module — drivers, timesheets, vehicles, maintenance, and more.",
    attachTo: { element: '[data-tour="feature-sections"]', on: "top" as const },
    skipIf: () => !document.querySelector('[data-tour="feature-sections"]'),
  },
  {
    id: "sidebar",
    title: "Quick navigation",
    text: "Every module is also one click away in this sidebar. The first time you open a module, you'll get a short walkthrough for that area too.",
    attachTo: { element: '[data-tour="sidebar"]', on: "right" as const },
    skipIf: () => !document.querySelector('[data-tour="sidebar"]'),
  },
];
