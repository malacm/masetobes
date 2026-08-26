/**
 * Rewrites siteSettings.aboutContent as structured portable text.
 *
 * The field had been filled by pasting plain text into a single block, which
 * meant the client list rendered inline ("• Potato Head • Buck Mason • …") and
 * the contact line appeared twice — once as prose, once as the overlay's own
 * clickable one. The Figma about overlay (node 1:40520) wants one client per
 * line, "Zero Studios" in the accent colour, and a single contact line.
 *
 * Run once; after this Mason edits the field normally in /studio, which now has
 * a bullet-list button and an "Accent" mark.
 *
 *   node scripts/set-about-content.mjs [--commit] [--expect-rev <rev>]
 *
 * Without --commit it prints what it would write and exits (dry run).
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';

const env = Object.fromEntries(
	fs
		.readFileSync('.env', 'utf8')
		.split('\n')
		.filter((line) => line.includes('=') && !line.trim().startsWith('#'))
		.map((line) => {
			const i = line.indexOf('=');
			return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
		})
);

const args = process.argv.slice(2);
const commit = args.includes('--commit');
const expectRev = args.includes('--expect-rev') ? args[args.indexOf('--expect-rev') + 1] : null;

const client = createClient({
	projectId: env.PUBLIC_SANITY_PROJECT_ID,
	dataset: env.PUBLIC_SANITY_DATASET || 'production',
	apiVersion: '2026-01-01',
	token: env.SANITY_API_WRITE_TOKEN,
	useCdn: false
});

const CLIENTS = [
	'Potato Head',
	'Buck Mason',
	'Western Hydrodynamic Research',
	'Space Available',
	'NFL (Younghoe Koo)',
	'Chiiild',
	'Nusa Caña',
	'Leaves and Flowers',
	'MakerSights',
	'Peace Industry'
];

const span = (_key, text, marks = []) => ({ _type: 'span', _key, text, marks });
const block = (_key, children, extra = {}) => ({
	_type: 'block',
	_key,
	style: 'normal',
	markDefs: [],
	children,
	...extra
});

const ZERO_STUDIOS_URL = 'https://www.zero.nyc/';

// No contact line here on purpose — AboutOverlay renders it so the email can
// open the contact form instead of being inert prose.
const aboutContent = [
	block(
		'bio-intro',
		[
			span('bio-intro-a', 'Mason Tobia is an Art Director and Designer currently working at '),
			// A real link, not the `accent` decorator — LinkMark colours it with the
			// same --accent-link token, so it matches the design either way.
			span('bio-intro-b', 'Zero Studios', ['zero-studios']),
			span('bio-intro-c', '.')
		],
		{
			markDefs: [{ _key: 'zero-studios', _type: 'link', href: ZERO_STUDIOS_URL }]
		}
	),
	block('bio-clients-label', [span('bio-clients-label-s', 'Clients:')]),
	...CLIENTS.map((name, i) =>
		block(`bio-client-${i}`, [span(`bio-client-${i}-s`, name)], {
			listItem: 'bullet',
			level: 1
		})
	)
];

const describe = (blocks) =>
	blocks
		.map(
			(b) =>
				`  ${b.listItem ? '•' : ' '} ${b.children
					.map((c) => (c.marks.length ? `[${c.marks.join(',')}]${c.text}` : c.text))
					.join('')}`
		)
		.join('\n');

const current = await client.fetch('*[_id == "siteSettings"][0]{_rev, aboutContent}');
console.log(`current rev: ${current?._rev} (${current?.aboutContent?.length ?? 0} blocks)`);

if (expectRev && current?._rev !== expectRev) {
	console.error(`ABORT: rev is ${current?._rev}, expected ${expectRev}.`);
	process.exit(1);
}

console.log(`\nwould write ${aboutContent.length} blocks:\n${describe(aboutContent)}`);

if (!commit) {
	console.log('\ndry run — pass --commit to write.');
	process.exit(0);
}

await client.patch('siteSettings').set({ aboutContent }).commit({ returnDocuments: false });

const after = await client.fetch('*[_id == "siteSettings"][0]{_rev, aboutContent}');
console.log(`\ncommitted. new rev: ${after._rev}\n${describe(after.aboutContent)}`);
