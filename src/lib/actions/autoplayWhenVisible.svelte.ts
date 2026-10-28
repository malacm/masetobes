import type { Action } from 'svelte/action';
import { scrollState } from '$lib/stores/scrollState.svelte';

/**
 * Plays a muted, looping video only while it is on screen and the page is not
 * being flung — the same policy as the gallery videos, which hold their frame
 * during a fast scroll so decoding never competes with painting it. The
 * element should carry `muted`, `loop` and `playsinline` itself.
 */
export const autoplayWhenVisible: Action<HTMLVideoElement> = (video) => {
	let visible = false;

	const sync = () => {
		if (visible && !scrollState.fast) video.play().catch(() => {});
		else video.pause();
	};

	const observer = new IntersectionObserver(
		([entry]) => {
			visible = entry.isIntersecting;
			sync();
		},
		{ rootMargin: '200px 0px', threshold: 0 }
	);
	observer.observe(video);

	// A cold start: the first play() may run before enough is buffered.
	const onCanPlay = () => {
		if (visible && !scrollState.fast && video.paused) video.play().catch(() => {});
	};
	video.addEventListener('canplay', onCanPlay);

	// Re-run when the scroll state flips; $effect.root keeps this reactive
	// outside component scope, and is torn down with the action.
	const stop = $effect.root(() => {
		$effect(() => {
			scrollState.fast;
			sync();
		});
	});

	return {
		destroy() {
			observer.disconnect();
			video.removeEventListener('canplay', onCanPlay);
			stop();
			video.pause();
		}
	};
};
