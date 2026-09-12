<script lang="ts">
	import { imageUrl, imageSrcset, imageAspectRatio, fileUrl } from '$lib/sanity/image';
	import { scrollState } from '$lib/stores/scrollState.svelte';
	import type { GalleryItem } from '$lib/sanity/types';

	type Props = { item: GalleryItem };
	const { item }: Props = $props();

	const isVideo = $derived(item.type === 'video');
	const videoRef = $derived(item.video?.asset?._ref ?? null);
	// A video slot with no file uploaded yet still reserves its space, so the
	// page keeps the design's rhythm while the footage is being added.
	const isPlaceholder = $derived(isVideo && !videoRef);

	/* Framed videos sit centred on a flat colour panel rather than filling the
	   slot — the Figma "video in a background" treatment. `landscape` is the
	   3:2 panel drawn for browser recordings, `portrait` the 3:4 one for phone
	   recordings; the panel colour defaults to the cream in the designs. */
	const frame = $derived(isVideo && item.frame && item.frame !== 'none' ? item.frame : null);
	const frameColor = $derived(item.frameColor?.trim() || undefined);
	// Ratio used for a placeholder inside a panel when none is recorded on the
	// item: the recordings in the designs are ~1.84 (browser) and ~0.58 (phone).
	const frameDefaultRatio = $derived(frame === 'portrait' ? 0.58 : 1.84);

	const imgSrc = $derived(!isVideo ? imageUrl(item.image, { width: 1600 }) : null);
	const imgSrcset = $derived(!isVideo ? imageSrcset(item.image) : undefined);
	// Reserve the image's box on first render. Without this the gallery has no
	// height until the images arrive, which both shifts the layout and makes
	// every scroll measurement taken at mount wrong.
	const imgRatio = $derived(item.aspectRatio ?? imageAspectRatio(item.image));
	const imgSizes = $derived(item.layout === 'full' ? '100vw' : '(max-width: 768px) 100vw, 50vw');

	let videoEl: HTMLVideoElement | undefined = $state();
	let isVisible = $state(false);
	let measuredRatio = $state<number | null>(null);

	// A video with no source has no dimensions, so its grid cell collapses to
	// the 300x150 default and the whole row loses its height. `preload` is
	// still "metadata", so this costs a few header bytes per video rather than
	// the file — enough for the browser to reserve the right box up front.
	const videoSrc = $derived(fileUrl(videoRef));
	// The ratio recorded on the item only reserves space until the file has
	// loaded; after that the file's own ratio wins. A recorded ratio that is
	// even slightly off would otherwise letterbox the footage inside its box.
	const videoRatio = $derived(measuredRatio ?? item.aspectRatio ?? null);

	// Track whether the video is on screen; playback is decided below.
	$effect(() => {
		if (!videoEl || !videoRef) return;
		// The element is server-rendered, so its metadata can arrive before
		// hydration attaches the listener below — read it now if it already has.
		if (videoEl.readyState >= 1) handleLoadedMetadata();
		const observer = new IntersectionObserver(
			([entry]) => {
				isVisible = entry.isIntersecting;
			},
			{ rootMargin: '200px 0px', threshold: 0 }
		);
		observer.observe(videoEl);
		return () => observer.disconnect();
	});

	// Play only while on screen and while the page is not being flung. A video
	// that is decoding costs the compositor frames during a fast scroll — that
	// was the stutter — so it holds its current frame until the scroll settles.
	// Best-effort: works once the video is buffered; a cold start is caught by
	// the oncanplay handler below.
	const shouldPlay = $derived(isVisible && !scrollState.fast);

	$effect(() => {
		if (!videoEl || !videoRef) return;
		if (shouldPlay) videoEl.play().catch(() => {});
		else videoEl.pause();
	});

	function handleLoadedMetadata() {
		if (videoEl?.videoWidth && videoEl.videoHeight) {
			measuredRatio = videoEl.videoWidth / videoEl.videoHeight;
		}
	}

	// Fires once the video has loaded enough to start. If it's currently in
	// the viewport, kick off playback — closes the race condition where the
	// IO callback's play() ran before the new src had been applied to the DOM.
	function handleCanPlay() {
		if (shouldPlay && videoEl?.paused) {
			videoEl.play().catch(() => {});
		}
	}
</script>

