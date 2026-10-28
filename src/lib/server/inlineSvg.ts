/**
 * Fetches an SVG asset as text so it can be rendered inline rather than
 * through <img>. An SVG behind <img> is opaque to the page — nothing inside it
 * can be animated — which is the same reason the theme icons are inlined (see
 * animations/iconMorph.ts). This runs on the server: the CDN has no CORS
 * header for localhost, so a client-side fetch fails in dev, while a server
 * fetch has no origin to check.
 *
 * The markup is cleaned before it is trusted with {@html}: scripts, event
 * handlers and script URLs are stripped, every id is suffixed with the item's
 * key so two inlined files cannot capture each other's clip paths, and the
 * exported width/height are dropped so the viewBox alone sizes it.
 */
import { rawImageUrl } from '$lib/sanity/image';
import type { GalleryItem } from '$lib/sanity/types';

const cache = new Map<string, Promise<string | null>>();

export async function fetchSvgMarkup(item: GalleryItem): Promise<string | null> {
	const url = rawImageUrl(item.image);
	if (!url || !url.endsWith('.svg')) return null;

	let job = cache.get(url);
	if (!job) {
		job = fetch(url)
			.then((res) => (res.ok ? res.text() : null))
			.catch(() => null);
		cache.set(url, job);
	}
	const text = await job;
	if (!text) {
		cache.delete(url);
		return null;
	}
	return clean(text, item._key);
}

function clean(svg: string, key: string): string | null {
	// Only the <svg> element and what is inside it — no XML prologue, no
	// comments or doctype ahead of it.
	const start = svg.indexOf('<svg');
	const end = svg.lastIndexOf('</svg>');
	if (start < 0 || end < 0) return null;
	let out = svg.slice(start, end + '</svg>'.length);

	out = out
		.replace(/<script[\s\S]*?<\/script>/gi, '')
		.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
		.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, '')
		.replace(/\s+(xlink:)?href\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, '');

	// Namespace the ids. Figma exports `clip0_12_16` style ids that two files
	// from the same export can share.
	const suffix = `-${key.replace(/[^a-zA-Z0-9_-]/g, '')}`;
	out = out
		.replace(/\bid="([^"]+)"/g, (_, id) => `id="${id}${suffix}"`)
		.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${id}${suffix})`)
		.replace(/\b(xlink:)?href="#([^"]+)"/g, (_, ns = '', id) => `${ns}href="#${id}${suffix}"`);

	// The exported size and the `none` aspect handling would fight the CSS
	// box; with only a viewBox the element scales like an image.
	out = out.replace(/<svg\b([^>]*)>/, (_, attrs: string) => {
		const kept = attrs
			.replace(/\s+(width|height)="[^"]*"/g, '')
			.replace(/\s+preserveAspectRatio="[^"]*"/g, '')
			.replace(/\s+style="[^"]*"/g, '');
		return `<svg${kept}>`;
	});

	return out;
}
