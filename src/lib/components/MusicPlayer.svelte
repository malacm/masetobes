<script lang="ts">
	import { onMount } from 'svelte';
	import { musicPlayer } from '$lib/stores/musicPlayer.svelte';
	import { fileUrl } from '$lib/sanity/image';
	import Marquee from './Marquee.svelte';
	import type { PlaylistTrack } from '$lib/sanity/types';

	type Props = {
		tracks: PlaylistTrack[];
	};

	const { tracks }: Props = $props();

	let audioEl: HTMLAudioElement | undefined = $state();

	onMount(() => {
		musicPlayer.setTracks(tracks);
	});

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

<!--
  One player, everywhere: the bottom-centre row of pills from the home frame
  (node 1:40459). The inner pages used to collapse it into a corner button that
  fanned the controls out on hover; Mason asked for the home behaviour on every
  page instead, so that layout is gone.
-->
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

<audio
	bind:this={audioEl}
	src={trackUrl ?? ''}
	preload="none"
	onended={() => musicPlayer.next()}
	onplay={() => musicPlayer.setPlaying(true)}
	onpause={() => musicPlayer.setPlaying(false)}
></audio>

<style>
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
		/* prefixed first — see the note on --pill-blur in tokens.css */
		-webkit-backdrop-filter: blur(var(--pill-blur));
		backdrop-filter: blur(var(--pill-blur));
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

	@media (max-width: 768px) {
		/* Span the player across the screen with margin so the marquee can
		   shrink instead of pushing buttons off the edges. */
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
	}
</style>
