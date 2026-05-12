<script lang="ts">
	import { theme } from '$lib/stores/theme.svelte';
	import { playThemeTransition } from '$lib/animations/themeTransition';
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
	const imgWidth = $derived(typeof size === 'number' ? Math.round(size * 3) : 1200);
	const defaultUrl = $derived(imageUrl(iconDefault, { width: imgWidth }));
	const altUrl = $derived(imageUrl(iconAlt, { width: imgWidth }));
</script>

<!--
  Both icons are rendered stacked. CSS opacity transitions cross-fade between
  them when the theme changes — giving a soft morph effect rather than a hard
  image swap.
-->
<button
	class="toggle"
	data-theme={theme.current === 'alt' ? 'alt' : 'default'}
	aria-label={ariaLabel}
	onclick={() => playThemeTransition()}
	style:--size={sizeValue}
>
	{#if defaultUrl}
		<img class="icon icon-default" src={defaultUrl} alt="" />
	{:else}
		<svg class="icon icon-default" viewBox="0 0 100 100" aria-hidden="true">
			<path d="M50 5 L55 45 L95 50 L55 55 L50 95 L45 55 L5 50 L45 45 Z" fill="currentColor" />
		</svg>
	{/if}
	{#if altUrl}
		<img class="icon icon-alt" src={altUrl} alt="" />
	{:else}
		<svg class="icon icon-alt" viewBox="0 0 100 100" aria-hidden="true">
			<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="1" />
			<circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="1" />
			<circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" stroke-width="1" />
		</svg>
	{/if}
</button>

<style>
	.toggle {
		position: relative;
		width: var(--size);
		height: var(--size);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--fg);
	}

	.icon {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		transition: opacity 350ms ease;
	}

	.toggle[data-theme='default'] .icon-default {
		opacity: 1;
	}
	.toggle[data-theme='default'] .icon-alt {
		opacity: 0;
	}
	.toggle[data-theme='alt'] .icon-default {
		opacity: 0;
	}
	.toggle[data-theme='alt'] .icon-alt {
		opacity: 1;
	}
</style>
