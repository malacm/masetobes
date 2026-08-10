import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';
import { sanityConfig } from './client';
import type { SanityImageRef } from './types';

const builder = createImageUrlBuilder(sanityConfig);

export function urlFor(source: SanityImageSource) {
	return builder.image(source);
}

export function imageUrl(source: SanityImageSource | undefined | null, opts: { width?: number; quality?: number } = {}): string | null {
	if (!source) return null;
	let b = builder.image(source).auto('format').fit('max');
	if (opts.width) b = b.width(opts.width);
	if (opts.quality) b = b.quality(opts.quality);
	return b.url();
}

/**
 * Build a srcset string from a Sanity image source. The browser picks the
 * closest matching size based on viewport + DPR, so we serve a 600px image
 * to phones instead of a 2400px image.
 */
export function imageSrcset(
	source: SanityImageSource | undefined | null,
	widths: number[] = [640, 1024, 1600, 2400]
): string | undefined {
	if (!source) return undefined;
	return widths
		.map((w) => `${builder.image(source).auto('format').fit('max').width(w).url()} ${w}w`)
		.join(', ');
}

/**
 * Width ÷ height of a Sanity image, read straight from the asset ref (which
 * encodes the dimensions as `image-<hash>-1200x1500-jpg`). No network needed,
 * so a layout can reserve the correct box on the very first render — which
 * keeps images from collapsing to zero height before they load.
 */
export function imageAspectRatio(source: SanityImageRef | undefined | null): number | null {
	const ref = source?.asset?._ref;
	if (!ref) return null;
	const [, w, h] = ref.match(/-(\d+)x(\d+)-\w+$/) ?? [];
	if (!w || !h) return null;
	return Number(w) / Number(h);
}

export function fileUrl(ref: string | undefined | null): string | null {
	if (!ref) return null;
	const [, id, ext] = ref.match(/^file-([a-f0-9]+)-(\w+)$/) ?? [];
	if (!id || !ext) return null;
	return `https://cdn.sanity.io/files/${sanityConfig.projectId}/${sanityConfig.dataset}/${id}.${ext}`;
}
