<script lang="ts">
	import { onMount } from 'svelte';
	import { musicPlayer } from '$lib/stores/musicPlayer.svelte';
	import { fileUrl } from '$lib/sanity/image';
	import Marquee from './Marquee.svelte';
	import type { PlaylistTrack } from '$lib/sanity/types';

	type Props = {
		tracks: PlaylistTrack[];
		collapsible?: boolean;
	};

	const { tracks, collapsible = false }: Props = $props();

	let audioEl: HTMLAudioElement | undefined = $state();
	let fanEl: HTMLDivElement | undefined = $state();
	let expanded = $state(false);

	onMount(() => {
		musicPlayer.setTracks(tracks);
	});

	// Touch devices never fire hover, so the off-home fan needs a real open
	// state driven by tapping the trigger. Pointer devices layer hover on top
	// of that same state rather than a separate :hover rule, which keeps the
	// two from disagreeing about whether the fan is open.
	const hoverCapable = () => window.matchMedia('(hover: hover)').matches;

	function toggle(event: MouseEvent) {
		expanded = !expanded;
		// A tap leaves the trigger focused; without this the ring lingers on a
		// control the user just dismissed.
		if (!expanded) (event.currentTarget as HTMLButtonElement).blur();
	}

	function closeIfOutside(target: EventTarget | null) {
		if (!expanded) return;
		if (target instanceof Node && fanEl?.contains(target)) return;
		expanded = false;
	}

	const trackUrl = $derived(fileUrl(musicPlayer.current?.audio?.asset?._ref ?? null));
	const label = $derived(
		musicPlayer.current
			? `${musicPlayer.current.title} — ${musicPlayer.current.artist}`
			: 'no tracks yet'
	);

	$effect(() => {
		if (!audioEl) return;
		if (musicPlayer.isPlaying && trackUrl) {
			audioEl.play().catch(() => musicPlayer.setPlaying(false));
		} else {
			audioEl.pause();
		}
	});
</script>

