/**
 * Measures the playlist's tempo so the site can pulse to it — the hover
 * cursor's beat (see src/lib/animations/beat.ts). For every track:
 *
 *   bpm         the felt pulse, refined to 0.05 BPM
 *   beatOffset  seconds into the file of the first beat
 *   beats       every beat's time in seconds, from a grid that is re-phased
 *               every 15s so a live drummer's drift does not pull the pulse
 *               off the music
 *   hitTimes    the low hits — every point on the eighth-note grid where a
 *   hitStrengths  kick or a bass note actually lands, with how hard (0–1).
 *               The site ripples on these rather than on the beat, so a
 *               syncopated bassline is followed and a breakdown or an
 *               ambient intro is left alone rather than metronomed through
 *
 * The method: a spectral-flux onset envelope; the felt tempo level from
 * SEEDS below (a 160 BPM track is felt at 80 — which multiple the pulse
 * should follow is a musical call, settled by ear against three detectors);
 * the exact BPM from the autocorrelation of the envelope at a sixteen-beat
 * lag around that seed, which pins a quantised track to a hundredth of a
 * BPM; then the best grid phase per window. A listen is the real check: the
 * pulse itself shows whether it is right, and `bpm` and `beatOffset` can be
 * corrected by hand in the Studio.
 *
 *   node scripts/measure-tempo.mjs [--commit] [--only <title substring>]
 *
 * Needs ffmpeg on the PATH. Without --commit it prints the results and exits.
 */
import { createClient } from '@sanity/client';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const env = Object.fromEntries(
	fs
		.readFileSync('.env', 'utf8')
		.split('\n')
		.filter((line) => line.includes('=') && !line.trim().startsWith('#'))
		.map((line) => {
			const i = line.indexOf('=');
			return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, '')];
		})
);

const args = process.argv.slice(2);
const commit = args.includes('--commit');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1]?.toLowerCase() : null;

const client = createClient({
	projectId: env.PUBLIC_SANITY_PROJECT_ID,
	dataset: env.PUBLIC_SANITY_DATASET || 'production',
	apiVersion: '2026-01-01',
	token: commit ? env.SANITY_API_WRITE_TOKEN : undefined,
	useCdn: false
});

// ----------------------------------------------------------------- analysis

const SR = 22050;

/* Felt tempo per track title, to the nearest few BPM; the script refines it.
   A track not listed here takes the tempogram's own best guess. */
const SEEDS = {
	'someone else': 120,
	'i ran with you': 103.5,
	'a new spring': 95,
	people: 116,
	'my bell rings': 127,
	'sunset melody': 103.5,
	'cloud watching': 118.5,
	'liquid love': 83,
	'mystery or misery?': 140
};

function decode(file, hop, win) {
	const buf = execFileSync(
		'ffmpeg',
		['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'],
		{ maxBuffer: 1 << 30 }
	);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

function fft(re, im) {
	const n = re.length;
	for (let i = 1, j = 0; i < n; i++) {
		let bit = n >> 1;
		for (; j & bit; bit >>= 1) j ^= bit;
		j ^= bit;
		if (i < j) {
			[re[i], re[j]] = [re[j], re[i]];
			[im[i], im[j]] = [im[j], im[i]];
		}
	}
	for (let len = 2; len <= n; len <<= 1) {
		const ang = (-2 * Math.PI) / len;
		const wr = Math.cos(ang), wi = Math.sin(ang);
		for (let i = 0; i < n; i += len) {
			let cr = 1, ci = 0;
			for (let k = 0; k < len / 2; k++) {
				const a = i + k, b = a + len / 2;
				const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
				re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
				const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
			}
		}
	}
}

/** Spectral flux across log-spaced bands between lo and hi Hz, detrended. */
function onsetEnvelope(pcm, hop, win, { nb = 48, lo = 30, hi = 8000 } = {}) {
	const fps = SR / hop;
	const frames = Math.floor((pcm.length - win) / hop);
	const hann = Float32Array.from({ length: win }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / win));
	const bins = win / 2;
	const edges = Array.from({ length: nb + 1 }, (_, i) => Math.round((lo * Math.pow(hi / lo, i / nb)) / (SR / win)));
	const env = new Float32Array(frames);
	let prev = new Float32Array(nb);
	const re = new Float32Array(win), im = new Float32Array(win);
	for (let f = 0; f < frames; f++) {
		for (let i = 0; i < win; i++) { re[i] = pcm[f * hop + i] * hann[i]; im[i] = 0; }
		fft(re, im);
		const cur = new Float32Array(nb);
		for (let b = 0; b < nb; b++) {
			let s = 0;
			const from = Math.max(1, edges[b]), to = Math.min(bins, Math.max(edges[b] + 1, edges[b + 1]));
			for (let k = from; k < to; k++) s += Math.hypot(re[k], im[k]);
			cur[b] = Math.log1p(10 * s);
		}
		let flux = 0;
		for (let b = 0; b < nb; b++) flux += Math.max(0, cur[b] - prev[b]);
		env[f] = flux;
		prev = cur;
	}
	const out = new Float32Array(frames), R = Math.round(fps * 0.5);
	let s = 0;
	for (let i = 0; i < Math.min(frames, R + 1); i++) s += env[i];
	for (let i = 0; i < frames; i++) {
		const a = i - R - 1, b = i + R;
		if (a >= 0) s -= env[a];
		if (b < frames && b > R) s += env[b];
		const count = Math.min(frames - 1, i + R) - Math.max(0, i - R) + 1;
		out[i] = Math.max(0, env[i] - s / count);
	}
	return out;
}

