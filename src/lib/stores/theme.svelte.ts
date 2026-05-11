import { browser } from '$app/environment';

export type ThemeName = 'default' | 'alt';

const STORAGE_KEY = 'theme';

function readInitial(): ThemeName {
	if (!browser) return 'default';
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === 'alt' ? 'alt' : 'default';
}

function createTheme() {
	// initial DOM `data-theme` is already set by the FOUC-prevention script in app.html
	let value = $state<ThemeName>(readInitial());

	function set(next: ThemeName) {
		value = next;
		if (browser) {
			document.documentElement.dataset.theme = next === 'alt' ? 'alt' : '';
			localStorage.setItem(STORAGE_KEY, next);
		}
	}

	function toggle() {
		set(value === 'default' ? 'alt' : 'default');
	}

	return {
		get current() {
			return value;
		},
		set,
		toggle
	};
}

export const theme = createTheme();
