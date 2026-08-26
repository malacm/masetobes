/**
 * Theme-icon morphing.
 *
 * The two theme icons used to be stacked `<img>` tags that cross-faded. You
 * cannot animate the innards of an SVG loaded through `<img>` — the document is
 * opaque to the page — so the best that could be done was fade one out while the
 * other faded in, which is why the incoming icon looked like it appeared rather
 * than arrived.
 *
 * So the icons are fetched as text, inlined, and their outlines morphed into
 * each other with MorphSVGPlugin. Both files are fill-only — 5 paths in the
 * default mark, 34 in the alt — with no strokes anywhere, which is why this uses
 * MorphSVG rather than DrawSVG: DrawSVG animates `stroke-dasharray`, and on a
 * shape with no stroke it has nothing to draw.
 *
 * Two shapes with different subpath counts still morph: MorphSVG pairs what it
 * can and collapses the surplus to points, so the extra rings of the alt mark
 * grow out of the star rather than appearing. The transition keeps a light blur
 * over the top, which covers the moment where that pairing is at its roughest.
 *
 * Everything degrades: if the fetch fails, the plugin is missing, or the files
 * are not shapes we can read, `load()` returns null and ThemeToggle keeps the
 * old cross-fade.
 */
import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

gsap.registerPlugin(MorphSVGPlugin);

/** Every icon is normalised into this box so two different viewBoxes can morph. */
const BOX = 100;

export type IconShapes = { default: string; alt: string };

type Target = { el: SVGPathElement; shapes: IconShapes };

const targets = new Set<Target>();

const cache = new Map<string, Promise<string | null>>();

/**
 * Fetch one icon and reduce it to a single path string in a 0–100 box.
 *
 * The paths are concatenated rather than morphed individually: one tween on one
 * element is far easier to reason about than pairing 5 shapes against 34, and
 * MorphSVG handles multi-subpath data natively.
 */
export function loadIconShape(url: string | null | undefined): Promise<string | null> {
	if (!url) return Promise.resolve(null);
	const hit = cache.get(url);
	if (hit) return hit;

	const job = (async () => {
		try {
			const res = await fetch(url);
			if (!res.ok) return null;
			const doc = new DOMParser().parseFromString(await res.text(), 'image/svg+xml');
			const svg = doc.querySelector('svg');
			if (!svg || doc.querySelector('parsererror')) return null;

			// The viewBox is the icon's own coordinate space; everything gets
			// scaled out of it so the two icons share one.
			const [, , vbW, vbH] = (svg.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
			const size = Math.max(vbW || 0, vbH || 0);
			if (!size) return null;

			const shapes = [...svg.querySelectorAll('path, rect, circle, ellipse, polygon, polyline')];
			const parts: string[] = [];

			for (const shape of shapes) {
				// Definition subtrees describe how other things are drawn; they are
				// never painted themselves. Both homepage marks keep a
				// full-viewBox `<rect fill="white">` inside a <clipPath>, and
				// folding that in drew a white square behind the icon.
				if (isDefinition(shape)) continue;

				// No ink of its own.
				const fill = shape.getAttribute('fill');
				if (fill === 'none' || fill === 'transparent') continue;

				// A rect covering the whole viewBox is a backing plate, not part of
				// the mark. It cannot be wanted here even outside <defs>: every
				// subpath shares the one `fill="currentColor"` on the combined
				// path, so a plate could only ever be the same colour as the ink.
				if (isFullBleedRect(shape, vbW, vbH)) continue;

				const path =
					shape.tagName.toLowerCase() === 'path'
						? (shape as SVGPathElement)
						: // convertToPath's signature names the concrete primitives it
							// accepts; the querySelectorAll above only ever yields those.
							(MorphSVGPlugin.convertToPath(
								shape as unknown as SVGRectElement
							)[0] as SVGPathElement);
				const d = path?.getAttribute('d');
				if (d) parts.push(d);
			}

			if (!parts.length) return null;
			return scalePath(parts.join(' '), BOX / size);
		} catch {
			return null;
		}
	})();

	cache.set(url, job);
	return job;
}

/** Inside <defs>, <clipPath>, <mask>, <pattern>, <symbol> or <marker>. */
function isDefinition(el: Element): boolean {
	const skip = new Set(['defs', 'clippath', 'mask', 'pattern', 'symbol', 'marker']);
	for (let node = el.parentElement; node; node = node.parentElement) {
		if (skip.has(node.tagName.toLowerCase())) return true;
	}
	return false;
}

function isFullBleedRect(el: Element, vbW: number, vbH: number): boolean {
	if (el.tagName.toLowerCase() !== 'rect') return false;
	const w = Number(el.getAttribute('width'));
	const h = Number(el.getAttribute('height'));
	return w >= vbW * 0.98 && h >= vbH * 0.98;
}

/**
 * Uniform scale about the origin. A rawPath is an array of subpaths, each a flat
 * list of alternating x/y values, so scaling is just multiplying all of them —
 * no need to walk the path grammar.
 */
function scalePath(d: string, factor: number): string {
	const raw = MorphSVGPlugin.stringToRawPath(d);
	for (const segment of raw) {
		for (let i = 0; i < segment.length; i++) segment[i] *= factor;
	}
	return MorphSVGPlugin.rawPathToString(raw);
}

/**
 * Register a rendered morph path so the theme transition can drive it. There
 * can be more than one on screen — the homepage mark and the footer mark both
 * morph together. Returns a cleanup for the caller's effect.
 */
export function registerMorphTarget(el: SVGPathElement, shapes: IconShapes): () => void {
	const target: Target = { el, shapes };
	targets.add(target);
	return () => {
		gsap.killTweensOf(el);
		targets.delete(target);
	};
}

/** Snap a target to a theme with no animation — used on mount. */
export function syncMorphTargets(toAlt: boolean): void {
	for (const { el, shapes } of targets) {
		el.setAttribute('d', toAlt ? shapes.alt : shapes.default);
	}
}

export function hasMorphTargets(): boolean {
	return targets.size > 0;
}

/**
 * Add the morph to an in-flight theme timeline. Called by playThemeTransition so
 * the shape change is part of the same gesture as the colour sweep rather than a
 * separate animation racing it.
 */
export function addMorphToTimeline(
	tl: gsap.core.Timeline,
	toAlt: boolean,
	position: number,
	duration: number
): void {
	for (const { el, shapes } of targets) {
		tl.to(
			el,
			{
				morphSVG: toAlt ? shapes.alt : shapes.default,
				duration,
				ease: 'power2.inOut'
			},
			position
		);
	}
}
