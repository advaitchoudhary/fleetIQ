/* Tour for the All Timesheets page (AllTimesheets.tsx → route /applications). */

export const TIMESHEETS_TOUR_KEY = "timesheets";

export const timesheetsSteps = [
  {
    id: "welcome",
    title: "Timesheet Review",
    text: "All driver timesheets land here for review and approval. Short tour to show you the controls.",
  },
  {
    id: "actions",
    title: "Export & bulk approve",
    text: "Export the visible (filtered) list to Excel, or approve every selected row at once. Use bulk approve at the end of a pay period to clear the queue quickly.",
    attachTo: { element: '[data-tour="timesheets-actions"]', on: "bottom" as const },
    skipIf: () => !document.querySelector('[data-tour="timesheets-actions"]'),
  },
  {
    id: "filters",
    title: "Narrow the list",
    text: "Filter by driver, date range, or status (Pending / Approved / Rejected). Use Custom Range when you need a non-standard pay window.",
    attachTo: { element: '[data-tour="timesheets-filters"]', on: "bottom" as const },
    skipIf: () => !document.querySelector('[data-tour="timesheets-filters"]'),
  },
  {
    id: "table",
    title: "Approve or open a timesheet",
    text: "Tick the checkbox on rows you want to bulk-approve. Click any row to open the detailed view — hours, breakdown, attachments, and approval history.",
    attachTo: { element: '[data-tour="timesheets-table"]', on: "top" as const },
    skipIf: () => !document.querySelector('[data-tour="timesheets-table"]'),
  },
];
