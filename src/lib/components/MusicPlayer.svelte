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

{#if collapsible}
	<!--
	  Off-home layout: bottom-right circular trigger. On hover (or keyboard
	  focus), the three controls fan out in an arc going up + up-left + left,
	  staggered so they appear one after another.
	-->
	<div class="fan-wrap">
		<button
			class="trigger"
			type="button"
			aria-label="Music player"
			disabled={tracks.length === 0}
		>
			<svg class="note" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M12 3v10.55a4 4 0 1 0 2 3.45V7h4V3h-6z" />
			</svg>
		</button>

		<!-- Order in markup matches stagger order: info → play → next -->
		<div class="control control-info" aria-live="polite">
			<Marquee text={label} />
		</div>

		<button
			class="control control-play"
			type="button"
			onclick={() => musicPlayer.toggle()}
			disabled={tracks.length === 0}
			aria-label={musicPlayer.isPlaying ? 'Pause' : 'Play'}
		>
			<span class="control-text">{musicPlayer.isPlaying ? 'pause' : 'play'}</span>
		</button>

		<button
			class="control control-next"
			type="button"
			onclick={() => musicPlayer.next()}
			disabled={tracks.length <= 1}
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
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 30;
	}

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
		color: var(--pill-fg);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: filter 180ms ease;
	}

	.fan-wrap:hover .trigger,
	.fan-wrap:focus-within .trigger {
		filter: blur(2px);
	}

	.note {
		width: 22px;
		height: 22px;
	}

	/* Each control starts collapsed onto the trigger (translate 0, scale 0.4),
	   invisible. On hover/focus of the wrap, they translate to their fan
	   position and fade in, with staggered delays so they appear one by one. */
	.control {
		position: absolute;
		bottom: 0;
		right: 0;
		height: 56px;
		min-width: 56px;
		padding: 0 16px;
		border-radius: 28px;
		background: var(--pill-bg);
		color: var(--pill-fg);
		font-weight: 700;
		font-size: 18px;
		line-height: 1;
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

	.fan-wrap:hover .control,
	.fan-wrap:focus-within .control {
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

	.fan-wrap:hover .control-info,
	.fan-wrap:focus-within .control-info {
		transform: translate(-260px, 0) scale(1);
		transition-delay: 0ms;
	}

	.control-play {
		/* angle 135° — up-left */
		transition-delay: 80ms;
	}

	.fan-wrap:hover .control-play,
	.fan-wrap:focus-within .control-play {
		transform: translate(-72px, -72px) scale(1);
	}

	.control-next {
		/* angle 90° — straight up */
		transition-delay: 160ms;
	}

	.fan-wrap:hover .control-next,
	.fan-wrap:focus-within .control-next {
		transform: translate(0, -84px) scale(1);
	}

	.control-text {
		transition: filter 180ms ease;
	}

	.control:hover:not(:disabled) .control-text {
		filter: blur(3px);
	}

	.control:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 600px) {
		/* Homepage layout: span the player across the screen with margin so the
		   marquee can shrink instead of pushing buttons off the edges. */
		.center-wrap {
			bottom: 16px;
			left: 16px;
			right: 16px;
			transform: none;
			justify-content: center;
		}

		.player {
			gap: 4px;
			width: 100%;
			justify-content: center;
		}

		.pill {
			padding: 6px 10px;
			font-size: 0.8rem; /* 16px */
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
			bottom: 16px;
			right: 16px;
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
			font-size: 0.8rem;
		}

		.control-info {
			width: 200px;
			min-width: 200px;
		}

		.fan-wrap:hover .control-info,
		.fan-wrap:focus-within .control-info {
			transform: translate(-216px, 0) scale(1);
		}

		.fan-wrap:hover .control-play,
		.fan-wrap:focus-within .control-play {
			transform: translate(-58px, -58px) scale(1);
		}

		.fan-wrap:hover .control-next,
		.fan-wrap:focus-within .control-next {
			transform: translate(0, -68px) scale(1);
		}
	}
</style>
