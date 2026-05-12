/**
 * GSAP-driven animations for the homepage icon pulse + theme transitions.
 *
 * Pulse — a continuous, low-key blur+scale loop on the homepage central icon.
 * Mounted by HomepageIcon.svelte while it's in the DOM.
 *
 * Theme transition — when the user clicks any ThemeToggle, this orchestrates:
 *   1. The homepage icon "implodes" (scale + blur) so the about-to-swap image
 *      is unrecognizable when its src flips mid-animation — approximates a
 *      morph between the two icons without paid plugins.
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

const BG_ALT = '#7e8b6b';

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

	// Icon morph-in — implode to a blurry, smaller blob.
	if (icon) {
		tl.to(
			icon,
			{
				scale: 0.5,
				filter: 'blur(30px)',
				duration: 0.3,
				ease: 'power2.in'
			},
			0
		);
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

	// Icon morph-out — un-blur and scale back up.
	if (icon) {
		tl.to(
			icon,
			{
				scale: 1,
				filter: 'blur(0px)',
				duration: 0.4,
				ease: 'power2.out'
			},
			0.5
		);
	}
}
