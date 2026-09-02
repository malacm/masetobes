/**
 * Transitions for the about overlay, in the vocabulary of the page veil in
 * src/routes/(site)/+layout.svelte: the glass frosts over the page — blur
 * radius and wash ramping together — while the content fades in behind it,
 * and on close the frost lifts and the content fades out.
 *
 * As with the veil, the **blur radius** is what animates on the glass, never
 * the element's opacity. Fading an element that carries a backdrop-filter
 * blends the filtered backdrop with the unfiltered one, so at half opacity
 * the page underneath is still sharp and the frost only ever arrives in the
 * last instant.
 *
 * In is quicker and decisive, out is slower and gets out of the way — the
 * veil's 380ms / 520ms and its two curves. `cubicInOut` stands in for the
 * veil's `cubic-bezier(0.6, 0, 0.35, 1)`, and `quintOut` is exactly its
 * `cubic-bezier(0.22, 1, 0.36, 1)`. Under prefers-reduced-motion both collapse
 * to an instant swap.
 */
import { cubicInOut, quintOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

export const FROST_IN_MS = 380;
export const FROST_OUT_MS = 520;

type Options = { direction: 'in' | 'out' | 'both' };

const reducedMotion = (): boolean =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Duration and curve for the direction the directive is running in. */
function timing(direction: Options['direction']): Pick<TransitionConfig, 'duration' | 'easing'> {
	if (reducedMotion()) return { duration: 0 };
	return direction === 'out'
		? { duration: FROST_OUT_MS, easing: quintOut }
		: { duration: FROST_IN_MS, easing: cubicInOut };
}

/** `rgb(…)` / `rgba(…)` from getComputedStyle → channels and alpha. */
function parseRgb(value: string): { r: number; g: number; b: number; a: number } | null {
	const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/.exec(value);
	if (!m) return null;
	const alpha = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
	return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: alpha };
}

/**
 * The glass. Reads the element's resting blur and wash from the stylesheet and
 * ramps both from nothing, so the component's tokens stay the single source of
 * what the frost looks like.
 */
export function frost(node: Element, _params: unknown, { direction }: Options): TransitionConfig {
	const style = getComputedStyle(node);
	const filter = style.backdropFilter || style.getPropertyValue('-webkit-backdrop-filter') || '';
	const blur = parseFloat(/blur\(\s*([\d.]+)px\s*\)/.exec(filter)?.[1] ?? '0');
	const wash = parseRgb(style.backgroundColor);

	return {
		...timing(direction),
		css: (t) => {
			const radius = `blur(${(t * blur).toFixed(2)}px)`;
			const color = wash ? `rgba(${wash.r}, ${wash.g}, ${wash.b}, ${(t * wash.a).toFixed(3)})` : '';
			return (
				`-webkit-backdrop-filter: ${radius}; backdrop-filter: ${radius};` +
				(color ? ` background-color: ${color};` : '')
			);
		}
	};
}

/** The content over the glass: a plain fade on the same clock. */
export function reveal(_node: Element, _params: unknown, { direction }: Options): TransitionConfig {
	return {
		...timing(direction),
		css: (t) => `opacity: ${t}`
	};
}
