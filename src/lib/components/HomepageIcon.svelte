<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';
	import type { SanityImageRef } from '$lib/sanity/types';

	type Props = {
		iconDefault?: SanityImageRef;
		iconAlt?: SanityImageRef;
	};

	const { iconDefault, iconAlt }: Props = $props();
</script>

<!--
  This wrapper exists so the later GSAP animation pass has a consistent target
  to attach the "blurry pulse" effect to. Static for now.
-->
<div class="homepage-icon" data-animation-target="homepage-icon">
	<ThemeToggle {iconDefault} {iconAlt} size={320} ariaLabel="Toggle site theme" />
</div>

<style>
	.homepage-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: clamp(220px, 28vw, 360px);
		aspect-ratio: 1;
	}
</style>
