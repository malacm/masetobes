import type { PlaylistTrack } from '$lib/sanity/types';

function createMusicPlayer() {
	let tracks = $state<PlaylistTrack[]>([]);
	let index = $state(0);
	let isPlaying = $state(false);
	/* The <audio> element, for its clock. Not reactive: it is read per frame
	   by whatever pulses to the music, never rendered. */
	let audio: HTMLAudioElement | null = null;

	const current = $derived<PlaylistTrack | null>(tracks[index] ?? null);

	function setTracks(next: PlaylistTrack[]) {
		tracks = next;
		index = 0;
		isPlaying = false;
	}

	function play() {
		if (tracks.length === 0) return;
		isPlaying = true;
	}

	function pause() {
		isPlaying = false;
	}

	function toggle() {
		if (tracks.length === 0) return;
		isPlaying = !isPlaying;
	}

	function next() {
		if (tracks.length === 0) return;
		index = (index + 1) % tracks.length;
	}

	function setPlaying(value: boolean) {
		isPlaying = value;
	}

	function attach(el: HTMLAudioElement | null) {
		audio = el;
	}

	/** Seconds into the current track, straight from the element. */
	function time(): number {
		return audio?.currentTime ?? 0;
	}

	return {
		get tracks() {
			return tracks;
		},
		get index() {
			return index;
		},
		get isPlaying() {
			return isPlaying;
		},
		get current() {
			return current;
		},
		setTracks,
		play,
		pause,
		toggle,
		next,
		setPlaying,
		attach,
		time
	};
}

export const musicPlayer = createMusicPlayer();
