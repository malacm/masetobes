<script lang="ts">
	import { untrack } from 'svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { playThemeTransition } from '$lib/animations/themeTransition';
	import { imageUrl } from '$lib/sanity/image';
	import {
		loadIconShape,
		registerMorphTarget,
		syncMorphTargets,
		type IconShapes
	} from '$lib/animations/iconMorph';
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

	/* Both icons are pulled down as text and reduced to one path each, so the
	   mark can actually morph. Until that resolves — or if it fails — the
	   stacked <img> cross-fade below stays in place, so the toggle always works
	   and always shows the right icon. */
	let shapes = $state<IconShapes | null>(null);
	let morphEl: SVGPathElement | undefined = $state();

	$effect(() => {
		let cancelled = false;
		Promise.all([loadIconShape(defaultUrl), loadIconShape(altUrl)]).then(([d, a]) => {
			if (!cancelled && d && a) shapes = { default: d, alt: a };
		});
		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		if (!morphEl || !shapes) return;
		const cleanup = registerMorphTarget(morphEl, shapes);
		// `untrack` matters here. The theme flips *during* the transition, and a
		// tracked read would re-run this effect mid-tween — tearing down the
		// registration, killing the morph, and snapping the path to its end
		// shape. The path carries no reactive `d` for the same reason: once a
		// morph starts, GSAP owns that attribute.
		syncMorphTargets(untrack(() => theme.current) === 'alt');
		return cleanup;
	});
</script>

<!--
  Preferred path: one inline <path> whose outline morphs from one mark into the
  other, driven by the theme transition.

  Fallback: the two icons stacked as <img>, cross-faded on opacity. Used until
  the SVG source has been fetched and parsed, and permanently if that fails —
  an <img> is opaque to the page, so its shapes cannot be animated.
-->
<button
	class="toggle"
	data-theme={theme.current === 'alt' ? 'alt' : 'default'}
	aria-label={ariaLabel}
	onclick={() => playThemeTransition()}
	style:--size={sizeValue}
>
	{#if shapes}
		<svg class="icon icon-morph" viewBox="0 0 100 100" aria-hidden="true">
			<path bind:this={morphEl} fill="currentColor" />
		</svg>
	{:else}
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

	/* The morph path replaces both stacked images, so it is always visible and
	   opts out of the cross-fade rules below. */
	.icon-morph {
		opacity: 1;
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
