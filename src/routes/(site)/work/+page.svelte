<script lang="ts">
	import { imageUrl, imageSrcset } from '$lib/sanity/image';

	let { data } = $props();
</script>

{#if data.projects.length === 0}
	<p class="empty">no projects yet — head to <a href="/studio">/studio</a> to add one.</p>
{:else}
	<ul class="grid">
		{#each data.projects as project (project._id)}
			<li class="cell">
				<a class="link" href={`/work/${project.slug.current}`}>
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
					{:else}
						<div class="thumb thumb--placeholder" aria-hidden="true"></div>
					{/if}
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

	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--gap-row) var(--gap-col);
		width: 100%;
	}

	@media (max-width: 768px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}

	.cell {
		min-width: 0;
	}

	.link {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.thumb {
		width: 100%;
		aspect-ratio: 4 / 5;
		object-fit: cover;
		background: rgba(0, 0, 0, 0.2);
	}

	.thumb--placeholder {
		display: block;
	}

	.caption {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-size: 16px;
		color: var(--fg);
	}

	.plus {
		opacity: 0.7;
	}

	.link:hover .plus {
		opacity: 1;
	}
</style>
