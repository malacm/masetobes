<script lang="ts">
	import { imageUrl, imageSrcset } from '$lib/sanity/image';
	import type { WorkProjectListItem } from '$lib/sanity/types';

	let { data } = $props();

	/* The hover panel shows the same two info blocks as the project page: the
	   role list on the left, the year on the right. */
	const roles = (p: WorkProjectListItem) => p.infoBlocks?.[0]?.items ?? [];
	const year = (p: WorkProjectListItem) => p.infoBlocks?.[1]?.items?.[0] ?? '';
</script>

{#if data.projects.length === 0}
	<p class="empty">no projects yet — head to <a href="/studio">/studio</a> to add one.</p>
{:else}
	<ul class="grid">
		{#each data.projects as project (project._id)}
			<li class="cell">
				<a class="link" href={`/work/${project.slug.current}`}>
					<!-- Cards are a fixed shape and the thumbnail is cropped to fill
					     it — 4:5 for most, square for WHR and Buck Mason. -->
					<div class="frame" style:aspect-ratio={project.thumbnailRatio ?? 0.8}>
						{#if project.thumbnailImage}
							<img
								class="thumb"
								src={imageUrl(project.thumbnailImage, { width: 1200 }) ?? ''}
								srcset={imageSrcset(project.thumbnailImage, [400, 800, 1200, 1600])}
								sizes="(max-width: 768px) 100vw, 50vw"
								alt={project.title}
								loading="lazy"
								decoding="async"
							/>
						{/if}

						{#if roles(project).length > 0 || year(project)}
							<div class="overlay" aria-hidden="true">
								<div class="roles">
									{#each roles(project) as role (role)}
										<span>{role}</span>
									{/each}
								</div>
								<span class="year">{year(project)}</span>
							</div>
						{/if}
					</div>

					<div class="caption">
						<span class="title">{project.title}</span>
						<span class="plus" aria-hidden="true">+</span>
					</div>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.empty {
		font-size: 18px;
		color: var(--fg);
		opacity: 0.7;
	}

	.empty a {
		color: var(--accent-link);
	}

	/* Two cards per row, 20px apart, with the generous 160px break between
	   rows from the Figma. Cards keep their thumbnail's own proportions and
	   sit on a shared bottom edge, so the captions line up across a row. */
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		column-gap: var(--gap-col);
		row-gap: var(--section-gap);
		align-items: end;
		width: 100%;
	}

	.cell {
		min-width: 0;
	}

	.link {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.frame {
		position: relative;
		width: 100%;
		overflow: hidden;
		background: rgba(0, 0, 0, 0.2);
	}

	/* Absolute so the thumbnail's own proportions can't stretch the box — the
	   card's shape comes from the frame's aspect-ratio and the image is cropped
	   to fill it. */
	.thumb {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Frosted panel over the whole thumbnail on hover. */
	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 20px;
		background: var(--pill-bg);
		/* prefixed first — see the note on --pill-blur in tokens.css */
		-webkit-backdrop-filter: blur(15px);
		backdrop-filter: blur(15px);
		color: var(--fg);
		font-size: 0.8rem; /* 16px at 20px base */
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: var(--track-tight);
		text-transform: lowercase;
		opacity: 0;
		transition: opacity 180ms ease;
	}

	@media (hover: hover) {
		.link:hover .overlay {
			opacity: 1;
		}
	}

	.link:focus-visible .overlay {
		opacity: 1;
	}

	.roles {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.caption {
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: var(--fg);
		transition: filter 180ms ease;
	}

	.title {
		font-size: 1.6rem; /* 32px */
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: var(--track-tight);
	}

	/* The hover frame blurs the whole label row, title and plus together. */
	@media (hover: hover) {
		.link:hover .caption {
			filter: blur(var(--text-blur));
		}
	}

	.link:focus-visible .caption {
		filter: blur(var(--text-blur));
	}

	.plus {
		font-size: 1.2rem; /* 24px */
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: var(--track-tight);
		color: #fff;
	}

	@media (max-width: 768px) {
		.grid {
			grid-template-columns: 1fr;
		}

		.link {
			gap: 8px;
		}

		.title {
			font-size: 1rem; /* 20px */
		}

		.plus {
			font-size: 0.8rem; /* 16px */
		}
	}
</style>