{#snippet videoMedia()}
	{#if isPlaceholder}
		<div
			class="placeholder"
			style:aspect-ratio={item.aspectRatio ?? (frame ? frameDefaultRatio : 1.5)}
			style:--ratio={frame ? (item.aspectRatio ?? frameDefaultRatio) : undefined}
		>
			<span>video</span>
		</div>
	{:else}
		<video
			bind:this={videoEl}
			src={videoSrc ?? undefined}
			style:aspect-ratio={videoRatio ?? undefined}
			style:--ratio={frame ? (videoRatio ?? frameDefaultRatio) : undefined}
			muted
			loop
			playsinline
			preload="metadata"
			onloadedmetadata={handleLoadedMetadata}
			oncanplay={handleCanPlay}
		></video>
	{/if}
{/snippet}

<figure class="gallery-item" data-layout={item.layout}>
	{#if frame}
		<div class="frame" data-frame={frame} style:--frame-bg={frameColor}>
			{@render videoMedia()}
		</div>
	{:else if isVideo}
		{@render videoMedia()}
	{:else if imgSrc}
		<img
			src={imgSrc}
			srcset={imgSrcset}
			sizes={imgSizes}
			style:aspect-ratio={imgRatio ?? undefined}
			alt={item.caption ?? ''}
			loading="lazy"
			decoding="async"
		/>
	{/if}
	{#if item.caption}
		<figcaption>{item.caption}</figcaption>
	{/if}
</figure>

<style>
	.gallery-item {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	/* Media fills its grid cell; height follows the intrinsic aspect ratio. */
	img,
	video {
		width: 100%;
		height: auto;
		object-fit: contain;
	}

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		border: 1px dashed var(--rule);
		border-radius: var(--pill-radius);
		color: var(--fg);
		opacity: 0.45;
		font-size: 1rem;
		letter-spacing: var(--track-tight);
		text-transform: lowercase;
	}

	/* The panel behind a framed video. Its proportions come straight from the
	   Figma frames: 1400×929 (desktop, full width) and 382×251 (mobile) for
	   the landscape panel, 690×929 and 382×509 for the portrait one — 3:2 and
	   3:4 to within a few pixels, and the same at both breakpoints, so the
	   panel scales with whatever column span it is given. */
	.frame {
		/* Size containment: the panel's height comes from its aspect ratio and
		   nothing else, so footage that doesn't match the panel's orientation
		   is fitted inside it rather than stretching it. It also makes cqw/cqh
		   available to the children below. */
		container-type: size;
		display: grid;
		place-items: center;
		width: 100%;
		background: var(--frame-bg, #f1f0e8);
	}

	.frame[data-frame='landscape'] {
		aspect-ratio: 3 / 2;
	}

	.frame[data-frame='portrait'] {
		aspect-ratio: 3 / 4;
	}

	/* The recording is sized relative to the panel, again from Figma: the
	   browser capture is 918 of the 1400px panel, the phone capture 290 of
	   690px. Corner radii are fixed: 10px on a browser capture, 20px on a
	   phone capture, at every breakpoint. */
	.frame[data-frame='landscape'] {
		--fit-w: 65.6cqw;
		--fit-h: 85cqh;
		--radius: 10px;
	}

	.frame[data-frame='portrait'] {
		--fit-w: 42cqw;
		--fit-h: 85cqh;
		--radius: 20px;
	}

	.frame > video,
	.frame > .placeholder {
		/* Design width, unless that would push the footage past the panel's
		   edges — then it is scaled down to fit, keeping its own ratio. */
		width: min(var(--fit-w), calc(var(--fit-h) * var(--ratio, 1.84)));
		border-radius: var(--radius);
	}

	.frame > video {
		/* Clip the footage to the rounded corners rather than letting the
		   element's box show square behind them. Cover, not contain: until the
		   file's own ratio is known the box may not match it, and a crop is
		   less visible on the panel than a letterbox. */
		overflow: hidden;
		object-fit: cover;
		background: transparent;
	}

	/* The dashed slot marker is drawn for the dark page; on the light panel it
	   needs a dark stroke to be seen at all. */
	.frame > .placeholder {
		border-color: rgba(35, 31, 32, 0.35);
		color: #231f20;
	}

	figcaption {
		font-size: 14px;
		color: var(--fg);
	}
</style>
