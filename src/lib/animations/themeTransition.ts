/**
 * GSAP-driven animations for the homepage icon pulse + theme transitions.
 *
 * Pulse — a continuous, low-key blur+scale loop on the homepage central icon.
 * Mounted by HomepageIcon.svelte while it's in the DOM.
 *
 * Theme transition — when the user clicks any ThemeToggle, this orchestrates:
 *   1. The icon changes shape. When the inline morph path is available the two
 *      marks genuinely morph into one another (see iconMorph.ts) and the icon
 *      only dips slightly, so the change is legible. Without it — icons still
 *      loading, or a fetch that failed — the icon implodes behind a heavy blur
 *      instead, which is there purely to hide the hard cross-fade underneath.
 *   2. A radial color reveal:
 *      • Going TO alt (sage): a sage circle grows from a point at center to
 *        cover the viewport — "sage fills from the center out."
 *      • Going TO default (dark): a sage circle starts covering everything,
 *        then shrinks to a point — revealing the new dark theme at the edges
 *        first ("dark fills in from the edges").
 *   3. The icon re-expands with its new image visible.
 *
 * Colors are duplicated from tokens.css because we need to know both colors
 * regardless of which theme is currently active. Keep these in sync if the
 * design tokens ever change.
 */

import gsap from 'gsap';
import { theme } from '$lib/stores/theme.svelte';
import { addMorphToTimeline, hasMorphTargets } from './iconMorph';

const BG_ALT = '#72805c';

let isAnimating = false;
let pulseAnim: gsap.core.Tween | null = null;
let pulseTarget: HTMLElement | null = null;

export function startPulse(target: HTMLElement): void {
	if (pulseAnim || !target) return;
	pulseTarget = target;
	pulseAnim = gsap.to(target, {
		scale: 1.05,
		filter: 'blur(14px)',
		duration: 2,
		repeat: -1,
		yoyo: true,
		ease: 'sine.inOut'
	});
}

export function stopPulse(): void {
	if (pulseAnim) {
		pulseAnim.kill();
		pulseAnim = null;
	}
	if (pulseTarget) {
		gsap.set(pulseTarget, { scale: 1, filter: 'blur(0px)' });
	}
	pulseTarget = null;
}

export function playThemeTransition(): void {
	// Bail to a plain toggle in SSR or if a transition is already mid-flight.
	if (typeof document === 'undefined') {
		theme.toggle();
		return;
	}
	if (isAnimating) return;

	isAnimating = true;
	const toAlt = theme.current === 'default';
	const icon = document.querySelector<HTMLElement>('[data-animation-target="homepage-icon"]');

	// Pause any active pulse so it doesn't fight the transition's scale/filter
	// tweens. We restart it cleanly at the end rather than resuming, to avoid
	// gsap "snapping" back to a pre-transition mid-yoyo state.
	const wasPulsing = pulseAnim !== null;
	const pulseRestartTarget = pulseTarget;
	if (pulseAnim) {
		pulseAnim.kill();
		pulseAnim = null;
	}

	// Build the radial overlay — a circle positioned at the viewport center,
	// sized to cover the largest possible viewport diagonal at scale=1.
	const circle = document.createElement('div');
	circle.setAttribute('aria-hidden', 'true');
	circle.style.cssText = [
		'position: fixed',
		'top: 50%',
		'left: 50%',
		'width: 200vmax',
		'height: 200vmax',
		'margin-top: -100vmax',
		'margin-left: -100vmax',
		'border-radius: 50%',
		`background: ${BG_ALT}`,
		'z-index: 100',
		'pointer-events: none',
		'will-change: transform',
		`transform: scale(${toAlt ? 0 : 1})`
	].join(';');
	document.body.appendChild(circle);

	// For toDefault, the sage circle is already covering everything (scale 1)
	// at t=0 — flip the underlying theme NOW so the page beneath is dark by
	// the time the circle starts shrinking and revealing it.
	if (!toAlt) {
		theme.toggle();
	}

	const tl = gsap.timeline({
		onComplete: () => {
			circle.remove();
			isAnimating = false;
			if (wasPulsing && pulseRestartTarget) {
				startPulse(pulseRestartTarget);
			}
		}
	});

	// With a real morph running, the icon must stay readable — the old
	// scale(0.5) + blur(30px) implode existed only to make the image swap
	// unrecognisable, and it is exactly why the incoming mark looked like it
	// appeared out of nowhere. A shallow dip keeps the site's blur character
	// without hiding the thing we now actually want to be watched.
	const morphing = hasMorphTargets();
	const dip = morphing
		? { scale: 0.92, filter: 'blur(6px)' }
		: { scale: 0.5, filter: 'blur(30px)' };

	if (icon) {
		tl.to(icon, { ...dip, duration: 0.3, ease: 'power2.in' }, 0);
	}

	// The shape change spans the colour sweep and the theme flip, so the mark is
	// still travelling as the page changes colour rather than resolving first.
	if (morphing) {
		addMorphToTimeline(tl, toAlt, 0.1, 0.75);
	}

	// Radial color reveal — sage grows from 0 (toAlt) or shrinks to 0 (toDefault).
	tl.to(
		circle,
		{
			scale: toAlt ? 1 : 0,
			duration: 0.6,
			ease: 'power2.inOut'
		},
		0.1
	);

	// For toAlt, flip the theme at the moment the circle has fully grown to
	// cover the viewport (t=0.7). The icon's image cross-fade (handled by
	// CSS opacity transition in ThemeToggle.svelte) starts here and runs
	// concurrently with the icon's morph-out, blending the two icons.
	if (toAlt) {
		tl.add(() => {
			theme.toggle();
		}, 0.7);
	}

	// Icon settles — un-blur and scale back up. Held slightly later and longer
	// when morphing so the dip releases as the shape finishes travelling.
	if (icon) {
		tl.to(
			icon,
			{
				scale: 1,
				filter: 'blur(0px)',
				duration: morphing ? 0.5 : 0.4,
				ease: 'power2.out'
			},
			morphing ? 0.55 : 0.5
		);
	}
}
