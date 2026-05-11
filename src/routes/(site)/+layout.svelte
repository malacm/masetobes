<script lang="ts">
	import { page } from '$app/state';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import AboutOverlay from '$lib/components/AboutOverlay.svelte';

	let { data, children } = $props();

	const settings = $derived(data.siteSettings);
	const isHome = $derived(page.url.pathname === '/');
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

<AboutOverlay content={settings?.aboutContent} contactEmail={settings?.contactEmail} />

<style>
	.page {
		min-height: 100vh;
		padding: calc(var(--nav-pad-y) * 2 + 32px) var(--page-pad-x) 0;
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
