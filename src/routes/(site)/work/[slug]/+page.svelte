<script lang="ts">
	import { imageUrl } from '$lib/sanity/image';
	import Gallery from '$lib/components/Gallery.svelte';
	import PortableText from '$lib/components/PortableText.svelte';

	let { data } = $props();

	const { project, neighbors } = $derived(data);

	const hasCredits = $derived(
		(project.collaborators?.length ?? 0) > 0 ||
			Boolean(project.instagramUrl) ||
			Boolean(project.websiteUrl)
	);
</script>

<article class="project">
	<div class="top-grid">
		{#if project.tagline}
			<h1 class="tagline">{project.tagline}</h1>
		{/if}

		{#each project.infoBlocks ?? [] as block, i (block._key)}
			<section class="info-block" style:--col={i + 2} style:--mobile-order={4 + i}>
				<h3 class="info-title">{block.title}</h3>
				<ul class="info-items">
					{#each block.items ?? [] as item, j (j)}
						<li>{item}</li>
					{/each}
				</ul>
			</section>
		{/each}

		<hr class="rule" />

		<section class="description">
			<PortableText value={project.description} />
		</section>
	</div>

	{#if project.heroImage}
		<div class="hero">
			<img src={imageUrl(project.heroImage, { width: 2400 }) ?? ''} alt={project.title} />
		</div>
	{/if}

	{#if project.galleryItems && project.galleryItems.length > 0}
		<div class="gallery-wrap">
			<Gallery items={project.galleryItems} />
		</div>
	{/if}

	{#if hasCredits}
		<section class="credits">
			<div class="credits-grid">
				<div class="credits-label">collaborators</div>
				<div class="credits-list">
					{#each project.collaborators ?? [] as name (name)}
						<div>{name}</div>
					{/each}
				</div>
				<div class="credits-links">
					{#if project.instagramUrl}
						<a href={project.instagramUrl} target="_blank" rel="noopener">instagram</a>
					{/if}
					{#if project.websiteUrl}
						<a href={project.websiteUrl} target="_blank" rel="noopener">website</a>
					{/if}
				</div>
			</div>
		</section>
	{/if}

	<nav class="pager" aria-label="project navigation">
		{#if neighbors.prev}
			<a class="pager-link" href={`/work/${neighbors.prev.slug}`}>← prev</a>
		{:else}
			<span class="pager-link disabled">← prev</span>
		{/if}
		{#if neighbors.next}
			<a class="pager-link" href={`/work/${neighbors.next.slug}`}>next →</a>
		{:else}
			<span class="pager-link disabled">next →</span>
		{/if}
	</nav>
</article>

<style>
	.project {
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding-top: 12vh;
		padding-bottom: 24px;
	}

	.top-grid {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		grid-template-rows: auto auto auto;
		column-gap: var(--gap-col);
		row-gap: 8px;
		padding-bottom: 12vh;
	}

	.tagline {
		grid-row: 1;
		grid-column: 1;
		font-size: 2.4rem; /* 48px at 20px base */
		font-weight: 700;
		color: var(--fg);
		line-height: 1;
		margin: 0;
		align-self: end;
	}

	/* Wrapper is transparent to the grid on desktop — title and items
	   become direct grid children and get positioned individually. */
	.info-block {
		display: contents;
	}

	.info-title {
		grid-row: 1;
		grid-column: var(--col);
		font-size: 1rem; /* 20px base */
		font-weight: 700;
		color: var(--fg);
		line-height: 1;
		margin: 0;
		align-self: end;
	}

	.rule {
		grid-row: 2;
		grid-column: 1 / -1;
		border-top: 1px solid var(--fg);
		margin: 0;
	}

	.description {
		grid-row: 3;
		grid-column: 1;
		font-size: clamp(2rem, 5vw, 3rem); /* up to 60px (3rem) at 20px base */
		font-weight: 700;
		line-height: 1;
		color: var(--fg);
	}

	.description :global(p) {
		margin: 0;
	}

	.info-items {
		grid-row: 3;
		grid-column: var(--col);
		font-size: 1rem;
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-weight: 700;
		color: var(--fg);
		list-style: none;
		padding: 0;
		margin: 0;
	}

	/* Mobile: stack everything in a single column. The info-blocks become
	   flex rows so each title sits inline with its items. */
	@media (max-width: 768px) {
		.project {
			padding-top: 8vh;
		}

		.top-grid {
			display: flex;
			flex-direction: column;
			gap: 16px;
			padding-bottom: 6vh;
		}

		.tagline {
			order: 1;
			grid-row: auto;
			grid-column: auto;
			font-size: 1.4rem;
		}

		.rule {
			order: 2;
			grid-row: auto;
			grid-column: auto;
		}

		.description {
			order: 3;
			grid-row: auto;
			grid-column: auto;
			font-size: clamp(1.6rem, 6vw, 2.4rem);
		}

		.info-block {
			display: flex;
			flex-wrap: wrap;
			gap: 8px 12px;
			align-items: baseline;
			order: var(--mobile-order);
		}

		.info-title {
			grid-row: auto;
			grid-column: auto;
			align-self: baseline;
		}

		.info-items {
			grid-row: auto;
			grid-column: auto;
			flex-direction: row;
			flex-wrap: wrap;
			gap: 6px 12px;
		}
	}

	.hero {
		margin-top: 16px;
	}

	.hero img {
		width: 100%;
		height: auto;
	}

	.gallery-wrap {
		margin-top: 8px;
	}

	.credits {
		margin-top: 0;
		color: var(--fg);
	}

	.credits-grid {
		display: grid;
		grid-template-columns: minmax(140px, 1fr) 4fr auto;
		column-gap: var(--gap-col);
		align-items: start;
	}

	.credits-label {
		font-weight: 700;
		color: var(--fg);
	}

	.credits-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.credits-links {
		display: flex;
		gap: 24px;
		justify-content: flex-end;
	}

	.credits-links a {
		color: var(--accent-link);
		font-weight: 700;
		transition: filter 180ms ease;
	}

	.credits-links a:hover {
		filter: blur(3px);
	}

	.pager {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-top: 96px;
		margin-bottom: 32px;
		font-size: clamp(28px, 3.2vw, 44px);
		font-weight: 600;
		line-height: 1;
	}

	.pager-link {
		color: var(--fg);
	}

	.pager-link:hover {
		opacity: 0.7;
	}

	.pager-link.disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.pager-link.disabled:hover {
		opacity: 0.3;
	}
</style>
