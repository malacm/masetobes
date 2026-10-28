/**
 * Whether the site's chrome — the nav and the music player — has been let in
 * yet. On a hard load it is held back for a beat so the homepage mark has the
 * screen to itself, pulsing, before the chrome fades and grows in around it.
 * The (site) layout decides when; Nav and MusicPlayer follow.
 *
 * Flips once per hard load, in the browser only, and stays flipped through
 * client-side navigation. On the server it is never flipped, so every page is
 * served with the chrome in its held-back state and nothing can flash in
 * before the JavaScript takes over.
 */
function createEntrance() {
	let revealed = $state(false);
	return {
		get revealed() {
			return revealed;
		},
		reveal() {
			revealed = true;
		}
	};
}

export const entrance = createEntrance();
