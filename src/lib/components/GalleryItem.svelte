<script lang="ts">
	import { imageUrl, imageSrcset, fileUrl } from '$lib/sanity/image';
	import type { GalleryItem } from '$lib/sanity/types';

	type Props = { item: GalleryItem };
	const { item }: Props = $props();

	const isVideo = $derived(item.type === 'video');
	const videoRef = $derived(item.video?.asset?._ref ?? null);

	const imgSrc = $derived(!isVideo ? imageUrl(item.image, { width: 1600 }) : null);
	const imgSrcset = $derived(!isVideo ? imageSrcset(item.image) : undefined);
	const imgSizes = $derived(item.layout === 'full' ? '100vw' : '(max-width: 768px) 100vw, 50vw');

	let videoEl: HTMLVideoElement | undefined = $state();
	let videoSrc = $state<string | null>(null);
	let isVisible = $state(false);

	// Lazy-load + auto-pause videos via IntersectionObserver. Videos only get
	// their `src` set when they near the viewport, and pause when scrolled
	// away — keeps gallery scroll smooth even with many videos.
	$effect(() => {
		if (!videoEl || !videoRef) return;
		const el = videoEl;
		const observer = new IntersectionObserver(
			([entry]) => {
				isVisible = entry.isIntersecting;
				if (entry.isIntersecting) {
					if (!videoSrc) videoSrc = fileUrl(videoRef);
					// Best-effort: works when the video is already loaded.
					// First-time load races the DOM src update — caught by
					// the oncanplay handler below.
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
	{#if isVideo}
		<video
			bind:this={videoEl}
			src={videoSrc ?? undefined}
			muted
			loop
			playsinline
			preload="metadata"
			oncanplay={handleCanPlay}
		></video>
	{:else if imgSrc}
		<img
			src={imgSrc}
			srcset={imgSrcset}
			sizes={imgSizes}
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

	img,
	video {
		width: auto;
		height: auto;
		max-width: 100%;
		object-fit: contain;
	}

	/* In paired rows, force media to fill its (allocated) cell width so videos
	   and images both render edge-to-edge of their cell regardless of intrinsic
	   width. Heights then come from each item's natural aspect ratio. */
	.gallery-item[data-layout='pair-large'] img,
	.gallery-item[data-layout='pair-large'] video,
	.gallery-item[data-layout='pair-small'] img,
	.gallery-item[data-layout='pair-small'] video {
		width: 100%;
	}

	figcaption {
		font-size: 14px;
		color: var(--fg);
	}
</style>
