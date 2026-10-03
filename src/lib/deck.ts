import { prefersReducedMotion, transitionSlide } from "./motion.ts";

/**
 * Wires deck navigation: prev/next buttons, `#slide-*` links, arrow/Home/End
 * keys, scroll sync, and the Spanish live counter.
 * Space on an interactive element is left alone so native activation
 * (e.g. the theme switch) happens instead of advancing the slide.
 * Reduced-motion behavior: slide changes jump instantly (via transitionSlide).
 * Returns a cleanup that removes every listener added here.
 */
export function initDeck(root: ParentNode = document): () => void {
  const slides = Array.from(root.querySelectorAll<HTMLElement>("[data-slide]"));
  const count = root.querySelector("#deck-count");
  const countSr = root.querySelector("#deck-count-sr");
  const prevBtn = root.querySelector("#deck-prev");
  const nextBtn = root.querySelector("#deck-next");
  let currentIndex = 0;
  let navigating = false;

  const controller = new AbortController();
  const { signal } = controller;

  function updateCount() {
    if (count) count.textContent = `${currentIndex + 1} / ${slides.length}`;
    if (countSr)
      countSr.textContent = `Diapositiva ${currentIndex + 1} de ${slides.length}`;
    if (prevBtn) prevBtn.toggleAttribute("disabled", currentIndex === 0);
    if (nextBtn)
      nextBtn.toggleAttribute("disabled", currentIndex === slides.length - 1);
  }

  function currentClosestIndex() {
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    const mid = window.innerHeight / 2;
    slides.forEach((slide, i) => {
      const rect = slide.getBoundingClientRect();
      const dist = Math.abs(rect.top + rect.height / 2 - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  }

  async function goTo(index: number, direction?: "forward" | "backward") {
    if (
      navigating ||
      index < 0 ||
      index >= slides.length ||
      index === currentIndex
    ) {
      currentIndex = currentClosestIndex();
      updateCount();
      return;
    }
    navigating = true;
    const prev = slides[currentIndex];
    const next = slides[index];
    const dir = direction ?? (index > currentIndex ? "forward" : "backward");
    currentIndex = index;

    if (prefersReducedMotion()) {
      next.scrollIntoView({ behavior: "auto", block: "start" });
    } else {
      next.scrollIntoView({ behavior: "smooth", block: "start" });
      await transitionSlide(prev, next, dir);
    }

    const heading = next.querySelector("h1, h2");
    if (heading instanceof HTMLElement) heading.focus({ preventScroll: true });

    updateCount();
    navigating = false;
  }

  prevBtn?.addEventListener("click", () => void goTo(currentIndex - 1, "backward"), {
    signal,
  });
  nextBtn?.addEventListener(
    "click",
    () => void goTo(currentIndex + 1, "forward"),
    { signal },
  );

  root
    .querySelectorAll<HTMLAnchorElement>("a[href^='#slide-']")
    .forEach((link) => {
      link.addEventListener(
        "click",
        (event) => {
          const id = link.getAttribute("href")?.slice(1);
          const target = id ? root.querySelector(`#${CSS.escape(id)}`) : null;
          if (!target) return;
          event.preventDefault();
          const index = slides.indexOf(target as HTMLElement);
          void goTo(index);
        },
        { signal },
      );
    });

  window.addEventListener(
    "scroll",
    () => {
      if (!navigating) {
        currentIndex = currentClosestIndex();
        updateCount();
      }
    },
    { passive: true, signal },
  );

  window.addEventListener(
    "keydown",
    (event) => {
      if (event.key === " ") {
        const target = event.target;
        if (
          target instanceof HTMLElement &&
          target.closest(
            "input, button, a, select, textarea, [contenteditable]",
          )
        ) {
          return;
        }
        event.preventDefault();
        void goTo(currentIndex + 1, "forward");
      } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        void goTo(currentIndex + 1, "forward");
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        void goTo(currentIndex - 1, "backward");
      } else if (event.key === "Home") {
        event.preventDefault();
        void goTo(0, "backward");
      } else if (event.key === "End") {
        event.preventDefault();
        void goTo(slides.length - 1, "forward");
      }
    },
    { signal },
  );

  // Deep links: opening /#slide-<id> lands on that slide via the native
  // anchor jump; sync the counter to it instead of leaving it at 1 / N.
  const hash =
    typeof window !== "undefined" && typeof window.location !== "undefined"
      ? window.location.hash
      : "";
  if (hash.startsWith("#slide-")) {
    try {
      const target = root.querySelector(hash);
      if (target) {
        const index = slides.indexOf(target as HTMLElement);
        if (index >= 0) currentIndex = index;
      } else {
        currentIndex = currentClosestIndex();
      }
    } catch {
      currentIndex = currentClosestIndex();
    }
  }
  updateCount();

  return () => controller.abort();
}
