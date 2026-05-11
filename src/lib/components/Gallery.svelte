<script lang="ts">
	import GalleryItem from './GalleryItem.svelte';
	import type { GalleryItem as GalleryItemType } from '$lib/sanity/types';

	type Props = {
		items: GalleryItemType[];
	};

	const { items }: Props = $props();

	type Row = {
		kind: 'full' | 'pair';
		items: GalleryItemType[];
		key: string;
		asymmetric: boolean;
	};

	const isPair = (l: GalleryItemType['layout']) => l === 'pair-large' || l === 'pair-small';

	const rows = $derived.by<Row[]>(() => {
		const result: Row[] = [];
		let i = 0;
		while (i < items.length) {
			const item = items[i];
			const next = items[i + 1];
			if (isPair(item.layout) && next && isPair(next.layout)) {
				const asymmetric = item.layout !== next.layout;
				result.push({
					kind: 'pair',
					items: [item, next],
					key: item._key,
					asymmetric
				});
				i += 2;
			} else {
				result.push({
					kind: 'full',
					items: [item],
					key: item._key,
					asymmetric: false
				});
				i += 1;
			}
		}
		return result;
	});
</script>

<div class="gallery">
	{#each rows as row (row.key)}
		<div class="row" data-kind={row.kind} data-asymmetric={row.asymmetric ? 'true' : 'false'}>
			{#each row.items as item (item._key)}
				<div class="cell" data-layout={item.layout}>
					<GalleryItem {item} />
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.gallery {
		display: flex;
		flex-direction: column;
		gap: var(--gap-row);
		width: 100%;
	}

	.row {
		display: flex;
		gap: var(--gap-col);
		align-items: flex-end;
		width: 100%;
	}

	/* Asymmetric pairs (one large + one small): cells stretch to equal heights
	   so the smaller item sits at the top of its cell with blank space below.
	   Symmetric pairs (same size both sides) keep flex-end alignment + true
	   sizes per the original spec. */
	.row[data-kind='pair'][data-asymmetric='true'] {
		align-items: stretch;
	}

	.row[data-kind='full'] .cell {
		flex: 1;
	}

	.row[data-kind='pair'] .cell {
		flex: 1;
		min-width: 0;
	}

	/* Asymmetric pair: large gets ~62%, small ~38% in document order. */
	.row[data-kind='pair'][data-asymmetric='true'] .cell[data-layout='pair-large'] {
		flex: 1.65;
	}

	.row[data-kind='pair'][data-asymmetric='true'] .cell[data-layout='pair-small'] {
		flex: 1;
	}

	/* Mobile: every paired row collapses to a single-column stack. */
	@media (max-width: 768px) {
		.row[data-kind='pair'] {
			flex-direction: column;
			align-items: stretch;
		}

		.row[data-kind='pair'] .cell {
			flex: 1 1 100%;
			width: 100%;
		}
	}
</style>
