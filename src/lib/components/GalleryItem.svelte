<script lang="ts">
	import { imageUrl, imageSrcset, imageAspectRatio, fileUrl } from '$lib/sanity/image';
	import type { GalleryItem } from '$lib/sanity/types';

	type Props = { item: GalleryItem };
	const { item }: Props = $props();

	const isVideo = $derived(item.type === 'video');
	const videoRef = $derived(item.video?.asset?._ref ?? null);
	// A video slot with no file uploaded yet still reserves its space, so the
	// page keeps the design's rhythm while the footage is being added.
	const isPlaceholder = $derived(isVideo && !videoRef);

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
	// Prefer the ratio recorded on the item; fall back to what the file reports.
	const videoRatio = $derived(item.aspectRatio ?? measuredRatio);

	// Play only while on screen, and pause on the way out — keeps gallery
	// scroll smooth even with many videos.
	$effect(() => {
		if (!videoEl || !videoRef) return;
		const el = videoEl;
		const observer = new IntersectionObserver(
			([entry]) => {
				isVisible = entry.isIntersecting;
				if (entry.isIntersecting) {
					// Best-effort: works when the video is already buffered.
					// A cold start is caught by the oncanplay handler below.
					el.play().catch(() => {});
				} else {
					el.pause();
				}
			},
			{ rootMargin: '200px 0px', threshold: 0 }
		);
		observer.observe(el);
		return () => observer.disconnect();
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
		if (isVisible && videoEl?.paused) {
			videoEl.play().catch(() => {});
		}
	}
</script>

<figure class="gallery-item" data-layout={item.layout}>
	{#if isPlaceholder}
		<div class="placeholder" style:aspect-ratio={item.aspectRatio ?? 1.5}>
			<span>video</span>
		</div>
	{:else if isVideo}
		<video
			bind:this={videoEl}
			src={videoSrc ?? undefined}
			style:aspect-ratio={videoRatio ?? undefined}
			muted
			loop
			playsinline
			preload="metadata"
			onloadedmetadata={handleLoadedMetadata}
			oncanplay={handleCanPlay}
		></video>
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

	figcaption {
		font-size: 14px;
		color: var(--fg);
	}
</style>
