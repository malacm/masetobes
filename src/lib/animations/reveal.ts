/**
 * Reveal animations for the work index, project pages and personal gallery.
 *
 * The site's motion language is blur — nav pills blur on hover, the theme
 * transition blurs the icon through the swap, work cards blur behind a frosted
 * panel. These reveals use the same vocabulary: content arrives slightly low,
 * out of focus and transparent, then resolves.
 *
 * Two behaviours, chosen per element automatically:
 *   • already on screen at mount → a staggered entrance plays once on load
 *   • below the fold            → the same motion, scrubbed to scroll position
 *     as the element travels up through the viewport, so scrolling back up
 *     runs it in reverse
 *
 * Text uses `motion: 'blur'`; imagery uses the default `'scale'`, which grows
 * and fades in without a per-frame blur.
 *
 * Exposed as Svelte actions so a page just marks the element up:
 *   <div use:revealItems>              — animates the element's children
 *   <div use:reveal>                   — animates the element itself
 *   <div use:driftOnScroll>            — pushes an element away as it exits
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

function ensurePlugin(): boolean {
	if (typeof window === 'undefined') return false;
	if (!registered) {
		gsap.registerPlugin(ScrollTrigger);
		registered = true;
	}
	return true;
}

/* Two flavours of the same arrival.
   `blur`  — for text: defocused to sharp, matching the site's hover language.
   `scale` — for images: slightly small and transparent, growing to full size.
             No blur here on purpose. A scrub repaints every frame you scroll,
             and blurring a full-bleed photo each frame is the one thing that
             actually drops frames on a phone.
   Mobile gets a shorter throw of the same move. Matches the 768px breakpoint. */
const MOTION = {
	blur: {
		desktop: { y: 48, blur: 14, scale: 1 },
		mobile: { y: 22, blur: 7, scale: 1 }
	},
	scale: {
		desktop: { y: 32, blur: 0, scale: 0.94 },
		mobile: { y: 16, blur: 0, scale: 0.96 }
	}
};

/* The scrub window, in viewport terms: the item starts resolving the moment its
   top edge enters from the bottom, and is fully resolved once that edge has
   travelled up to 35% — by which point the item fills most of the screen, so
   the whole move happens in front of the reader. Scrolling back up runs it in
   reverse, because scrub binds progress to scroll position rather than firing
   a one-shot tween. */
const SCRUB_START = 'top bottom';
const SCRUB_END = 'top 35%';

/* One of isMobile/isDesktop always matches, so the callback always runs; GSAP
   re-runs it (reverting the old styles first) when the breakpoint or the
   reduced-motion preference changes. */
const CONDITIONS = {
	isMobile: '(max-width: 768px)',
	isDesktop: '(min-width: 769px)',
	reduce: '(prefers-reduced-motion: reduce)'
};

type MotionStyle = keyof typeof MOTION;

type RevealOptions = {
	/** Children to animate. `null` animates the node itself. */
	selector?: string | null;
	/** Seconds between each on-load item. */
	stagger?: number;
	/** Seconds before the on-load entrance starts. */
	delay?: number;
	/** `scale` for imagery (default), `blur` for text. */
	motion?: MotionStyle;
	/**
	 * How many leading items always belong to the on-load arrival, whatever the
	 * measurement says. The opening image is part of the page's first
	 * impression, so it reveals once and then stays put — it never hands off to
	 * the scrub, even when a long header pushes it below the fold.
	 */
	eager?: number;
};

type Cleanup = { destroy(): void };

const NOOP: Cleanup = { destroy() {} };

