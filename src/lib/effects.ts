import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { CustomEase } from "gsap/CustomEase";
import { CustomWiggle } from "gsap/CustomWiggle";
import { CustomBounce } from "gsap/CustomBounce";
import { prefersReducedMotion } from "./motion.ts";

let registered = false;

function ensureRegistered(): void {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(
    ScrollTrigger,
    SplitText,
    ScrambleTextPlugin,
    Physics2DPlugin,
    CustomEase,
    CustomWiggle,
    CustomBounce,
  );
  CustomWiggle.create("brutal-wiggle", { wiggles: 6, type: "easeOut" });
  CustomBounce.create("brutal-bounce", { strength: 0.7 });
  registered = true;
}

// Contexts for imperative (demo) tweens, so HMR dispose can revert them.
const demoContexts = new Set<gsap.Context>();

function trackDemo(ctx: gsap.Context): gsap.Context {
  demoContexts.add(ctx);
  return ctx;
}

function cleanupDemos(): void {
  demoContexts.forEach((ctx) => ctx.revert());
  demoContexts.clear();
  if (confettiLayer) {
    confettiLayer.remove();
    confettiLayer = null;
  }
  liveParticles = 0;
}

function whenFontsReady(run: () => void): void {
  try {
    const ready = (
      document as Document & { fonts?: { ready?: Promise<unknown> } }
    ).fonts?.ready;
    if (ready && typeof ready.then === "function") {
      void ready.then(run, run);
      return;
    }
  } catch {
    // Fall through to running immediately.
  }
  run();
}

function scrollOnce(trigger: HTMLElement) {
  return { trigger, start: "top 80%", once: true } as const;
}

function playSplitBounce(el: HTMLElement): void {
  const split = SplitText.create(el, { type: "chars", aria: "auto" });
  gsap.from(split.chars, {
    y: -40,
    opacity: 0,
    stagger: 0.03,
    duration: 0.6,
    ease: "back.out(2)",
    onComplete: () => split.revert(),
  });
}

function wireFx(el: HTMLElement): void {
  const fx = el.dataset.fx;
  if (!fx) return;

  if (fx === "split-bounce") {
    ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => whenFontsReady(() => playSplitBounce(el)),
    });
    return;
  }

  if (fx === "strike") {
    gsap.from(el, {
      scaleX: 0,
      transformOrigin: "left center",
      duration: 0.5,
      ease: "power2.out",
      scrollTrigger: scrollOnce(el),
    });
    return;
  }

  if (fx === "pop") {
    const kids = Array.from(el.children) as HTMLElement[];
    if (kids.length === 0) return;
    const stagger = Number(el.dataset.fxStagger ?? 0.08) || 0.08;
    gsap.from(kids, {
      scale: 0,
      opacity: 0,
      stagger: Math.min(Math.max(stagger, 0), 1),
      duration: 0.4,
      ease: "back.out(3)",
      scrollTrigger: scrollOnce(el),
    });
    return;
  }

  if (fx === "wiggle") {
    gsap.fromTo(
      el,
      { rotation: -8 },
      {
        rotation: 0,
        duration: 0.6,
        ease: "brutal-wiggle",
        scrollTrigger: scrollOnce(el),
      },
    );
    return;
  }

  if (fx === "count-up") {
    const target = Number(el.dataset.fxTo ?? 0) || 0;
    const match = (el.textContent ?? "").match(/^(\d+)(.*)$/);
    const suffix = match ? match[2] : "%";
    const state = { v: 0 };
    gsap.to(state, {
      v: target,
      duration: 1.2,
      ease: "power1.out",
      scrollTrigger: scrollOnce(el),
      onUpdate: () => {
        const n = Math.round(state.v);
        el.textContent = `${n}${suffix}`;
        if (el.classList.contains("radial-progress")) {
          el.style.setProperty("--value", String(n));
        }
      },
    });
  }
}

/**
 * Wires every `[data-fx]` one-shot effect (split-bounce, strike, pop,
 * wiggle, count-up) to play once on first entry via ScrollTrigger.
 * Reduced-motion behavior: no triggers are created; the final markup
 * states stay visible as-is.
 * Returns a cleanup that reverts triggers and any in-flight demo tweens.
 */
