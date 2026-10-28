/**
 * Following a track's low hits — the kicks and bass notes — as it plays.
 * Tempo data comes from Sanity (scripts/measure-tempo.mjs): `hitTimes` and
 * `hitStrengths`, one strength per time, only where something actually
 * lands. So the hover cursor ripples with the music rather than to a
 * metronome: a syncopated bassline is followed, a breakdown is left alone.
 *
 * `beats`, `bpm` and `beatOffset` are also stored but are not read here.
 */
import type { PlaylistTrack } from '$lib/sanity/types';

export type Hit = { time: number; strength: number };

/**
 * Walks a track's hits as time advances. Each call returns the hits passed
 * since the last one, so a frame that straddles a hit gets it exactly once.
 * A jump backwards (a seek, or a new track) resets the walk.
 */
export function createHitWalker() {
	let track: PlaylistTrack | null | undefined = null;
	let index = 0;
	let last = -1;

	return {
		advance(next: PlaylistTrack | null | undefined, t: number): Hit[] {
			const times = next?.hitTimes;
			const strengths = next?.hitStrengths;
			if (!times || !strengths || times.length === 0) {
				track = next;
				return [];
			}
			if (next !== track || t < last) {
				track = next;
				// Start just past the current time, so taking over mid-track
				// does not fire every hit so far at once.
				index = 0;
				while (index < times.length && times[index] <= t) index++;
			}
			last = t;
			const out: Hit[] = [];
			while (index < times.length && times[index] <= t) {
				out.push({ time: times[index], strength: strengths[index] ?? 1 });
				index++;
			}
			return out;
		},
		reset() {
			track = null;
			index = 0;
			last = -1;
		}
	};
}
