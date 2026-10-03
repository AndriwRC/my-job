import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export type SlideDirection = "forward" | "backward";

let registered = false;

function ensureRegistered(): void {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animate a directional slide transition.
 * Uses `from`-style enter so no-JS / failure leaves content visible.
 * Resolves instantly when reduced motion is preferred.
 */
export function transitionSlide(
  current: HTMLElement | null,
  next: HTMLElement,
  direction: SlideDirection = "forward",
): Promise<void> {
  ensureRegistered();

  if (prefersReducedMotion()) {
    if (current) {
      current.classList.remove("is-active");
      current.setAttribute("aria-hidden", "true");
    }
    next.classList.add("is-active");
    next.removeAttribute("aria-hidden");
    return Promise.resolve();
  }

  const enterX = direction === "forward" ? 60 : -60;

  return new Promise((resolve) => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { duration: 0.4, ease: "power2.out", overwrite: true },
        onComplete: () => {
          ctx.revert();
          resolve();
        },
      });

      if (current && current !== next) {
        tl.to(current, {
          x: direction === "forward" ? -60 : 60,
          opacity: 0,
          duration: 0.25,
        });
      }

      tl.fromTo(
        next,
        { x: enterX, opacity: 0 },
        { x: 0, opacity: 1 },
        current && current !== next ? "-=0.05" : 0,
      );
    });
  });
}

/**
 * Wire once-only fade+rise reveals for `[data-reveal]` elements.
 * Returns a cleanup function. Content stays visible if JS fails
 * because initial state is only applied inside GSAP `from()` tweens.
 */
export function initReveals(
  scope: ParentNode = document,
): () => void {
  ensureRegistered();

  if (prefersReducedMotion()) {
    return () => {};
  }

  const ctx = gsap.context(() => {
    const targets = gsap.utils.toArray<HTMLElement>("[data-reveal]", scope as never);
    targets.forEach((el) => {
      const delay = Number(el.dataset.revealDelay ?? 0) || 0;
      gsap.from(el, {
        y: 24,
        opacity: 0,
        duration: 0.5,
        delay: Math.min(Math.max(delay, 0), 2),
        ease: "power2.out",
        overwrite: true,
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          once: true,
        },
      });
    });
  }, scope as never);

  return () => ctx.revert();
}
