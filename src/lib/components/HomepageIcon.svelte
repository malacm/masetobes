<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { startPulse, stopPulse } from '$lib/animations/themeTransition';
	import type { SanityImageRef } from '$lib/sanity/types';

	type Props = {
		iconDefault?: SanityImageRef;
		iconAlt?: SanityImageRef;
	};

	const { iconDefault, iconAlt }: Props = $props();

	let wrapEl: HTMLDivElement | undefined = $state();

	onMount(() => {
		if (wrapEl) startPulse(wrapEl);
		return () => stopPulse();
	});
</script>

<!--
  The pulse animation lives on this wrapper so the underlying ThemeToggle
  button (its click target) doesn't get scale/filter applied to it directly.
  z-index keeps the icon above the radial color overlay during theme swaps.
-->
<div
	bind:this={wrapEl}
	class="homepage-icon"
	data-animation-target="homepage-icon"
>
	<ThemeToggle {iconDefault} {iconAlt} size={320} ariaLabel="Toggle site theme" />
</div>

<style>
	.homepage-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: clamp(220px, 28vw, 360px);
		aspect-ratio: 1;
		position: relative;
		z-index: 200;
	}
</style>
