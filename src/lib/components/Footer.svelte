<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';
	import { imageUrl } from '$lib/sanity/image';
	import type { SanityImageRef } from '$lib/sanity/types';

	type Props = {
		wordmark?: string;
		wordmarkAsset?: SanityImageRef;
		iconDefault?: SanityImageRef;
		iconAlt?: SanityImageRef;
	};

	const { wordmark = 'MGT', wordmarkAsset, iconDefault, iconAlt }: Props = $props();

	const year = new Date().getFullYear();
	const wordmarkUrl = $derived(imageUrl(wordmarkAsset, { width: 3000 }));
</script>

<footer class="footer">
	<div class="icon">
		<ThemeToggle {iconDefault} {iconAlt} size="25vw" ariaLabel="Toggle site theme" />
	</div>

	{#if wordmarkUrl}
		<img class="wordmark-asset" src={wordmarkUrl} alt={wordmark} />
	{:else}
		<!-- Text fallback while no wordmark SVG is uploaded. -->
		<div class="wordmark">
			<span class="text">{wordmark}</span>
			<span class="year">©{year}</span>
		</div>
	{/if}
</footer>

<style>
	.footer {
		display: flex;
		align-items: flex-end;
		gap: 0;
		padding: 80px var(--page-pad-x) 16px;
		width: 100%;
	}

	.icon {
		flex-shrink: 0;
	}

	.wordmark-asset {
		flex: 1;
		min-width: 0;
		width: 100%;
		height: auto;
		object-fit: contain;
		object-position: left bottom;
	}

	.wordmark {
		flex: 1;
		display: flex;
		align-items: stretch;
		line-height: 0.78;
		font-weight: 800;
		letter-spacing: -0.04em;
		color: var(--fg);
		min-width: 0;
	}

	.text {
		font-size: 28vw;
		flex: 1;
	}

	.year {
		writing-mode: vertical-rl;
		font-size: clamp(12px, 1.2vw, 22px);
		font-weight: 400;
		letter-spacing: 0;
		padding: 0.3em 0.2em 0 0.2em;
		flex-shrink: 0;
	}
</style>
