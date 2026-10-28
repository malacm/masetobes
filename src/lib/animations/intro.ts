/**
 * The site's intro, on the first hard load of the homepage in a browser
 * session. A preview of its one signature gesture — the theme toggle — so
 * the mark is the first thing the reader learns to press.
 *
 * The page is served covered by a disc of the *other* theme's colour (sage
 * over the dark site, dark over the sage one), with the mark alone on top of
 * it. Then, in order:
 *
 *   the disc shrinks into the mark, revealing the page from the edges in —
 *   the theme transition's "dark fills in from the edges", run as a curtain;
 *
 *   as it shrinks, the mark morphs from the other theme's shape into this
 *   one's and sharpens out of a slight blur, as it does on a toggle;
 *
 *   as the disc vanishes, the nav and the player bloom out of the mark's
 *   position to where they live, growing from 60% to full size (Nav and
 *   MusicPlayer carry that transition; `reveal` fires it);
 *
 *   and the mark starts to breathe.
 *
 * The curtain is in the HTML before first paint (see app.html) so nothing
 * flashes ahead of it, and `sessionStorage` keeps it to once per session, so
 * a reader who reloads is not held at the door twice. Under reduced motion
 * the curtain is simply dropped. If the morph source has not loaded in time
 * the mark resolves out of the blur without changing shape.
 */
import gsap from 'gsap';
import { theme } from '$lib/stores/theme.svelte';
import { startPulse, stopPulse } from './themeTransition';
import { addMorphToTimeline, hasMorphTargets, syncMorphTargets } from './iconMorph';

export const INTRO_SESSION_KEY = 'intro';

/* How long to wait for the morph shapes before going without them. */
const MORPH_WAIT_MS = 600;

type Options = {
	curtain: HTMLElement;
	/* Called once the disc has gone, to let the chrome in. */
	reveal: () => void;
};

/** Whether app.html put the curtain up for this load. */
export function introPending(): boolean {
	return document.documentElement.dataset.intro === 'pending';
}

function finish(curtain: HTMLElement) {
	curtain.style.display = 'none';
	document.documentElement.dataset.intro = 'done';
}

/** Plays the intro. Returns a cleanup for the caller's effect. */
export function playIntro({ curtain, reveal }: Options): () => void {
	try {
		sessionStorage.setItem(INTRO_SESSION_KEY, 'played');
	} catch {
		/* private mode — the intro will simply play again next time */
	}

	const icon = document.querySelector<HTMLElement>('[data-animation-target="homepage-icon"]');
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (reduced || !icon) {
		finish(curtain);
		reveal();
		return () => {};
	}

	// The mark holds its breath until it has landed.
	stopPulse();
	gsap.set(icon, { scale: 0.92, filter: 'blur(6px)' });

	let tl: gsap.core.Timeline | null = null;
	let cancelled = false;
	const isAlt = theme.current === 'alt';
	const waited = performance.now();

	// The shapes arrive over the network. Give them a moment: with them the
	// mark morphs out of the other theme's shape; without, it only sharpens.
	const start = () => {
		if (cancelled) return;
		const morphing = hasMorphTargets();
		if (morphing) syncMorphTargets(!isAlt);

		tl = gsap.timeline({
			onComplete: () => {
				finish(curtain);
				gsap.set(icon, { clearProps: 'scale,filter' });
				startPulse(icon);
			}
		});

		tl.to(curtain, { scale: 0, duration: 1.1, ease: 'power2.inOut' }, 0.2);
		if (morphing) addMorphToTimeline(tl, isAlt, 0.3, 0.9);
		tl.to(icon, { scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power2.out' }, 0.9);
		tl.add(reveal, 1.2);
	};

	const poll = () => {
		if (cancelled) return;
		if (hasMorphTargets() || performance.now() - waited > MORPH_WAIT_MS) start();
		else timer = setTimeout(poll, 50);
	};
	let timer = setTimeout(poll, 0);

	return () => {
		cancelled = true;
		clearTimeout(timer);
		tl?.kill();
	};
}
