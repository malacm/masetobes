import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';
import { sanityConfig } from './client';

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

export function fileUrl(ref: string | undefined | null): string | null {
	if (!ref) return null;
	const [, id, ext] = ref.match(/^file-([a-f0-9]+)-(\w+)$/) ?? [];
	if (!id || !ext) return null;
	return `https://cdn.sanity.io/files/${sanityConfig.projectId}/${sanityConfig.dataset}/${id}.${ext}`;
}
