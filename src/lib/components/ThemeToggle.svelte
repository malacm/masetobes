<script lang="ts">
	import { theme } from '$lib/stores/theme.svelte';
	import { imageUrl } from '$lib/sanity/image';
	import type { SanityImageRef } from '$lib/sanity/types';

	type Props = {
		iconDefault?: SanityImageRef;
		iconAlt?: SanityImageRef;
		size?: number | string;
		ariaLabel?: string;
	};

	const { iconDefault, iconAlt, size = 48, ariaLabel = 'Toggle site theme' }: Props = $props();

	const sizeValue = $derived(typeof size === 'number' ? `${size}px` : size);
	const activeImage = $derived(theme.current === 'alt' ? iconAlt : iconDefault);
	const activeUrl = $derived(
		imageUrl(activeImage, { width: typeof size === 'number' ? Math.round(size * 3) : 1200 })
	);
</script>

<button class="toggle" aria-label={ariaLabel} onclick={() => theme.toggle()} style:--size={sizeValue}>
	{#if activeUrl}
		<img src={activeUrl} alt="" />
	{:else}
		<!-- placeholder when site settings are missing — simple star/circle by theme -->
		<svg viewBox="0 0 100 100" aria-hidden="true">
			{#if theme.current === 'alt'}
				<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="1" />
				<circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="1" />
				<circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" stroke-width="1" />
			{:else}
				<path d="M50 5 L55 45 L95 50 L55 55 L50 95 L45 55 L5 50 L45 45 Z" fill="currentColor" />
			{/if}
		</svg>
	{/if}
</button>

<style>
	.toggle {
		width: var(--size);
		height: var(--size);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--fg);
	}

	.toggle img,
	.toggle svg {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>