function autocorrAt(env, lag) {
	const l0 = Math.floor(lag), fr = lag - l0;
	let acc = 0;
	for (let i = 0; i + l0 + 1 < env.length; i++) acc += env[i] * (env[i + l0] * (1 - fr) + env[i + l0 + 1] * fr);
	return acc;
}

/** Candidate tempos, best first, from a prior-weighted tempogram. */
function candidates(env, fps) {
	const rows = [];
	for (let bpm = 40; bpm <= 200; bpm += 0.5) {
		const raw = autocorrAt(env, (60 / bpm) * fps);
		// The pulse reads best between roughly 70 and 140: a narrow prior
		// there picks the felt level among a tempo's multiples.
		const prior = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 105) / 0.55, 2));
		rows.push({ bpm, score: raw * prior });
	}
	const peaks = rows.filter((r, i) => i > 0 && i < rows.length - 1 && r.score > rows[i - 1].score && r.score >= rows[i + 1].score);
	peaks.sort((a, b) => b.score - a.score);
	return peaks.slice(0, 4).map((p) => ({ bpm: p.bpm, rel: +(p.score / peaks[0].score).toFixed(2) }));
}

/**
 * Refines a tempo on the fine envelope by autocorrelating at a sixteen-beat
 * lag: a small error in the period is sixteen times as visible there, so the
 * peak pins the BPM to about a hundredth. ±6% around the seed.
 */
function refine(env, fps, around) {
	const BEATS = 16;
	let best = -1, bestLag = 0;
	const lo = ((60 / (around * 1.06)) * fps) * BEATS, hi = ((60 / (around * 0.94)) * fps) * BEATS;
	for (let lag = lo; lag <= hi; lag += 0.1) {
		const s = autocorrAt(env, lag);
		if (s > best) { best = s; bestLag = lag; }
	}
	// To 0.05 BPM: finer than that is the lag step, not the music.
	return Math.round(((60 * BEATS * fps) / bestLag) * 20) / 20;
}

/** Grid phase (frames) that best lines up with the onsets in [a, b). */
function bestPhase(env, period, a, b) {
	let best = -1, bestP = 0;
	for (let p = 0; p < period; p += 0.25) {
		let s = 0;
		for (let t = a + p; t < b; t += period) {
			const i = Math.floor(t), fr = t - i;
			s += env[i] * (1 - fr) + (env[i + 1] ?? 0) * fr;
		}
		if (s > best) { best = s; bestP = p; }
	}
	return bestP;
}

/**
 * Beats from a grid that is re-phased every WINDOW seconds, each window's
 * phase constrained to within a quarter beat of where the previous window's
 * grid would land, so the map follows drift but never jumps a beat.
 */
