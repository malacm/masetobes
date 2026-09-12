<script lang="ts">
	import Gallery from '$lib/components/Gallery.svelte';

	let { data } = $props();

	const items = $derived(data.personal?.galleryItems ?? []);
</script>

{#if items.length === 0}
	<p class="empty">no items yet — head to <a href="/studio">/studio</a> to add some.</p>
{:else}
	<!-- Section break before the footer's rule, as on the project page. -->
	<div class="gallery-wrap">
		<Gallery {items} />
	</div>
{/if}

<style>
	.gallery-wrap {
		margin-bottom: var(--section-gap);
	}

	.empty {
		font-size: 18px;
		color: var(--fg);
		opacity: 0.7;
	}

	.empty a {
		color: var(--accent-link);
	}
</style>
