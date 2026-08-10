<script lang="ts">
	import { imageUrl, imageSrcset, fileUrl } from '$lib/sanity/image';
	import Gallery from '$lib/components/Gallery.svelte';
	import PortableText from '$lib/components/PortableText.svelte';
	import { reveal, revealItems, revealOnEnter, driftOnScroll } from '$lib/animations/reveal';

	/* The header's seven elements stagger over ~0.42s; the first gallery row is
	   on screen too, so it comes in just behind them as one arrival. */
	const GALLERY_DELAY = 0.35;

	let { data } = $props();

	const { project, neighbors } = $derived(data);

	const hasCredits = $derived(
		(project.collaborators?.length ?? 0) > 0 ||
			Boolean(project.instagramUrl) ||
			Boolean(project.websiteUrl)
	);

	const hasHero = $derived(Boolean(project.heroVideo || project.heroImage));
</script>

<article class="project">
	<!-- The info blocks are `display: contents` on desktop, so the reveal has to
	     target the leaf elements rather than the grid's direct children. -->
	<div
		class="top-grid"
		use:driftOnScroll
		use:revealItems={{
			selector: '.tagline, .info-title, .info-items, .rule, .description',
			stagger: 0.07,
			motion: 'blur'
		}}
	>
		{#if project.tagline}
			<h1 class="tagline">{project.tagline}</h1>
		{/if}

		<!-- Info blocks sit at columns 9 and 12 of the 12-column grid: their
		     titles share the first row with the tagline, their items share the
		     third row with the description. -->
		{#each project.infoBlocks ?? [] as block, i (block._key)}
			<section
				class="info-block"
				style:--col={9 + i * 3}
				style:--span={i === 0 ? 3 : 1}
				style:--mobile-order={4 + i}
			>
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

	{#if hasHero}
		<div class="hero" use:reveal={{ delay: GALLERY_DELAY, eager: 1 }}>
			{#if project.heroVideo}
				<video
					class="hero-media"
					src={fileUrl(project.heroVideo.asset?._ref ?? null) ?? ''}
					poster={project.heroVideoPoster
						? (imageUrl(project.heroVideoPoster, { width: 2400 }) ?? undefined)
						: undefined}
					autoplay
					muted
					loop
					playsinline
					preload="metadata"
				></video>
			{:else if project.heroImage}
				<img
					class="hero-media"
					src={imageUrl(project.heroImage, { width: 2400 }) ?? ''}
					srcset={imageSrcset(project.heroImage)}
					sizes="100vw"
					alt={project.title}
					fetchpriority="high"
					decoding="async"
				/>
			{/if}

			{#if project.heroLogo}
				<img
					class="hero-logo"
					data-position={project.heroLogoPosition ?? 'center'}
					style:width={`${project.heroLogoWidth ?? 40}%`}
					src={imageUrl(project.heroLogo, { width: 1200 }) ?? ''}
					alt=""
					decoding="async"
				/>
			{/if}
		</div>
	{/if}

	{#if project.galleryItems && project.galleryItems.length > 0}
		<div class="gallery-wrap" data-after-hero={hasHero}>
			<!-- Whichever comes first is the page's opening image and loads with
			     the header: the hero when there is one, otherwise the gallery's
			     first row. -->
			<Gallery
				items={project.galleryItems}
				revealDelay={GALLERY_DELAY}
				eagerFirstRow={!hasHero}
			/>
		</div>
	{/if}

	{#if hasCredits}
		<section class="credits" use:revealOnEnter>
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

	<nav class="pager" aria-label="project navigation" use:revealOnEnter>
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
	}

	/* Header block: three rows (titles / rule / body) on the 12-column grid,
	   7px apart. */
	.top-grid {
		display: grid;
		grid-template-columns: repeat(var(--grid-cols), 1fr);
		grid-template-rows: auto auto auto;
		column-gap: var(--gap-col);
		row-gap: 7px;
	}

	.tagline {
		grid-row: 1;
		grid-column: 1 / span 8;
		font-size: 2.4rem; /* 48px at 20px base */
		font-weight: 700;
		color: var(--fg);
		line-height: 1.1;
		letter-spacing: var(--track-tight);
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
		grid-column: var(--col) / span var(--span);
		font-size: 1rem; /* 20px */
		font-weight: 700;
		text-transform: lowercase;
		color: var(--fg);
		line-height: 1.3;
		letter-spacing: var(--track-tight);
		margin: 0;
		align-self: end;
	}

	.rule {
		grid-row: 2;
		grid-column: 1 / -1;
		border-top: 0.5px solid var(--rule);
		margin: 0;
	}

	.description {
		grid-row: 3;
		grid-column: 1 / span 6;
		font-size: 4.8rem; /* 96px */
		font-weight: 700;
		line-height: 0.9;
		letter-spacing: var(--track-display);
		color: var(--fg);
		/* Display sizes overflow narrow columns on long words — the Figma text
		   layers carry break-word for the same reason. */
		overflow-wrap: break-word;
	}

	.description :global(p) {
		margin: 0;
	}

	.info-items {
		grid-row: 3;
		grid-column: var(--col) / span var(--span);
		font-size: 1rem;
		display: flex;
		flex-direction: column;
		font-weight: 400;
		text-transform: lowercase;
		line-height: 1.3;
		letter-spacing: var(--track-tight);
		color: var(--fg);
		list-style: none;
		padding: 0;
		margin: 0;
	}

	/* Mobile: stack everything in a single column. The info-blocks become
	   flex rows so each title sits inline with its items. */
	@media (max-width: 768px) {
		.top-grid {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.tagline {
			order: 1;
			font-size: 1.2rem; /* 24px */
			/* The grid's `align-self: end` means "bottom"; in this flex column
			   it would mean "right". */
			align-self: flex-start;
		}

		.rule {
			order: 2;
		}

		.description {
			order: 3;
			font-size: 2.4rem; /* 48px */
		}

		.info-block {
			display: flex;
			flex-wrap: wrap;
			gap: 8px 12px;
			align-items: baseline;
			order: var(--mobile-order);
		}

		.info-title {
			align-self: baseline;
		}

		.info-items {
			flex-direction: row;
			flex-wrap: wrap;
			gap: 6px 12px;
		}
	}

	.hero {
		position: relative;
		margin-top: var(--section-gap);
	}

	.hero-media {
		display: block;
		width: 100%;
		height: auto;
	}

	.hero-logo {
		position: absolute;
		height: auto;
		max-width: 100%;
		pointer-events: none;
		/* Inset distance from corners/edges. */
		--inset: 24px;
	}

	/* Top row */
	.hero-logo[data-position='top-left'] {
		top: var(--inset);
		left: var(--inset);
	}
	.hero-logo[data-position='top-center'] {
		top: var(--inset);
		left: 50%;
		transform: translateX(-50%);
	}
	.hero-logo[data-position='top-right'] {
		top: var(--inset);
		right: var(--inset);
	}

	/* Middle row */
	.hero-logo[data-position='middle-left'] {
		top: 50%;
		left: var(--inset);
		transform: translateY(-50%);
	}
	.hero-logo[data-position='center'] {
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
	.hero-logo[data-position='middle-right'] {
		top: 50%;
		right: var(--inset);
		transform: translateY(-50%);
	}

	/* Bottom row */
	.hero-logo[data-position='bottom-left'] {
		bottom: var(--inset);
		left: var(--inset);
	}
	.hero-logo[data-position='bottom-center'] {
		bottom: var(--inset);
		left: 50%;
		transform: translateX(-50%);
	}
	.hero-logo[data-position='bottom-right'] {
		bottom: var(--inset);
		right: var(--inset);
	}

	/* The hero is the gallery's first row, so it keeps the row gutter. Without
	   a hero the gallery takes the header's section break instead. */
	.gallery-wrap {
		margin-top: var(--section-gap);
	}

	.gallery-wrap[data-after-hero='true'] {
		margin-top: var(--gap-row);
	}

	.credits {
		margin-top: var(--gap-row);
		color: var(--fg);
		font-size: 1rem;
		letter-spacing: var(--track-tight);
	}

	.credits-grid {
		display: grid;
		grid-template-columns: repeat(var(--grid-cols), 1fr);
		column-gap: var(--gap-col);
		align-items: start;
	}

	.credits-label {
		grid-column: 1 / span 2;
		font-weight: 700;
		text-transform: lowercase;
		line-height: 1.1;
		color: var(--fg);
	}

	.credits-list {
		grid-column: 3 / span 7;
		display: flex;
		flex-direction: column;
		font-weight: 400;
		line-height: 1.3;
	}

	.credits-links {
		grid-column: 10 / span 3;
		display: flex;
		gap: 15px;
		justify-content: flex-end;
		font-weight: 700;
		text-transform: lowercase;
	}

	.credits-links a {
		color: var(--accent-link);
		transition: filter 180ms ease;
	}

	.credits-links a:hover {
		filter: blur(var(--text-blur));
	}

	/* Mobile: stack the credits section as Instagram + Website (side by side
	   row at top), then "collaborators" label, then the names list. */
	@media (max-width: 768px) {
		.credits-grid {
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.credits-links {
			order: 1;
			justify-content: flex-start;
			gap: 24px;
		}

		.credits-label {
			order: 2;
			margin-bottom: -8px;
		}

		.credits-list {
			order: 3;
		}
	}

	/* Prev/next are pills in the same treatment as the nav links, with a rule
	   87px below the top of the row closing the page off before the footer. */
	.pager {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-top: var(--section-gap);
		min-height: 87px;
		border-bottom: 0.5px solid var(--rule);
	}

	.pager-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0 var(--pill-pad-x);
		border-radius: var(--pill-radius);
		background: var(--pill-bg);
		backdrop-filter: blur(var(--pill-blur));
		-webkit-backdrop-filter: blur(var(--pill-blur));
		color: var(--pill-fg);
		font-size: 2rem; /* 40px */
		font-weight: 700;
		line-height: normal;
		letter-spacing: var(--track-tight);
		transition: filter 180ms ease;
	}

	.pager-link:hover {
		filter: blur(var(--text-blur));
	}

	.pager-link.disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.pager-link.disabled:hover {
		filter: none;
	}

	@media (max-width: 768px) {
		.pager {
			min-height: 48px;
		}

		.pager-link {
			font-size: 1.1rem; /* 22px */
		}
	}
</style>
