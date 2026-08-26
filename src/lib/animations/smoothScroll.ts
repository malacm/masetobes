/**
 * Site-wide smooth scrolling.
 *
 * Lenis intercepts the wheel and animates the scroll position itself, so the
 * page carries momentum and settles rather than stepping. This is the only
 * scroll-related behaviour on the site — it smooths *the scroll*, it does not
 * animate content in response to scrolling, which is the thing the client asked
 * to remove.
 *
 * Two deliberate restraints:
 *
 * • Touch is left native (`syncTouch: false`, Lenis's default). Smoothing touch
 *   puts a lag between the finger and the page, which reads as broken on a
 *   phone in a way it never does with a wheel.
 * • It does not run under `prefers-reduced-motion`, where hijacking the scroll
 *   is exactly what the preference is asking you not to do.
 *
 * Scoped to the `(site)` layout, so the Sanity Studio at /studio keeps its own
 * native scrolling.
 */
import Lenis from 'lenis';

/**
 * How hard the page chases the scroll position each frame, 0–1. Lower glides
 * longer. Lenis ships 0.1; 0.08 is the slightly heavier weight Mason settled on.
 * Frame-rate independent — Lenis normalises it against elapsed time.
 *
 * For reference, measured on a 1000px glide: 0.08 reaches 90% in 0.50s,
 * 0.10 in 0.42s, 0.15 in 0.28s.
 */
const LERP = 0.08;

export type SmoothScroll = {
	/** Re-measure after the document height changes. */
	resize(): void;
	/** Jump to the top with no animation — used behind the navigation veil. */
	toTop(): void;
	destroy(): void;
};

export function startSmoothScroll(): SmoothScroll | null {
	if (typeof window === 'undefined') return null;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

	const lenis = new Lenis({
		lerp: LERP,
		smoothWheel: true,
		// Lenis watches the content box and re-measures itself. This matters
		// here: gallery images load late, and a stale scroll limit is what makes
		// the wheel feel like it is catching on something.
		autoResize: true
	});

	// One loop, created once. A second rAF loop driving the same instance is a
	// classic source of stutter — each would advance the tween by its own delta.
	let frame = requestAnimationFrame(function raf(time: number) {
		lenis.raf(time);
		frame = requestAnimationFrame(raf);
	});

	return {
		resize: () => lenis.resize(),
		// `immediate` skips the animation: the reader should never watch the page
		// scroll itself back to the top after a navigation.
		toTop: () => lenis.scrollTo(0, { immediate: true }),
		destroy: () => {
			cancelAnimationFrame(frame);
			lenis.destroy();
		}
	};
}
