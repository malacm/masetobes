<script lang="ts">
	import { imageUrl, imageSrcset, fileUrl } from '$lib/sanity/image';
	import Gallery from '$lib/components/Gallery.svelte';
	import PortableText from '$lib/components/PortableText.svelte';

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
	<div class="top-grid">
		{#if project.tagline}
			<h1 class="tagline">{project.tagline}</h1>
		{/if}

		<!-- Info blocks sit at columns 9 and 12 of the 12-column grid: their
		     titles share the first row with the tagline, their items share the
		     third row with the description. On mobile they leave the grid and
		     become a single `role … year` row below the header, so they are
		     wrapped — the wrapper is `display: contents` on desktop, keeping
		     both blocks direct children of the grid. -->
		<div class="meta-row">
			{#each project.infoBlocks ?? [] as block, i (block._key)}
				<section
					class="info-block"
					style:--col={9 + i * 3}
					style:--span={i === 0 ? 3 : 1}
				>
					<h3 class="info-title">{block.title}</h3>
					<ul class="info-items">
						{#each block.items ?? [] as item, j (j)}
							<li>{item}</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>

		<hr class="rule" />

		<section class="description">
			<PortableText value={project.description} />
		</section>
	</div>

	{#if hasHero}
		<div class="hero">
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

	/* Both wrappers are transparent to the grid on desktop — title and items
	   become direct grid children and get positioned individually. */
	.meta-row,
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

	/* The statement's size belongs to the design, not to whichever block style
	   the copy happens to carry — Dome's is authored as a heading in Sanity, and
	   the browser's default `h1 { font-size: 2em }` was doubling it to 96px on
	   mobile and 192px on desktop. */
	.description :global(p),
	.description :global(h1),
	.description :global(h2),
	.description :global(h3),
	.description :global(h4) {
		font-size: inherit;
		font-weight: inherit;
		line-height: inherit;
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

	/* Mobile: title, rule and statement stack 8px apart, then role and year
	   sit on one `space-between` row a section-break below them. */
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

		.meta-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			order: 4;
			/* The design sets 60px between the statement and this row; the
			   column's own 8px gap supplies part of it. */
			margin-top: calc(var(--section-gap) - 8px);
		}

		.info-block {
			display: flex;
			align-items: center;
			gap: 10px;
		}

		.info-title,
		.info-items {
			font-size: 0.6rem; /* 12px */
			line-height: normal;
			align-self: center;
		}

		.info-items {
			flex-direction: row;
			gap: 5px;
			/* The design keeps this on one line. Wrapping is a safety valve for
			   a project with more roles than any of the current seven. */
			flex-wrap: wrap;
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

	@media (max-width: 768px) {
		.hero,
		.gallery-wrap {
			margin-top: var(--gap-row);
		}
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
		/* The design gives this row a 20px box at 20px type — body line-height
		   was making it 28px and dropping the links 4px below the label. */
		line-height: 1;
	}

	.credits-links a {
		color: var(--accent-link);
		transition: filter 180ms ease;
	}

	.credits-links a:hover {
		filter: blur(var(--text-blur));
	}

	/* Mobile keeps the desktop shape rather than stacking: the label and the
	   names sit inline on the left, the two links stay pinned right. */
	@media (max-width: 768px) {
		.credits {
			font-size: 0.6rem; /* 12px */
		}

		.credits-grid {
			display: flex;
			align-items: flex-start;
			gap: 10px;
		}

		.credits-label,
		.credits-list {
			line-height: normal;
		}

		/* Pushes the links to the right edge without needing the label and the
		   names to be a nested wrapper of their own. */
		.credits-links {
			margin-left: auto;
			gap: 10px;
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
		/* prefixed first — see the note on --pill-blur in tokens.css */
		-webkit-backdrop-filter: blur(var(--pill-blur));
		backdrop-filter: blur(var(--pill-blur));
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
		/* 30px pill + the 8px the design leaves before the closing rule. */
		.pager {
			min-height: 38px;
		}

		/* Not the mobile nav pill: the design holds the 5px radius here and
		   pads by 5px, where the nav drops to 3px/6px. */
		.pager-link {
			height: 30px;
			padding: 0 5px;
			border-radius: 5px;
			font-size: 1rem; /* 20px */
		}
	}
</style>