function beatMap(env, fps, bpm, seconds) {
	const period = (60 / bpm) * fps;
	const WINDOW = 15;
	const beats = [];
	let phase = bestPhase(env, period, 0, Math.min(env.length, WINDOW * fps));
	let t = phase;
	for (let start = 0; start < seconds; start += WINDOW) {
		const a = Math.round(start * fps), b = Math.min(env.length, Math.round((start + WINDOW) * fps));
		if (start > 0) {
			// Where the running grid lands in this window, then the best
			// phase within ±period/4 of it.
			const expected = ((t - a) % period + period) % period;
			let best = -1, bestP = expected;
			for (let d = -period / 4; d <= period / 4; d += 0.25) {
				const p = ((expected + d) % period + period) % period;
				let s = 0;
				for (let u = a + p; u < b; u += period) { const i = Math.floor(u), fr = u - i; s += env[i] * (1 - fr) + (env[i + 1] ?? 0) * fr; }
				if (s > best) { best = s; bestP = p; }
			}
			t = a + bestP;
			// Keep continuity: step back so the last beat of the previous
			// window and the first of this one are about a period apart.
			while (beats.length && t - beats[beats.length - 1] * fps > period * 1.5) t -= period;
			while (beats.length && t - beats[beats.length - 1] * fps < period * 0.5) t += period;
		}
		for (; t < b; t += period) beats.push(+(t / fps).toFixed(3));
	}
	return beats;
}

/** Low-band (30–150 Hz) level per frame: the sum of bin magnitudes. */
function lowLevel(pcm, hop, win) {
	const frames = Math.floor((pcm.length - win) / hop);
	const hann = Float32Array.from({ length: win }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / win));
	const k0 = Math.max(1, Math.round(30 / (SR / win))), k1 = Math.round(150 / (SR / win));
	const re = new Float32Array(win), im = new Float32Array(win);
	const out = new Float32Array(frames);
	for (let f = 0; f < frames; f++) {
		for (let i = 0; i < win; i++) { re[i] = pcm[f * hop + i] * hann[i]; im[i] = 0; }
		fft(re, im);
		let e = 0;
		for (let k = k0; k <= k1; k++) e += Math.hypot(re[k], im[k]);
		out[f] = e;
	}
	return out;
}

/* A hit below this strength is not stored; the site ripples on what is. */
const HIT_THRESHOLD = 0.35;

/**
 * The low hits: for every point on the eighth-note grid (the beats and their
 * midpoints), how hard a kick or a bass note lands there, 0–1. The 30–150 Hz
 * level right on the point is set against the level a sixteenth earlier: a
 * hit with the previous one decayed scores high, a note held across both
 * scores nothing, and so does silence (an absolute floor at a tenth of the
 * track's strong hits). Scaled so the track's strong hits sit near 1 — the
 * 90th percentile — so the threshold means the same on a soft track as on a
 * loud one. Returns only the points at or over HIT_THRESHOLD.
 */
function lowHits(pcm, beats) {
	const hop = 128, win = 1024;
	const level = lowLevel(pcm, hop, win);
	const fps = SR / hop, reach = Math.round(0.04 * fps);
	const peak = (t) => {
		const c = Math.round(t * fps);
		let m = 0;
		for (let i = Math.max(0, c - reach); i <= Math.min(level.length - 1, c + reach); i++) m = Math.max(m, level[i]);
		return m;
	};
	const grid = [];
	for (let i = 0; i < beats.length; i++) {
		grid.push(beats[i]);
		if (i + 1 < beats.length) grid.push((beats[i] + beats[i + 1]) / 2);
	}
	const on = grid.map(peak);
	const sortedOn = [...on].sort((a, b) => a - b);
	const floor = 0.1 * (sortedOn[Math.floor(sortedOn.length * 0.9)] || 1);
	const raw = grid.map((t, i) => {
		const eighth = i > 0 ? t - grid[i - 1] : (grid[1] ?? t + 0.25) - t;
		if (on[i] < floor) return 0;
		return Math.max(0, on[i] - peak(t - eighth / 2)) / on[i];
	});
	const sorted = [...raw].sort((a, b) => a - b);
	const ref = sorted[Math.floor(sorted.length * 0.9)] || 1;
	const strengths = raw.map((v) => Math.round(Math.min(1, v / ref) * 100) / 100);
	if (process.argv.includes('--dump')) console.log('eighths[0..96]', strengths.slice(0, 96).join(' '));
	const hitTimes = [], hitStrengths = [];
	strengths.forEach((v, i) => {
		if (v >= HIT_THRESHOLD) { hitTimes.push(+grid[i].toFixed(3)); hitStrengths.push(v); }
	});
	return { hitTimes, hitStrengths, gridPoints: grid.length };
}

