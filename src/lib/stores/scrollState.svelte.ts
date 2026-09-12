/**
 * Whether the page is currently being flung. Set by the smooth scroller, read
 * by anything whose per-frame work competes with painting a fast scroll —
 * today that is the gallery videos, which pause while this is true.
 */
function createScrollState() {
	let fast = $state(false);

	return {
		get fast() {
			return fast;
		},
		set fast(value: boolean) {
			fast = value;
		}
	};
}

export const scrollState = createScrollState();
