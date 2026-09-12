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

<!--
  The closing rule belongs to the footer, not to whatever comes before it, so
  every page ends the same way: rule, wordmark row, page margin. The project
  page's pager used to draw it as its own border, which is why /work and
  /personal had no rule at all.
-->
<footer class="footer">
	<div class="inner">
		<div class="icon">
			<ThemeToggle {iconDefault} {iconAlt} size="100%" ariaLabel="Toggle site theme" />
		</div>

		<div class="wordmark">
			{#if wordmarkUrl}
				<img class="wordmark-asset" src={wordmarkUrl} alt={wordmark} />
			{:else}
				<!-- Text fallback while no wordmark SVG is uploaded. -->
				<span class="text">{wordmark}</span>
			{/if}
			<!-- The year is type, not part of the SVG, so it can be sized per
			     breakpoint: the design doubles its share of the T on mobile. -->
			<span class="year">@{year}</span>
		</div>
	</div>
</footer>

<style>
	.footer {
		/* Proportions of the 1400px desktop content width, measured off the
		   frame: symbol 348.96, gap 38.66, wordmark 1012.38. The 382px mobile
		   frame divides its width identically (95.22 / 10.55 / 276.24), so one
		   set of ratios serves both. */
		--symbol-w: 24.926%;
		--symbol-gap: 2.761%;
		/* Rule → top of the wordmark. */
		--rule-gap: 20px;

		width: 100%;
		padding: 0 var(--page-pad-x) var(--page-pad-y);
	}

	.inner {
		display: grid;
		grid-template-columns: var(--symbol-w) 1fr;
		column-gap: var(--symbol-gap);
		/* The symbol (349) is shorter than the wordmark (362, the G overshoots
		   top and bottom) and the design centres it, so its bottom lands level
		   with the M and the T rather than with the G. */
		align-items: center;
		border-top: 0.5px solid var(--rule);
		padding-top: var(--rule-gap);
	}

	.icon {
		aspect-ratio: 1;
		min-width: 0;
	}

	.wordmark {
		position: relative;
		min-width: 0;
		/* Lets the year be sized in cqw, i.e. as a share of the wordmark's own
		   width, so it tracks the T at every viewport. */
		container-type: inline-size;
		color: var(--fg);
	}

	.wordmark-asset {
		width: 100%;
		height: auto;
	}

	.text {
		display: block;
		font-size: 40cqw;
		line-height: 0.9;
		font-weight: 700;
		letter-spacing: -0.04em;
		/* Left side bearing of Hauss Bold "M", so the fallback sits on the same
		   optical gap as the ink-cropped SVG. */
		margin-left: -0.059em;
	}

	/* Figma: Hauss Bold 20px at a 1012px wordmark, box at x 92.5% / y 21.4% of
	   the wordmark — inside the right counter of the T, under its crossbar. */
	.year {
		position: absolute;
		left: 92.5%;
		top: 21.4%;
		writing-mode: vertical-rl;
		font-size: 1.976cqw;
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: var(--track-tight);
		white-space: nowrap;
	}

	@media (max-width: 768px) {
		.footer {
			--rule-gap: 8px;
		}

		/* 10px at a 276px wordmark — proportionally almost twice the desktop
		   size, which is what keeps it legible in a 77px-wide T. */
		.year {
			left: 94.2%;
			top: 22.3%;
			font-size: 3.62cqw;
		}
	}
</style>