function analyse(file, seed) {
	const pcm = decode(file);
	const seconds = pcm.length / SR;
	const coarse = onsetEnvelope(pcm, 512, 2048);
	const cands = candidates(coarse, SR / 512);
	const fine = onsetEnvelope(pcm, 128, 1024);
	const bpm = refine(fine, SR / 128, seed ?? cands[0].bpm);
	const beats = beatMap(fine, SR / 128, bpm, seconds);
	const hits = lowHits(pcm, beats);
	// Drift: how far the map strays from a fixed grid through its first beat.
	let maxDrift = 0;
	const period = 60 / bpm;
	for (const b of beats) {
		const n = Math.round((b - beats[0]) / period);
		maxDrift = Math.max(maxDrift, Math.abs(b - (beats[0] + n * period)));
	}
	return { seconds: +seconds.toFixed(1), candidates: cands, bpm, beatOffset: beats[0], beats, ...hits, maxDrift: +maxDrift.toFixed(3) };
}

// ------------------------------------------------------------------- main

const settings = await client.fetch('*[_type=="siteSettings"][0]{_rev, playlist[]{_key, title, artist, bpm, "ref": audio.asset._ref}}');
const tracks = (settings?.playlist ?? []).filter((t) => !only || t.title.toLowerCase().includes(only));
if (!tracks.length) { console.error('No tracks.'); process.exit(1); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tempo-'));
const results = [];
for (const t of tracks) {
	const [, id, ext] = t.ref.match(/^file-([a-f0-9]+)-(\w+)$/) ?? [];
	const url = `https://cdn.sanity.io/files/${env.PUBLIC_SANITY_PROJECT_ID}/${env.PUBLIC_SANITY_DATASET || 'production'}/${id}.${ext}`;
	const file = path.join(tmp, `${id}.${ext}`);
	process.stdout.write(`${t.title} — ${t.artist}: downloading…\r`);
	const res = await fetch(url);
	fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
	process.stdout.write(`${t.title} — ${t.artist}: analysing…   \r`);
	const seed = SEEDS[t.title.trim().toLowerCase()];
	const r = analyse(file, seed);
	results.push({ key: t._key, title: t.title, ...r });
	// Stretches of 4+ seconds with no hit at all.
	const quiet = [];
	for (let i = 1; i < r.hitTimes.length; i++) {
		if (r.hitTimes[i] - r.hitTimes[i - 1] >= 4) quiet.push(`${r.hitTimes[i - 1].toFixed(0)}–${r.hitTimes[i].toFixed(0)}s`);
	}
	console.log(
		`${t.title} — ${t.artist}: ${r.bpm} BPM (seed ${seed ?? 'none'}), first beat ${r.beatOffset}s, ${r.beats.length} beats, drift ≤ ${r.maxDrift}s` +
			`  (tempogram ${r.candidates.map((c) => `${c.bpm}×${c.rel}`).join(' ')})` +
			`\n    ${r.hitTimes.length} low hits on ${r.gridPoints} eighths (${Math.round((100 * r.hitTimes.length) / r.gridPoints)}%), first at ${r.hitTimes[0] ?? '—'}s` +
			(quiet.length ? `, quiet: ${quiet.join(', ')}` : '')
	);
}
fs.rmSync(tmp, { recursive: true, force: true });

if (!commit) {
	console.log('\nDry run — pass --commit to write bpm, beatOffset, beats and the low hits to the playlist.');
	process.exit(0);
}

const backupDir = path.join(process.cwd(), '.backups');
fs.mkdirSync(backupDir, { recursive: true });
const full = await client.fetch('*[_type=="siteSettings"][0]');
fs.writeFileSync(path.join(backupDir, `siteSettings-${Date.now()}.json`), JSON.stringify(full, null, 2));

let patch = client.patch(full._id).ifRevisionId(settings._rev);
for (const r of results) {
	patch = patch.set({
		[`playlist[_key=="${r.key}"].bpm`]: r.bpm,
		[`playlist[_key=="${r.key}"].beatOffset`]: r.beatOffset,
		[`playlist[_key=="${r.key}"].beats`]: r.beats,
		[`playlist[_key=="${r.key}"].hitTimes`]: r.hitTimes,
		[`playlist[_key=="${r.key}"].hitStrengths`]: r.hitStrengths
	});
}
await patch.commit();
console.log(`\nwrote tempo for ${results.length} tracks`);
