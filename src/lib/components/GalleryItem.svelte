<script lang="ts">
	import { imageUrl, fileUrl } from '$lib/sanity/image';
	import type { GalleryItem } from '$lib/sanity/types';

	type Props = { item: GalleryItem };
	const { item }: Props = $props();

	const src = $derived(
		item.type === 'video'
			? fileUrl(item.video?.asset?._ref ?? null)
			: imageUrl(item.image, { width: 1600 })
	);
</script>

<figure class="gallery-item" data-layout={item.layout}>
	{#if item.type === 'video' && src}
		<video {src} autoplay muted loop playsinline></video>
	{:else if src}
		<img {src} alt={item.caption ?? ''} loading="lazy" />
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