function applyReveal(node: HTMLElement, options: RevealOptions): Cleanup {
	if (!ensurePlugin()) return NOOP;

	const {
		selector = ':scope > *',
		stagger = 0.08,
		delay = 0,
		motion = 'scale',
		eager = 0
	} = options;
	const items =
		selector === null
			? [node]
			: Array.from(node.querySelectorAll<HTMLElement>(selector));
	if (items.length === 0) return NOOP;

	// Gallery images have no intrinsic height until they load, so every trigger
	// below one is measured against the wrong layout. Recompute as they arrive.
	const pending = Array.from(node.querySelectorAll('img')).filter((img) => !img.complete);
	const refresh = () => ScrollTrigger.refresh();
	for (const img of pending) {
		img.addEventListener('load', refresh, { once: true });
		img.addEventListener('error', refresh, { once: true });
	}

	const mm = gsap.matchMedia();

	mm.add(CONDITIONS, (context) => {
		// Reduced motion still gets the content, just without the movement.
		if (context.conditions?.reduce) return;

		const preset = MOTION[motion];
		const { y, blur, scale } = context.conditions?.isMobile ? preset.mobile : preset.desktop;

		// Only introduce a filter when there's actually a blur to animate —
		// an always-on filter forces its own compositing layer for nothing.
		const from = {
			y,
			scale,
			autoAlpha: 0,
			...(blur ? { filter: `blur(${blur}px)` } : {})
		};
		const to = {
			y: 0,
			scale: 1,
			autoAlpha: 1,
			...(blur ? { filter: 'blur(0px)' } : {})
		};

		// This callback also re-runs when the breakpoint changes, which can
		// happen deep in the page — only play the entrance from the top, so a
		// phone rotating mid-scroll doesn't replay it.
		const atTop = window.scrollY < 4;
		// Anything sharing the first screen belongs to the arrival, so it plays
		// on load alongside the header rather than waiting to be scrolled into.
		// (Safe now that images reserve their box — before that, unloaded items
		// all measured near zero and wrongly landed here.)
		const fold = window.innerHeight;
		let onLoadIndex = 0;

		for (const [index, item] of items.entries()) {
			const alwaysOnLoad = index < eager;

			// Re-runs (a resize crossing the breakpoint) shouldn't replay an
			// entrance the reader has already scrolled past — just restore the
			// resting state.
			if (alwaysOnLoad && !atTop) {
				gsap.set(item, to);
				continue;
			}

			if (alwaysOnLoad || (atTop && item.getBoundingClientRect().top < fold)) {
				gsap.fromTo(item, from, {
					...to,
					duration: 0.9,
					ease: 'power3.out',
					delay: delay + onLoadIndex * stagger
				});
				onLoadIndex += 1;
			} else {
				gsap.fromTo(item, from, {
					...to,
					ease: 'none',
					scrollTrigger: {
						trigger: item,
						start: SCRUB_START,
						end: SCRUB_END,
						// Bound to scroll position, so scrolling back up plays it
						// backwards. The number is just easing on the follow.
						scrub: 0.5
					}
				});
			}
		}
	});

	return {
		destroy() {
			// Reverts every tween and ScrollTrigger created inside the context
			// and restores the original inline styles.
			mm.revert();
			for (const img of pending) {
				img.removeEventListener('load', refresh);
				img.removeEventListener('error', refresh);
			}
		}
	};
}

/** Reveal each child of the node. */
export function revealItems(node: HTMLElement, options: RevealOptions = {}): Cleanup {
	return applyReveal(node, options);
}

/** Reveal the node itself. */
export function reveal(node: HTMLElement, options: RevealOptions = {}): Cleanup {
	return applyReveal(node, { ...options, selector: null });
}

/**
 * Fires once when the element reaches the viewport, rather than tracking scroll
 * position. Used for blocks that close the page off — credits, prev/next —
 * which should arrive as a single gesture the way the header does, not resolve
 * gradually. Scrolling back above them reverses it.
 */
export function revealOnEnter(node: HTMLElement, options: RevealOptions = {}): Cleanup {
	if (!ensurePlugin()) return NOOP;

	const { motion = 'blur' } = options;
	const mm = gsap.matchMedia();

	mm.add(CONDITIONS, (context) => {
		if (context.conditions?.reduce) return;

		const preset = MOTION[motion];
		const { y, blur, scale } = context.conditions?.isMobile ? preset.mobile : preset.desktop;

		gsap.fromTo(
			node,
			{ y, scale, autoAlpha: 0, ...(blur ? { filter: `blur(${blur}px)` } : {}) },
			{
				y: 0,
				scale: 1,
				autoAlpha: 1,
				...(blur ? { filter: 'blur(0px)' } : {}),
				duration: 0.9,
				ease: 'power3.out',
				scrollTrigger: {
					trigger: node,
					start: 'top 85%',
					toggleActions: 'play none none reverse'
				}
			}
		);
	});

	return {
		destroy() {
			mm.revert();
		}
	};
}

/**
 * Page-tied scrub: as the element scrolls out of the top of the viewport it
 * drifts up and defocuses, so the header hands off to the gallery rather than
 * just sliding away.
 */
export function driftOnScroll(node: HTMLElement): Cleanup {
	if (!ensurePlugin()) return NOOP;

	const mm = gsap.matchMedia();

	mm.add(CONDITIONS, (context) => {
		if (context.conditions?.reduce) return;

		const { y, blur } = context.conditions?.isMobile
			? MOTION.blur.mobile
			: MOTION.blur.desktop;
		gsap.to(node, {
			y: -y,
			autoAlpha: 0.15,
			filter: `blur(${Math.round(blur * 0.6)}px)`,
			ease: 'none',
			scrollTrigger: { trigger: node, start: 'top top', end: 'bottom top', scrub: 0.5 }
		});
	});

	return {
		destroy() {
			mm.revert();
		}
	};
}
