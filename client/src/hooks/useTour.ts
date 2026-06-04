import { useCallback, useEffect, useRef } from "react";
import Shepherd, { type Tour } from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import { useAuth } from "../contexts/AuthContext";
import "../tours/shepherd-theme.css";

type StepInput = {
  id: string;
  title?: string;
  text: string;
  attachTo?: { element: string; on: "top" | "bottom" | "left" | "right" | "auto" };
  /** If true, skip this step (e.g. selector not on page). Evaluated at startTour() time. */
  skipIf?: () => boolean;
};

type TourOptions = {
  /** Stable key persisted to user.tourState — same key prevents re-runs. */
  tourKey: string;
  steps: StepInput[];
  /** If true, auto-start when the hook mounts (and the tour hasn't been seen). */
  autoStart?: boolean;
  /** Optional delay before auto-start, to let target elements mount. Default: 350ms. */
  autoStartDelayMs?: number;
};

/**
 * Hook for showing first-time tours.
 *
 * Persists "completed" or "skipped" per tourKey on the server (and via AuthContext
 * to localStorage), so the tour never replays once dismissed.
 *
 * Targets elements via CSS selectors — prefer data-tour="..." attributes
 * on the target page so layout/style refactors don't silently break tours.
 */
export function useTour({ tourKey, steps, autoStart = true, autoStartDelayMs = 350 }: TourOptions) {
  const { user, setTourState } = useAuth();
  const tourRef = useRef<Tour | null>(null);
  // True while we're closing a tour programmatically (restart, unmount, route change).
  // Distinguishes user-initiated complete/cancel from internal teardown so we don't
  // persist "completed" when the user never actually finished the tour.
  const tearingDownRef = useRef(false);

  const hasSeen = !!user?.tourState?.[tourKey];

  const startTour = useCallback(() => {
    if (tourRef.current) {
      tearingDownRef.current = true;
      tourRef.current.complete();
      tearingDownRef.current = false;
      tourRef.current = null;
    }

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: "fleetiq-tour-step",
        scrollTo: { behavior: "smooth", block: "center" },
        cancelIcon: { enabled: true },
        modalOverlayOpeningPadding: 6,
        modalOverlayOpeningRadius: 10,
      },
    });

    const visibleSteps = steps.filter((s) => !s.skipIf || !s.skipIf());

    visibleSteps.forEach((step, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === visibleSteps.length - 1;
      tour.addStep({
        id: step.id,
        title: step.title,
        text: step.text,
        attachTo: step.attachTo,
        buttons: [
          ...(isFirst
            ? [{ text: "Skip", action: () => tour.cancel(), classes: "shepherd-button-secondary" }]
            : [{ text: "Back", action: () => tour.back(), classes: "shepherd-button-secondary" }]),
          {
            text: isLast ? "Done" : "Next",
            action: () => (isLast ? tour.complete() : tour.next()),
            classes: "shepherd-button-primary",
          },
        ],
      });
    });

    tour.on("complete", () => {
      if (tearingDownRef.current) return;
      void setTourState(tourKey, "completed");
      tourRef.current = null;
    });
    tour.on("cancel", () => {
      if (tearingDownRef.current) return;
      void setTourState(tourKey, "skipped");
      tourRef.current = null;
    });

    tourRef.current = tour;
    tour.start();
  }, [tourKey, steps, setTourState]);

  useEffect(() => {
    if (!autoStart) return;
    if (hasSeen) return;
    if (!user) return;
    const t = window.setTimeout(startTour, autoStartDelayMs);
    return () => window.clearTimeout(t);
  }, [autoStart, hasSeen, user, autoStartDelayMs, startTour]);

  // Clean up any in-flight tour on unmount so it doesn't outlive the page.
  // Uses the tearingDown flag so navigating away mid-tour doesn't get persisted as "completed".
  useEffect(() => {
    return () => {
      if (tourRef.current) {
        tearingDownRef.current = true;
        tourRef.current.complete();
        tearingDownRef.current = false;
        tourRef.current = null;
      }
    };
  }, []);

  return { startTour, hasSeen };
}
