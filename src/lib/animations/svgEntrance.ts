/**
 * Entrance for the inline SVG artworks in the personal gallery. Each plays
 * once, the first time it comes into view, and never again.
 *
 * The site has no scroll-driven motion (see animations/smoothScroll.ts): the
 * page does not react to where the reader is. This is a one-shot arrival, not
 * a scroll effect — the same thing the page veil does for a whole page, done
 * for one artwork — so it stays inside that rule.
 *
 * One vocabulary, three choreographies. Everything arrives the way the rest
 * of the site does: out of a blur, settling into focus on the veil's curve
 * (power4.out is its cubic-bezier(0.22, 1, 0.36, 1)). The "before" state is
 * the homepage icon's pulse at its extreme — blur(14px), scale 1.05 — so the
 * artworks come to rest from the same place the mark breathes to. Which
 * choreography an artwork gets is read off its structure, so it holds for
 * whatever is uploaded next:
 *
 *   mark     one accent-coloured shape among white ones — today the green
 *            disc and the arrows. The disc blooms from a point at its own
 *            centre, the way the sage theme fills from the centre out, and
 *            the white shapes travel a short way towards it as they resolve,
 *            so the arrows arrive along the direction they point.
 *
 *   strokes  several shapes of one colour — the MGT lettering, five strokes;
 *            OPEN UP, six letters on two lines. They resolve one after
 *            another in reading order, left to right and row by row, the
 *            order a hand would set them down.
 *
 *   settle   a single shape — the LR monogram. It simply comes into focus
 *            from the pulse's extreme, which is exactly the homepage mark
 *            settling.
 *
 * Under prefers-reduced-motion nothing is hidden and nothing moves.
 */
import gsap from 'gsap';
import type { Action } from 'svelte/action';

const EASE = 'power4.out';
const DURATION = 0.9;
const BLUR = 'blur(14px)';
const SCALE = 1.05;
/* How far the white shapes of a mark travel, as a share of the artwork's
   longer side. Enough to read as a direction, not enough to read as a slide. */
const TRAVEL = 0.06;
const STAGGER = 0.12;

const SHAPES = 'path, rect, circle, ellipse, polygon, polyline';

type Shape = { el: SVGGraphicsElement; box: DOMRect; fill: string };

export const svgEntrance: Action<HTMLElement> = (wrap) => {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	const svg = wrap.querySelector('svg');
	if (!svg) return;

	const shapes = collect(svg);
	if (shapes.length === 0) return;

	const tl = build(svg, shapes);
	tl.pause();

	const observer = new IntersectionObserver(
		([entry]) => {
			if (!entry.isIntersecting) return;
			observer.disconnect();
			tl.play();
		},
		{ threshold: 0.3 }
	);
	observer.observe(wrap);

	return {
		destroy() {
			observer.disconnect();
			tl.kill();
		}
	};
};

/** The painted shapes, with their boxes in the SVG's own coordinates. */
function collect(svg: SVGSVGElement): Shape[] {
	const out: Shape[] = [];
	for (const el of svg.querySelectorAll<SVGGraphicsElement>(SHAPES)) {
		if (el.closest('defs, clipPath, mask, pattern, symbol')) continue;
		const fill = (el.getAttribute('fill') ?? '').trim().toLowerCase();
		if (fill === 'none' || fill === 'transparent') continue;
		const box = el.getBBox();
		if (!box.width || !box.height) continue;
		out.push({ el, box, fill });
	}
	return out;
}

const isWhite = (fill: string) =>
	fill === '' || fill === 'white' || fill === '#fff' || fill === '#ffffff' || fill === 'currentcolor';

function build(svg: SVGSVGElement, shapes: Shape[]): gsap.core.Timeline {
	const tl = gsap.timeline();
	const accents = shapes.filter((s) => !isWhite(s.fill));
	const whites = shapes.filter((s) => isWhite(s.fill));

	if (accents.length === 1 && whites.length > 0) {
		mark(tl, svg, accents[0], whites);
	} else if (shapes.length > 1) {
		strokes(tl, shapes);
	} else {
		settle(tl, svg);
	}
	return tl;
}

/* GSAP's `transformOrigin` on SVG children is read in the element's own
   user units when `svgOrigin` is used, which is what lets a shape scale
   about its own centre rather than the SVG's. */
const centre = (box: DOMRect) => `${box.x + box.width / 2} ${box.y + box.height / 2}`;

function mark(tl: gsap.core.Timeline, svg: SVGSVGElement, accent: Shape, whites: Shape[]) {
	const vb = svg.viewBox.baseVal;
	const reach = Math.max(vb.width, vb.height) * TRAVEL;
	const ax = accent.box.x + accent.box.width / 2;
	const ay = accent.box.y + accent.box.height / 2;

	// The disc blooms from a point at its own centre.
	tl.fromTo(
		accent.el,
		{ scale: 0, svgOrigin: centre(accent.box), opacity: 0 },
		{ scale: 1, opacity: 1, duration: 0.7, ease: 'power2.out' },
		0
	);

	// Each white shape starts a short way back along the line from itself to
	// the accent and resolves as it closes the distance.
	for (const s of whites) {
		const sx = s.box.x + s.box.width / 2;
		const sy = s.box.y + s.box.height / 2;
		const dx = ax - sx;
		const dy = ay - sy;
		const len = Math.hypot(dx, dy) || 1;
		tl.fromTo(
			s.el,
			{ x: (-dx / len) * reach, y: (-dy / len) * reach, opacity: 0, filter: BLUR },
			{ x: 0, y: 0, opacity: 1, filter: 'blur(0px)', duration: DURATION, ease: EASE },
			0.15
		);
	}
}

/**
 * Reading order: row by row, left to right. Shapes that overlap vertically by
 * at least half their height share a row — the MGT strokes all do, however
 * far the G hangs, while OPEN sits clear above UP. Plain left-to-right would
 * have interleaved the two lines of OPEN UP.
 */
function readingOrder(shapes: Shape[]): Shape[] {
	const byTop = [...shapes].sort((a, b) => a.box.y - b.box.y);
	const rows: { top: number; bottom: number; shapes: Shape[] }[] = [];
	for (const s of byTop) {
		const row = rows[rows.length - 1];
		const overlap = row ? Math.min(row.bottom, s.box.y + s.box.height) - Math.max(row.top, s.box.y) : 0;
		if (row && overlap >= s.box.height / 2) {
			row.shapes.push(s);
			row.bottom = Math.max(row.bottom, s.box.y + s.box.height);
		} else {
			rows.push({ top: s.box.y, bottom: s.box.y + s.box.height, shapes: [s] });
		}
	}
	return rows.flatMap((r) => r.shapes.sort((a, b) => a.box.x - b.box.x));
}

function strokes(tl: gsap.core.Timeline, shapes: Shape[]) {
	readingOrder(shapes).forEach((s, i) => {
		tl.fromTo(
			s.el,
			{ opacity: 0, filter: BLUR, scale: SCALE, svgOrigin: centre(s.box) },
			{ opacity: 1, filter: 'blur(0px)', scale: 1, duration: DURATION, ease: EASE },
			i * STAGGER
		);
	});
}

function settle(tl: gsap.core.Timeline, svg: SVGSVGElement) {
	tl.fromTo(
		svg,
		{ opacity: 0, filter: BLUR, scale: SCALE, transformOrigin: '50% 50%' },
		{ opacity: 1, filter: 'blur(0px)', scale: 1, duration: DURATION, ease: EASE },
		0
	);
}