{#if collapsible}
	<!--
	  Off-home layout: bottom-right circular trigger. Opening fans the three
	  controls out in an arc (up + up-left + left) on desktop and stacks them
	  above the trigger on mobile, staggered so they appear one after another.
	-->
	<div
		class="fan-wrap"
		class:expanded
		role="group"
		aria-label="Music player"
		bind:this={fanEl}
		onmouseenter={() => hoverCapable() && (expanded = true)}
		onmouseleave={() => hoverCapable() && (expanded = false)}
		onfocusout={(e) => closeIfOutside(e.relatedTarget)}
	>
		<button
			class="trigger"
			type="button"
			aria-label={expanded ? 'Hide music controls' : 'Show music controls'}
			aria-expanded={expanded}
			onclick={toggle}
			disabled={tracks.length === 0}
		>
			<svg class="note" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M12 3v10.55a4 4 0 1 0 2 3.45V7h4V3h-6z" />
			</svg>
		</button>

		<!-- Order in markup matches stagger order: info → play → next -->
		<div class="control control-info" aria-live="polite" inert={!expanded}>
			<Marquee text={label} />
		</div>

		<button
			class="control control-play"
			type="button"
			onclick={() => musicPlayer.toggle()}
			disabled={tracks.length === 0}
			inert={!expanded}
			aria-label={musicPlayer.isPlaying ? 'Pause' : 'Play'}
		>
			<span class="control-text">{musicPlayer.isPlaying ? 'pause' : 'play'}</span>
		</button>

		<button
			class="control control-next"
			type="button"
			onclick={() => musicPlayer.next()}
			disabled={tracks.length <= 1}
			inert={!expanded}
			aria-label="Next track"
		>
			<span class="control-text">next</span>
		</button>
	</div>

{:else}
	<!-- Home layout: bottom-center horizontal pills, always expanded. -->
	<div class="center-wrap">
		<div class="player">
			<button
				class="pill"
				type="button"
				onclick={() => musicPlayer.toggle()}
				disabled={tracks.length === 0}
			>
				<span class="pill-text">{musicPlayer.isPlaying ? 'pause' : 'play'}</span>
			</button>

			<div class="pill marquee-pill">
				<span class="prefix">now playing:</span>
				<Marquee text={label} />
			</div>

			<button
				class="pill"
				type="button"
				onclick={() => musicPlayer.next()}
				disabled={tracks.length <= 1}
			>
				<span class="pill-text">next</span>
			</button>
		</div>
	</div>
{/if}

<!-- Dismissal for the off-home fan; no-ops on the home layout, which never opens. -->
<svelte:window
	onpointerdown={(e) => closeIfOutside(e.target)}
	onkeydown={(e) => e.key === 'Escape' && (expanded = false)}
/>

<audio
	bind:this={audioEl}
	src={trackUrl ?? ''}
	preload="none"
	onended={() => musicPlayer.next()}
	onplay={() => musicPlayer.setPlaying(true)}
	onpause={() => musicPlayer.setPlaying(false)}
></audio>

<style>
	/* ===== Home layout: bottom-center horizontal pills ===== */
	.center-wrap {
		position: fixed;
		bottom: var(--page-pad-y);
		left: 50%;
		transform: translateX(-50%);
		z-index: 30;
	}

	.player {
		display: flex;
		gap: var(--pill-gap);
		align-items: center;
	}

	.pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 30px;
		padding: 0 var(--pill-pad-x);
		border-radius: var(--pill-radius);
		background: var(--pill-bg);
		backdrop-filter: blur(var(--pill-blur));
		-webkit-backdrop-filter: blur(var(--pill-blur));
		color: var(--pill-fg);
		font-weight: 700;
		font-size: 1rem; /* 20px */
		line-height: normal;
		letter-spacing: var(--track-tight);
	}

	.pill-text {
		display: inline-block;
		transition: filter 180ms ease;
	}

	.pill:hover:not(:disabled) .pill-text {
		filter: blur(var(--text-blur));
	}

	.pill:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Fixed at the design's 229px — the marquee's intrinsic width is twice the
	   label (it duplicates the text to loop seamlessly), so a content-sized
	   pill would always sit at its max. The title scrolls inside instead. */
	.marquee-pill {
		gap: 8px;
		flex: 0 0 229px;
		overflow: hidden;
	}

	.prefix {
		flex-shrink: 0;
	}

	/* ===== Off-home layout: bottom-right fan-out ===== */
	.fan-wrap {
		position: fixed;
		bottom: 24px;
		right: 24px;
		z-index: 30;
		width: 56px;
		height: 56px;
	}

	.trigger {
		position: relative;
		z-index: 2;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: var(--pill-bg);
		backdrop-filter: blur(var(--pill-blur));
		-webkit-backdrop-filter: blur(var(--pill-blur));
		color: var(--pill-fg);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: filter 180ms ease;
	}

	.fan-wrap.expanded .trigger {
		filter: blur(2px);
	}

	.trigger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.note {
		width: 22px;
		height: 22px;
	}

	/* Each control starts collapsed onto the trigger (translate 0, scale 0.4),
	   invisible. Opening translates them to their fan position and fades them
	   in, with staggered delays so they appear one by one. */
	.control {
		position: absolute;
		bottom: 0;
		right: 0;
		height: 56px;
		min-width: 56px;
		padding: 0 16px;
		border-radius: var(--pill-radius);
		background: var(--pill-bg);
		backdrop-filter: blur(var(--pill-blur));
		-webkit-backdrop-filter: blur(var(--pill-blur));
		color: var(--pill-fg);
		font-weight: 700;
		font-size: 0.9rem; /* 18px */
		line-height: 1;
		letter-spacing: var(--track-tight);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		pointer-events: none;
		transform: translate(0, 0) scale(0.4);
		transition:
			opacity 200ms ease,
			transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.fan-wrap.expanded .control {
		opacity: 1;
		pointer-events: auto;
	}

	/* Fan positions, measured as translate from trigger center.
	   Distance ~84px on a 90° arc from horizontal-left to straight-up. */
	.control-info {
		/* angle 180° — straight left from trigger */
		width: 240px;
		min-width: 240px;
		padding: 0 18px;
		justify-content: flex-start;
		overflow: hidden;
		transition-delay: 0ms;
	}

	.fan-wrap.expanded .control-info {
		transform: translate(-260px, 0) scale(1);
	}

	.control-play {
		/* angle 135° — up-left */
		transition-delay: 80ms;
	}

	.fan-wrap.expanded .control-play {
		transform: translate(-72px, -72px) scale(1);
	}

	.control-next {
		/* angle 90° — straight up */
		transition-delay: 160ms;
	}

	.fan-wrap.expanded .control-next {
		transform: translate(0, -84px) scale(1);
	}

	.control-text {
		transition: filter 180ms ease;
	}

	.control:hover:not(:disabled) .control-text {
		filter: blur(var(--text-blur));
	}

	/* Dim only once fanned out — a bare `.control:disabled { opacity }` outranks
	   the collapsed `opacity: 0` and leaves ghost pills peeking past the
	   trigger when the playlist is empty. */
	.control:disabled {
		cursor: not-allowed;
	}

	.fan-wrap.expanded .control:disabled {
		opacity: 0.5;
	}

	@media (max-width: 768px) {
		/* Homepage layout: span the player across the screen with margin so the
		   marquee can shrink instead of pushing buttons off the edges. */
		.center-wrap {
			bottom: var(--page-pad-y);
			left: var(--page-pad-x);
			right: var(--page-pad-x);
			transform: none;
		}

		.player {
			gap: var(--pill-gap);
			width: 100%;
			justify-content: center;
		}

		.pill {
			height: 21px;
			padding: 0 var(--pill-pad-x);
			font-size: 0.7rem; /* 14px */
		}

		.marquee-pill {
			flex: 1 1 0;
			min-width: 0;
			max-width: none;
		}

		.prefix {
			display: none;
		}

		/* Off-home fan-out shrinks too. */
		.fan-wrap {
			bottom: var(--page-pad-y);
			right: var(--page-pad-x);
			width: 48px;
			height: 48px;
		}

		.trigger {
			width: 48px;
			height: 48px;
		}

		.note {
			width: 18px;
			height: 18px;
		}

		.control {
			height: 48px;
			min-width: 48px;
			padding: 0 12px;
			font-size: 0.8rem; /* 16px */
		}

		/* The desktop arc swings the info pill ~57px past the left edge at phone
		   widths, so the controls stack above the trigger instead: play + next
		   share a row, the marquee spans the row above them. Stagger runs from
		   the trigger outwards. */
		.control-play,
		.control-next {
			width: 84px;
			min-width: 84px;
		}

		.control-play {
			transition-delay: 0ms;
		}

		.control-next {
			transition-delay: 60ms;
		}

		.control-info {
			width: min(260px, calc(100vw - var(--page-pad-x) * 2));
			min-width: 0;
			padding: 0 12px;
			transition-delay: 120ms;
		}

		.fan-wrap.expanded .control-play {
			transform: translate(-92px, -56px) scale(1);
		}

		.fan-wrap.expanded .control-next {
			transform: translate(0, -56px) scale(1);
		}

		.fan-wrap.expanded .control-info {
			transform: translate(0, -112px) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.control {
			transition-duration: 1ms;
			transition-delay: 0ms !important;
		}
	}
</style>
