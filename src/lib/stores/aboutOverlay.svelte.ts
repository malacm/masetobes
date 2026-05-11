type View = 'bio' | 'form';

function createAboutOverlay() {
	let open = $state(false);
	let view = $state<View>('bio');

	function show() {
		view = 'bio';
		open = true;
	}

	function hide() {
		open = false;
	}

	function toggle() {
		if (open) hide();
		else show();
	}

	function showForm() {
		view = 'form';
	}

	function showBio() {
		view = 'bio';
	}

	return {
		get open() {
			return open;
		},
		get view() {
			return view;
		},
		show,
		hide,
		toggle,
		showForm,
		showBio
	};
}

export const aboutOverlay = createAboutOverlay();