export function initEffects(root: ParentNode = document): () => void {
  ensureRegistered();
  if (prefersReducedMotion()) return () => {};

  const ctx = gsap.context(() => {
    const targets = gsap.utils.toArray<HTMLElement>(
      "[data-fx]",
      root as never,
    );
    targets.forEach((el) => wireFx(el));
  }, root as never);

  return () => {
    ctx.revert();
    cleanupDemos();
  };
}

/**
 * Scrambles `el` into `text`, settling within ~1.4s. Replayable.
 * Reduced-motion behavior: sets the final text instantly, no scramble.
 */
export function scrambleTo(el: HTMLElement, text: string): void {
  ensureRegistered();
  if (prefersReducedMotion()) {
    el.textContent = text;
    return;
  }
  trackDemo(
    gsap.context(() => {
      gsap.to(el, {
        duration: 1.4,
        ease: "none",
        scrambleText: {
          text,
          chars: "upperAndLowerCase",
          speed: 0.6,
          revealDelay: 0.3,
        },
      });
    }),
  );
}

/**
 * Plays a short rotation wiggle on `el` (0.6s, settles at rest).
 * Reduced-motion behavior: no-op, the element stays static.
 */
export function wiggle(el: HTMLElement): void {
  ensureRegistered();
  if (prefersReducedMotion()) return;
  trackDemo(
    gsap.context(() => {
      gsap.fromTo(
        el,
        { rotation: -8 },
        { rotation: 0, duration: 0.6, ease: "brutal-wiggle" },
      );
    }),
  );
}

let confettiLayer: HTMLDivElement | null = null;
let liveParticles = 0;

// Celebration glyphs as escapes, so the raw-emoji grep only ever matches
// the <Emoji> component in markup.
const CONFETTI_GLYPHS = [
  String.fromCodePoint(0x1f389),
  String.fromCodePoint(0x2728),
  String.fromCodePoint(0x1f38a),
  String.fromCodePoint(0x2b50),
  String.fromCodePoint(0x1fa5),
];

/**
 * Bursts 36 emoji particles from `origin` (viewport center by default).
 * Particles fall with physics, fade in the last 30%, live at most 2.2s,
 * and are removed on complete; at most 120 are ever alive at once.
 * The layer is fixed, `pointer-events-none`, and `aria-hidden`, so
 * controls underneath stay clickable and silent.
 * Reduced-motion behavior: returns false without animating, so the caller
 * can show a static celebration marker instead.
 */
export function confetti(origin?: { x: number; y: number }): boolean {
  ensureRegistered();
  if (prefersReducedMotion()) return false;
  if (typeof document === "undefined") return true;
  if (liveParticles >= 120) return true;

  if (!confettiLayer) {
    confettiLayer = document.createElement("div");
    confettiLayer.setAttribute("aria-hidden", "true");
    confettiLayer.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden;";
    document.body.appendChild(confettiLayer);
  }

  const layer = confettiLayer;
  const count = Math.min(36, 120 - liveParticles);
  const ox = origin?.x ?? window.innerWidth / 2;
  const oy = origin?.y ?? window.innerHeight * 0.35;

  const ctx = gsap.context(() => {
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      span.textContent = CONFETTI_GLYPHS[i % CONFETTI_GLYPHS.length];
      span.style.cssText = `position:absolute;left:${ox}px;top:${oy}px;pointer-events:none;font-size:${20 + Math.random() * 16}px;`;
      layer.appendChild(span);
      liveParticles++;
      gsap.to(span, {
        duration: 2.2,
        ease: "none",
        physics2D: {
          velocity: 450 + Math.random() * 300,
          angle: -120 + Math.random() * 60,
          gravity: 900,
        },
        onComplete: () => {
          span.remove();
          liveParticles--;
          if (liveParticles <= 0) demoContexts.delete(ctx);
        },
      });
      gsap.to(span, {
        opacity: 0,
        duration: 0.66,
        delay: 1.54,
        ease: "power1.in",
      });
    }
  });
  trackDemo(ctx);
  return true;
}
