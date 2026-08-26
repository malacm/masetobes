<script lang="ts">
	import GalleryItem from './GalleryItem.svelte';
	import type { GalleryItem as GalleryItemType, GalleryItemLayout } from '$lib/sanity/types';

	type Props = {
		items: GalleryItemType[];
	};

	const { items }: Props = $props();

	/* Column spans, straight from the Figma widths at a 1400px content width:
	   1400 / 927 / 808 / 690 / 572 / 453 px. Items auto-flow and wrap once a
	   row's 12 columns are used up, which reproduces every row in the designs:
	   12, 6+6, 8+4, 4+8, 7+5, 5+7 and 4+4+4. */
	const SPAN: Partial<Record<GalleryItemLayout, number>> = {
		full: 12,
		'two-thirds': 8,
		'large-half': 7,
		half: 6,
		'small-half': 5,
		third: 4
	};

	const isLegacyPair = (l: GalleryItemLayout) => l === 'pair-large' || l === 'pair-small';

	/**
	 * `pair-large` / `pair-small` predate the column grid, and their width was
	 * never a property of the item alone — two adjacent pair items formed a row,
	 * splitting it evenly when both carried the same value and asymmetrically
	 * when they differed. So they have to be resolved by adjacency rather than
	 * looked up per item. An unpaired one filled the row, as it used to.
	 */
	const spans = $derived.by<number[]>(() => {
		const out: number[] = [];
		for (let i = 0; i < items.length; i++) {
			const layout = items[i].layout;
			if (!isLegacyPair(layout)) {
				out.push(SPAN[layout] ?? 12);
				continue;
			}
			const next = items[i + 1]?.layout;
			if (next && isLegacyPair(next)) {
				if (layout === next) out.push(6, 6);
				else if (layout === 'pair-large') out.push(7, 5);
				else out.push(5, 7);
				i++;
			} else {
				out.push(12);
			}
		}
		return out;
	});
</script>

<div class="gallery">
	{#each items as item, i (item._key)}
		<div class="cell" style:--span={spans[i]}>
			<GalleryItem {item} />
		</div>
	{/each}
</div>

<style>
	.gallery {
		display: grid;
		grid-template-columns: repeat(var(--grid-cols), 1fr);
		gap: var(--gap-row) var(--gap-col);
		/* Rows are top-aligned in the designs: every item in a Figma row sits at
		   y=0, so a shorter item leaves blank space below it rather than being
		   pushed down to the row's baseline. */
		align-items: start;
		width: 100%;
	}

	.cell {
		grid-column: span var(--span);
		min-width: 0;
	}

	/* Mobile frames stack every item full-width. */
	@media (max-width: 768px) {
		.cell {
			grid-column: 1 / -1;
		}
	}
</style>
