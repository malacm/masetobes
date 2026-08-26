/**
 * Moves the opening image of Potato Head Music and Nusa Caña out of the gallery
 * and into the hero slot, with the wordmark overlay from the design.
 *
 * Both designs open on a full-bleed hero with a logo centred on it. In Sanity
 * both were plain gallery items instead — item #1 of `galleryItems` — which is
 * why neither could take a logo: the overlay fields live on the hero, not on
 * gallery items. Dome already used the hero this way; these two never did.
 *
 * The ratio of each project's first gallery item matches its design hero
 * exactly, which is what confirms the item and the hero are the same picture:
 *
 *   Potato Head Music  1:896   382 x 255.121   = 1.497   item is 2800x1870
 *   Nusa Caña          1:1971  1400 x 787.5    = 1.778   item is 2800x1575
 *
 * The image asset is reused, not re-uploaded — it becomes both `heroImage` (the
 * fallback shown today) and `heroVideoPoster` (the still behind the video once
 * Mason supplies the file). Dropping a video into `heroVideo` is then the only
 * remaining step, and the page switches over on its own.
 *
 *   node scripts/promote-hero.mjs [--commit]
 *
 * Without --commit it prints the plan and exits. Backs up both documents to
 * ./.backups before writing.
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

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

const commit = process.argv.includes('--commit');

const client = createClient({
	projectId: env.PUBLIC_SANITY_PROJECT_ID,
	dataset: env.PUBLIC_SANITY_DATASET || 'production',
	apiVersion: '2026-01-01',
	token: env.SANITY_API_WRITE_TOKEN,
	useCdn: false
});

// Logo geometry read off the design frames: both are centred, and the width is
// the logo's share of the hero's width.
const TARGETS = [
	{
		slug: 'potato-head-music',
		heroNode: '1:896',
		logoNode: '1:899',
		logoFile: 'potato-head-music-logo.svg',
		expectRatio: 1.497,
		logoWidth: 49, // 186.634 / 382
		logoPosition: 'center'
	},
	{
		slug: 'nusa-cana',
		heroNode: '1:1971',
		logoNode: '1:1973',
		logoFile: 'nusa-cana-logo.svg',
		expectRatio: 1.778,
		logoWidth: 32, // 454 / 1400
		logoPosition: 'center'
	}
];

const ratioOf = (ref) => {
	const [, w, h] = ref?.match(/-(\d+)x(\d+)-\w+$/) ?? [];
	return w && h ? Number(w) / Number(h) : null;
};

const plans = [];

for (const t of TARGETS) {
	const doc = await client.fetch(
		`*[_type=="workProject" && slug.current==$slug][0]{_id, _rev, title,
		  "hasHeroImage": defined(heroImage.asset), "hasHeroVideo": defined(heroVideo.asset),
		  "hasHeroLogo": defined(heroLogo.asset),
		  "first": galleryItems[0]{_key, type, layout, "ref": image.asset._ref},
		  "itemCount": count(galleryItems)}`,
		{ slug: t.slug }
	);

	if (!doc) throw new Error(`no project for slug ${t.slug}`);
	if (doc.hasHeroImage || doc.hasHeroVideo) {
		console.error(`ABORT: ${doc.title} already has a hero. Nothing to promote.`);
		process.exit(1);
	}
	if (doc.first?.type !== 'image' || !doc.first?.ref) {
		console.error(`ABORT: ${doc.title} first gallery item is not an image.`);
		process.exit(1);
	}

	const ratio = ratioOf(doc.first.ref);
	const drift = Math.abs(ratio - t.expectRatio);
	if (drift > 0.02) {
		console.error(
			`ABORT: ${doc.title} first item ratio ${ratio?.toFixed(3)} does not match the design hero ${t.expectRatio}.`
		);
		process.exit(1);
	}

	plans.push({ ...t, doc, ratio });
	console.log(
		`${doc.title}\n  hero ← gallery item 1 of ${doc.itemCount} (${doc.first.layout}, ratio ${ratio.toFixed(3)} ≈ ${t.expectRatio})\n` +
			`  logo ← ${t.logoFile} (node ${t.logoNode}), ${t.logoPosition} @ ${t.logoWidth}%\n` +
			`  gallery drops to ${doc.itemCount - 1} items\n`
	);
}

if (!commit) {
	console.log('dry run — pass --commit to write.');
	process.exit(0);
}

fs.mkdirSync(path.join(here, '../.backups'), { recursive: true });

for (const p of plans) {
	const full = await client.fetch('*[_id==$id][0]', { id: p.doc._id });
	const backup = path.join(here, `../.backups/${p.slug}.${p.doc._rev}.json`);
	fs.writeFileSync(backup, JSON.stringify(full, null, 2));
	console.log(`\n${p.doc.title}: backed up → ${path.relative(process.cwd(), backup)}`);

	const logoPath = path.join(here, 'assets/heroes', p.logoFile);
	const asset = await client.assets.upload('image', fs.createReadStream(logoPath), {
		filename: p.logoFile,
		contentType: 'image/svg+xml'
	});
	console.log(`  uploaded logo → ${asset._id}`);

	const imageRef = { _type: 'reference', _ref: p.doc.first.ref };

	await client
		.patch(p.doc._id)
		.set({
			heroImage: { _type: 'image', asset: imageRef },
			// Pre-fills the still behind the video; Mason can swap it for a real
			// frame once the footage is in.
			heroVideoPoster: { _type: 'image', asset: imageRef },
			heroLogo: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
			heroLogoPosition: p.logoPosition,
			heroLogoWidth: p.logoWidth
		})
		.unset([`galleryItems[_key=="${p.doc.first._key}"]`])
		.commit({ returnDocuments: false });

	console.log(`  hero set, first gallery item removed`);
}

const after = await client.fetch(
	`*[_type=="workProject" && slug.current in $slugs]|order(title){title,
	  "heroImage": defined(heroImage.asset), "heroLogo": defined(heroLogo.asset),
	  heroLogoPosition, heroLogoWidth, "items": count(galleryItems)}`,
	{ slugs: TARGETS.map((t) => t.slug) }
);
console.log('\ndone.');
console.log(after);
