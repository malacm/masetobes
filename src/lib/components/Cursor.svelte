<script lang="ts">
	import { onMount } from 'svelte';
	import { musicPlayer } from '$lib/stores/musicPlayer.svelte';
	import { createHitWalker } from '$lib/animations/beat';

	/* The hover cursor: a drop on water. The 10px white dot that used to be
	   a CSS cursor image is now an element, so it can move and so things can
	   happen around it. Over anything clickable, while a track is playing,
	   it is the drop: on every low hit — each kick or bass note the track
	   actually lands, measured ahead of time (animations/beat.ts) and read
	   off the audio clock each frame — a ripple in the *other* theme's
	   colour (sage on the dark site, dark on the sage one) spreads out from
	   wherever it is, as big as the hit was hard, and the dot dips as if
	   taking it. Ripples are born at the pointer's position and stay there
	   as they spread, so a pointer moving across a card leaves a trail of
	   them. Between hits, and with nothing playing, the dot is just a dot.
	   Fine pointers only; reset.css hides the native cursor while this runs.
	   Under reduced motion nothing ripples. */

	const INTERACTIVE = 'a[href], button:not(:disabled), [role="button"], summary, label';

	let wrap: HTMLDivElement | undefined = $state();
	let dot: HTMLDivElement | undefined = $state();
	let layer: HTMLDivElement | undefined = $state();
	let over = $state(false);
	let playing = $derived(musicPlayer.isPlaying);

	let x = 0;
	let y = 0;
	let reduced = false;
	const hits = createHitWalker();
	/* The dot's dip: set on a hit, eased back over the next frames. */
	let dip = 0;

	/* Two rings per drop, the second smaller and fainter a beat behind, the
	   way a real one spreads; a harder hit spreads further. Each ring is its
	   own element, removed when done. */
	function ripple(px: number, py: number, strength: number) {
		if (reduced || !layer) return;
		const reach = 0.55 + 0.45 * strength;
		for (const [delay, size, alpha] of [
			[0, reach, 0.9],
			[140, reach * 0.7, 0.5]
		]) {
			const ring = document.createElement('div');
			ring.className = 'ring';
			ring.style.setProperty('--x', `${px}px`);
			ring.style.setProperty('--y', `${py}px`);
			ring.style.setProperty('--delay', `${delay}ms`);
			ring.style.setProperty('--size', `${size}`);
			ring.style.setProperty('--alpha', `${alpha}`);
			ring.addEventListener('animationend', () => ring.remove(), { once: true });
			layer.appendChild(ring);
		}
	}

	onMount(() => {
		if (!window.matchMedia('(pointer: fine)').matches) return;
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		document.documentElement.dataset.cursor = 'dot';

		const move = (e: PointerEvent) => {
			x = e.clientX;
			y = e.clientY;
			if (wrap) wrap.style.transform = `translate3d(${x}px, ${y}px, 0)`;
			over = !!(e.target as Element | null)?.closest?.(INTERACTIVE);
		};
		const out = (e: PointerEvent) => {
			if (!e.relatedTarget) over = false;
		};
		document.addEventListener('pointermove', move, { passive: true });
		document.addEventListener('pointerout', out, { passive: true });

		// The hits: a ripple for each one the clock passes, and the dot dips
		// with it, like the surface taking the drop, then eases back.
		let frame = 0;
		const tick = () => {
			frame = requestAnimationFrame(tick);
			if (!dot) return;
			if (!over || !playing) {
				hits.reset();
				dip = 0;
				if (dot.style.transform) dot.style.transform = '';
				return;
			}
			for (const hit of hits.advance(musicPlayer.current, musicPlayer.time())) {
				ripple(x, y, hit.strength);
				dip = Math.max(dip, 0.18 * hit.strength);
			}
			dot.style.transform = dip > 0.002 ? `scale(${(1 - dip).toFixed(3)})` : '';
			dip *= 0.82;
		};
		frame = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(frame);
			document.removeEventListener('pointermove', move);
			document.removeEventListener('pointerout', out);
			delete document.documentElement.dataset.cursor;
		};
	});
</script>

<div class="layer" bind:this={layer} aria-hidden="true"></div>
<div class="cursor" class:over bind:this={wrap} aria-hidden="true">
	<div class="dot" bind:this={dot}></div>
</div>

<style>
	/* Positioned at the pointer by the transform; the negative inset centres
	   the 10px dot on it, like the old cursor image's hotspot. Above the
	   about overlay and the intro's curtain (100) and the homepage mark
	   (200). */
	.cursor {
		position: fixed;
		top: -5px;
		left: -5px;
		width: 10px;
		height: 10px;
		z-index: 300;
		pointer-events: none;
		opacity: 0;
		transition: opacity 120ms ease;
		will-change: transform;
	}

	.cursor.over {
		opacity: 1;
	}

	.dot {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: #f6f6f6;
		transform-origin: 50% 50%;
	}

	/* The ripples live in their own fixed layer so they can outlive a move. */
	.layer {
		position: fixed;
		inset: 0;
		z-index: 299;
		pointer-events: none;
		overflow: hidden;
	}

	/* A ring is born the dot's size and spreads to 72px as it fades, on the
	   site's arrival curve: quick off the mark, then slowing as it goes, the
	   way a ripple loses itself. Rendered via :global because the rings are
	   made in script. */
	.layer :global(.ring) {
		position: absolute;
		top: -36px;
		left: -36px;
		width: 72px;
		height: 72px;
		border-radius: 50%;
		border: 1.5px solid var(--bg-other);
		opacity: 0;
		transform: translate3d(var(--x), var(--y), 0) scale(0.14);
		animation: ripple 1100ms cubic-bezier(0.22, 1, 0.36, 1) var(--delay) forwards;
		will-change: transform, opacity;
	}

	@keyframes ripple {
		from {
			transform: translate3d(var(--x), var(--y), 0) scale(0.14);
			opacity: var(--alpha);
		}
		to {
			transform: translate3d(var(--x), var(--y), 0) scale(var(--size));
			opacity: 0;
		}
	}
</style>
