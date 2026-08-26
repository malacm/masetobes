<script lang="ts">
	import { tick } from 'svelte';
	import { page } from '$app/state';
	import { onNavigate, afterNavigate } from '$app/navigation';
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

	  The first version ran 220/280ms and faded the element's opacity. Both were
	  wrong. 220ms is too quick to register, and — the real bug — fading an
	  element that carries a `backdrop-filter` blends the filtered backdrop with
	  the unfiltered one, so at half opacity the page underneath is still sharp.
	  The frost only ever arrived in the last instant, which is why the whole
	  thing read as content vanishing and reappearing rather than dissolving.

	  So the element's opacity now stays at 1 throughout and the **blur radius**
	  is what animates. The page visibly defocuses, and the wash arrives with it.

	  Two states rather than one, because a `backdrop-filter` that is always on
	  costs a compositing pass on every frame the reader scrolls: `armed` puts
	  the element on screen doing nothing (blur 0), `active` runs the ramp. At
	  rest it carries no filter at all.

	  Out is slower than in: covering should feel decisive, uncovering should feel
	  like it is getting out of the way.
	*/
	const VEIL_IN_MS = 380;
	const VEIL_OUT_MS = 520;

	let armed = $state(false);
	let active = $state(false);
	let veilEl: HTMLDivElement | undefined = $state();

	onNavigate(async (navigation) => {
		// Leaving the app entirely — the veil would just flash before the
		// browser's own paint.
		if (navigation.willUnload) return;
		// Same-page hash links swap no content.
		if (navigation.to?.url.pathname === navigation.from?.url.pathname) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		armed = true;
		// The `from` state has to be committed before the `to` state is set, or
		// there is nothing to interpolate and the frost snaps on. `tick()` gets
		// the class into the DOM; reading a layout property then forces the style
		// flush. Deliberately not `requestAnimationFrame` — that never fires in a
		// background tab, which left the veil armed at blur(0) and stuck there.
		await tick();
		void veilEl?.offsetHeight;
		active = true;

		// SvelteKit holds the DOM swap until this resolves, so the new page is
		// only ever revealed from behind a fully frosted veil.
		return new Promise((resolve) => setTimeout(resolve, VEIL_IN_MS));
	});

	// Fires once the incoming page has rendered — including on first load, where
	// nothing is armed and this is a no-op.
	afterNavigate(() => {
		active = false;
		// Hold the element on screen until the clearing ramp has finished, then
		// drop the filter entirely. Skipped if another navigation re-armed it.
		setTimeout(() => {
			if (!active) armed = false;
		}, VEIL_OUT_MS);
	});
</script>

<svelte:head>
	<title>{settings?.name ?? 'Mason Tobia'}</title>
</svelte:head>

<Nav name={settings?.name} />

<main class="page" class:leaving={active} data-home={isHome}>
	{@render children()}
</main>

{#if !isHome}
	<div class="footer-wrap" class:leaving={active}>
		<Footer
			wordmark={settings?.footerWordmark}
			wordmarkAsset={settings?.footerWordmarkAsset}
			iconDefault={settings?.themeIconFooterDefault ?? settings?.themeIconDefault}
			iconAlt={settings?.themeIconFooterAlt ?? settings?.themeIconAlt}
		/>
	</div>
{/if}

<MusicPlayer tracks={settings?.playlist ?? []} collapsible={!isHome} />

<AboutOverlay content={settings?.aboutContent} contactEmail={settings?.contactEmail} />

<div class="veil" class:armed class:active bind:this={veilEl} aria-hidden="true"></div>

<style>
	/* Above the page content, below the two pieces of persistent chrome — the
	   music player (30) and the nav (50). Those stay sharp while the content
	   swaps underneath, which is what makes the change read as one page
	   rearranging itself rather than a whole new document arriving. */
	/* The content's own fade is what actually carries the transition. The veil
	   alone could not: its wash is `--bg`, the same colour as the page, so over
	   the large empty areas of a sparse dark page it changed nothing and the
	   whole thing read as an instant load. Opacity is visible whatever is
	   underneath, and on a wrapper it is compositor-only, so fading a
	   20,000px gallery costs nothing. The veil's blur rides on top of it and
	   supplies the glass character while the content is still visible. */
	.page,
	.footer-wrap {
		opacity: 1;
		transition: opacity 520ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.page.leaving,
	.footer-wrap.leaving {
		opacity: 0;
		transition-duration: 380ms;
		transition-timing-function: cubic-bezier(0.6, 0, 0.35, 1);
	}

	@media (prefers-reduced-motion: reduce) {
		.page,
		.footer-wrap {
			transition: none;
		}
	}

	.veil {
		position: fixed;
		inset: 0;
		z-index: 25;
		pointer-events: none;
		/* No filter and nothing painted at rest, so a reader who is just
		   scrolling never pays for a viewport-sized compositing pass. */
		visibility: hidden;
		background-color: transparent;
	}

	/* On screen, but doing nothing yet — this is the `from` state the ramp
	   interpolates out of. */
	.veil.armed {
		visibility: visible;
		backdrop-filter: blur(0px);
		-webkit-backdrop-filter: blur(0px);
		/* Uncovering: quintic ease-out, so the new page is legible early and the
		   last of the frost lifts off it. */
		transition:
			background-color 520ms cubic-bezier(0.22, 1, 0.36, 1),
			backdrop-filter 520ms cubic-bezier(0.22, 1, 0.36, 1),
			-webkit-backdrop-filter 520ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.veil.armed.active {
		background-color: var(--veil-bg);
		backdrop-filter: blur(var(--veil-blur));
		-webkit-backdrop-filter: blur(var(--veil-blur));
		/* Matches VEIL_IN_MS: the cover has to be complete before the DOM swaps,
		   or the reader sees the old page cut to the new one. */
		transition-duration: 380ms;
		transition-timing-function: cubic-bezier(0.6, 0, 0.35, 1);
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
