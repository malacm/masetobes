<script lang="ts">
	import { page } from '$app/state';
	import { onNavigate, afterNavigate } from '$app/navigation';
	import { startSmoothScroll, type SmoothScroll } from '$lib/animations/smoothScroll';
	import 'lenis/dist/lenis.css';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import AboutOverlay from '$lib/components/AboutOverlay.svelte';
	import MusicPlayer from '$lib/components/MusicPlayer.svelte';

	let { data, children } = $props();

	const settings = $derived(data.siteSettings);
	const isHome = $derived(page.url.pathname === '/');

	/*
	  Page transition. There is no scroll-driven motion anywhere on the site any
	  more — content does not react to the reader moving through a page. The only
	  motion is between pages: a glass veil frosts over the content, the swap
	  happens behind it, and it clears.

	  It is the same vocabulary as the rest of the site — the nav pills, the work
	  hover panel and the about overlay are all backdrop blur over a wash — and
	  because the veil is `position: fixed` the blur only ever costs the viewport,
	  not the full height of a 20,000px gallery.

	  Out is a little slower than in: covering should feel decisive, uncovering
	  should feel like it is getting out of the way.
	*/
	const VEIL_IN_MS = 220;

	let covering = $state(false);

	/* Smooth scrolling lives here rather than in the root layout so it never
	   touches the Sanity Studio, which owns its own scrolling. */
	let scroller: SmoothScroll | null = null;

	$effect(() => {
		scroller = startSmoothScroll();
		return () => {
			scroller?.destroy();
			scroller = null;
		};
	});

	onNavigate((navigation) => {
		// Leaving the app entirely — the veil would just flash before a white
		// browser paint.
		if (navigation.willUnload) return;
		// Same-page hash links swap no content.
		if (navigation.to?.url.pathname === navigation.from?.url.pathname) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		covering = true;
		// SvelteKit holds the DOM swap until this resolves, so the new page is
		// only ever revealed from behind a fully opaque veil.
		return new Promise((resolve) => setTimeout(resolve, VEIL_IN_MS));
	});

	// Fires once the incoming page has rendered — including on first load, where
	// `covering` is already false and this is a no-op.
	afterNavigate(() => {
		// Both happen while the veil still covers, so the reader never sees the
		// jump. Lenis caches the document height, so a taller or shorter page
		// has to be re-measured or the scroll range is wrong until the next
		// resize event.
		scroller?.toTop();
		scroller?.resize();
		covering = false;
	});
</script>

<svelte:head>
	<title>{settings?.name ?? 'Mason Tobia'}</title>
</svelte:head>

<Nav name={settings?.name} />

<main class="page" data-home={isHome}>
	{@render children()}
</main>

{#if !isHome}
	<Footer
		wordmark={settings?.footerWordmark}
		wordmarkAsset={settings?.footerWordmarkAsset}
		iconDefault={settings?.themeIconFooterDefault ?? settings?.themeIconDefault}
		iconAlt={settings?.themeIconFooterAlt ?? settings?.themeIconAlt}
	/>
{/if}

<MusicPlayer tracks={settings?.playlist ?? []} collapsible={!isHome} />

<AboutOverlay content={settings?.aboutContent} contactEmail={settings?.contactEmail} />

<div class="veil" class:covering aria-hidden="true"></div>

<style>
	/* Above the page content, below the two pieces of persistent chrome — the
	   music player (30) and the nav (50). Those stay sharp while the content
	   swaps underneath, which is what makes the change read as one page
	   rearranging itself rather than a whole new document arriving. */
	.veil {
		position: fixed;
		inset: 0;
		z-index: 25;
		background: var(--bg);
		backdrop-filter: blur(var(--veil-blur));
		-webkit-backdrop-filter: blur(var(--veil-blur));
		opacity: 0;
		pointer-events: none;
		transition: opacity 280ms ease-out;
	}

	.veil.covering {
		opacity: 1;
		/* Matches VEIL_IN_MS above: the cover has to be complete before the DOM
		   swaps, or the reader sees the old page cut to the new one. */
		transition-duration: 220ms;
		transition-timing-function: ease-in;
	}

	@media (prefers-reduced-motion: reduce) {
		.veil {
			transition: none;
		}
	}

	.page {
		min-height: 100vh;
		/* Figma places the first block of content at y=235 on desktop and
		   y=102 on mobile, measured from the top of the page. */
		padding: var(--content-top) var(--page-pad-x) 0;
	}

	.page[data-home='true'] {
		min-height: 100vh;
		height: 100vh;
		overflow: hidden;
		padding: 0;
	}

	:global(body:has([data-home='true'])) {
		overflow: hidden;
	}
</style>
