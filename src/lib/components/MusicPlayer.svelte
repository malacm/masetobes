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

	<audio
		bind:this={audioEl}
		src={trackUrl ?? ''}
		preload="none"
		onended={() => musicPlayer.next()}
		onplay={() => musicPlayer.setPlaying(true)}
		onpause={() => musicPlayer.setPlaying(false)}
	></audio>
</div>

<style>
	.player {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 8px 16px;
		border-radius: 8px;
		background: var(--pill-bg);
		color: var(--pill-fg);
		font-weight: 700;
		font-size: 20px;
		line-height: 1;
	}

	.pill-text {
		display: inline-block;
		transition: filter 180ms ease;
	}

	.pill:hover:not(:disabled) .pill-text {
		filter: blur(3px);
	}

	.pill:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.marquee-pill {
		gap: 8px;
		min-width: 220px;
		max-width: 320px;
		overflow: hidden;
	}

	.prefix {
		flex-shrink: 0;
	}
</style>
