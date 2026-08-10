#!/usr/bin/env node
/**
 * Imports the gallery media laid out in Figma into Sanity.
 *
 *   node scripts/import-from-figma.mjs [--dry] [--only "Potato Head Music"]
 *   node scripts/import-from-figma.mjs --thumbs    # /work card art only
 *   node scripts/import-from-figma.mjs --content   # copy + credits only
 *
 * The two single-step flags skip the galleries, which is the quick way to fix
 * thumbnails or copy without re-uploading ~100 images.
 *
 * Reads scripts/figma-slots.json — the ordered slot map extracted from the
 * Figma file — then, for every project:
 *
 *   1. asks Figma's REST API to render each image slot (all node ids batched
 *      into one request per project, at 2x)
 *   2. uploads each render to Sanity as an image asset
 *   3. creates the document if it doesn't exist, then patches galleryItems
 *
 * Video slots are written as `type: 'video'` items with no file attached and
 * the aspect ratio recorded, so the page reserves the right space and shows a
 * placeholder until the footage is uploaded in the Studio.
 *
 * Re-running is safe: documents are created only if missing, and only the
 * galleryItems array is overwritten — any copy entered in the Studio (tagline,
 * description, info blocks, collaborators) is left alone.
 *
 * Required environment (in .env):
 *   PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET
 *   SANITY_API_WRITE_TOKEN   — Editor token, create at manage.sanity.io
 *   FIGMA_TOKEN              — personal access token, figma.com/settings
 */

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const FIGMA_FILE_KEY = '0XhYCJWc1hxW93a12xgnSa';

/**
 * Manifest label → the Sanity document it belongs to. Declaration order sets
 * the order on /work, and follows the work index design: DOME already exists
 * and sorts first, then these.
 */
const PROJECTS = {
	'Potato Head Music': { type: 'workProject', slug: 'potato-head-music', title: 'Potato Head Music' },
	'Collection 002': {
		type: 'workProject',
		slug: 'potato-head-collection-002',
		title: 'Potato Head Collection 002'
	},
	'Nusa Cana': { type: 'workProject', slug: 'nusa-cana', title: 'Nusa Caña' },
	WHR: { type: 'workProject', slug: 'whr', title: 'WHR' },
	'Little Sun': { type: 'workProject', slug: 'little-sun', title: 'Little Sun' },
	'Buck Mason': { type: 'workProject', slug: 'buck-mason', title: 'Buck Mason' },
	Personal: { type: 'personalGallery', id: 'personalGallery' }
};

/**
 * Work-index card art, keyed by slug. These are NOT the projects' opening
 * frames — the index design picks a different image per card and crops it into
 * a fixed box, so each entry points at that card's image box in the Work frame
 * and carries the box's shape. Rendering the box gives the crop for free.
 */
/**
 * Everything on a project page that isn't media, transcribed from the Figma
 * frames: the 48px title, the 96px line, the role/year columns, and the credits
 * strip above the footer. The /work hover panel reads the same role and year,
 * so a project missing those has nothing to show on hover.
 */
const CONTENT = {
	'potato-head-music': {
		tagline: 'Potato Head Music',
		description: 'regeneration through the art of good times',
		role: ['ART DIRECTION', 'branding', 'strategy'],
		year: '2025',
		collaborators: [
			'Dan Mitchell',
			'Pete Keen',
			'Putu Eka Permata',
			'Dio Doran',
			'Opie Warhandi',
			'Ikhtiar Dimas',
			'Kai Evill',
			'Dita Prahadi'
		],
		instagram: 'https://www.instagram.com/potatohead/',
		website: 'https://seminyak.potatohead.co/'
	},
	'potato-head-collection-002': {
		tagline: 'Collection 002',
		description: 'inspired by craft, captured with movement',
		role: ['ART DIRECTION', 'strategy'],
		year: '2025',
		collaborators: [
			'Dan Mitchell',
			'Pete Keen',
			'Lisa Yamai',
			'Putu Eka Permata',
			'Dwinanda Aldyan Y',
			'Farrel Kesumajaya',
			'Bumi Bajra'
		],
		instagram: 'https://www.instagram.com/potatohead/',
		website: 'https://seminyak.potatohead.co/'
	},
	'nusa-cana': {
		tagline: 'Nusa Caña',
		description: 'choose the path less traveled, always',
		role: ['ART DIRECTION', 'branding', 'web', 'strategy'],
		year: '2025',
		collaborators: [
			'Erik Joule',
			'Jon Rivera',
			'Pete Keen',
			'Nikolas Artha',
			'Ade Ardhana',
			'Sepaham Production'
		],
		instagram: 'https://www.instagram.com/nusacana/',
		// NOTE: the Figma has Potato Head's domain here, almost certainly a
		// copy-paste slip. Transcribed as-is — correct it in the Studio.
		website: 'https://seminyak.potatohead.co/'
	},
	whr: {
		tagline: 'WHR',
		description: 'a lofi institutional platform in the digital realm',
		role: ['ART DIRECTION', 'branding', 'web', 'strategy'],
		year: '2024',
		collaborators: ['Pat Towersey', 'Erik Joule', 'Jon Rivera', 'Cooper Laws'],
		instagram: 'https://www.instagram.com/whr/',
		website: 'https://www.whr.institute/'
	},
	'little-sun': {
		tagline: 'Little Sun',
		description: 'you’re favorite wine’s favorite soda',
		role: ['ART DIRECTION', 'branding', 'packaging', 'strategy'],
		year: '2025',
		collaborators: ['Joseph Delaney', 'Erik Joule'],
		instagram: 'https://www.instagram.com/drinklittlesun/',
		website: 'https://drinklittlesun.com/'
	},
	'buck-mason': {
		tagline: 'Buck Mason',
		description: 'timeless classics inspired by a coastal gem',
		role: ['ART DIRECTION', 'editorial design'],
		year: '2024',
		collaborators: ['Jace Lumley'],
		instagram: 'https://www.instagram.com/buckmason/',
		website: 'https://www.buckmason.com'
	}
};

const THUMBNAILS = {
	dome: { nodeId: '1:39059', ratio: 0.8 },
	'potato-head-music': { nodeId: '1:39074', ratio: 0.8 },
	'potato-head-collection-002': { nodeId: '1:39102', ratio: 0.8 },
	'nusa-cana': { nodeId: '1:39109', ratio: 0.8 },
	whr: { nodeId: '1:39130', ratio: 1 },
	'little-sun': { nodeId: '1:39139', ratio: 0.8 },
	'buck-mason': { nodeId: '1:39146', ratio: 1 }
};

// ---------------------------------------------------------------- env + args

function loadEnv() {
	const env = { ...process.env };
	try {
		for (const line of readFileSync(resolve(ROOT, '.env'), 'utf8').split('\n')) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const eq = trimmed.indexOf('=');
			if (eq === -1) continue;
			const key = trimmed.slice(0, eq).trim();
			if (!env[key]) env[key] = trimmed.slice(eq + 1).trim();
		}
	} catch {
		/* no .env — rely on the real environment */
	}
	return env;
}

const env = loadEnv();
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
// Re-run a single step, leaving already-imported galleries alone.
const THUMBS_ONLY = args.includes('--thumbs');
const CONTENT_ONLY = args.includes('--content') || args.includes('--headers');

function requireEnv(name) {
	if (!env[name]) {
		console.error(`Missing ${name}. See the header of this file for what's needed.`);
		process.exit(1);
	}
	return env[name];
}

const client = createClient({
	projectId: requireEnv('PUBLIC_SANITY_PROJECT_ID'),
	dataset: env.PUBLIC_SANITY_DATASET || 'production',
	apiVersion: '2024-01-01',
	token: DRY ? undefined : requireEnv('SANITY_API_WRITE_TOKEN'),
	useCdn: false
});

// ------------------------------------------------------------------- figma

/**
 * Render nodes to PNG. Figma accepts many ids per request, so this is one
 * round trip per project rather than one per image.
 */
async function renderNodes(nodeIds) {
	if (nodeIds.length === 0) return {};
	// Figma renders synchronously and these are large frames, so this can take
	// a while. Chunk it so there's visible progress and no single huge request.
	const images = {};
	const CHUNK = 5;
	for (let i = 0; i < nodeIds.length; i += CHUNK) {
		const batch = nodeIds.slice(i, i + CHUNK);
		process.stdout.write(
			`  rendering ${Math.min(i + CHUNK, nodeIds.length)}/${nodeIds.length} in Figma...\r`
		);
		const url =
			`https://api.figma.com/v1/images/${FIGMA_FILE_KEY}` +
			`?ids=${encodeURIComponent(batch.join(','))}&format=png&scale=2`;
		const res = await fetch(url, {
			headers: { 'X-Figma-Token': requireEnv('FIGMA_TOKEN') },
			signal: AbortSignal.timeout(180_000)
		});
		if (!res.ok) throw new Error(`Figma render failed: ${res.status} ${await res.text()}`);
		const body = await res.json();
		if (body.err) throw new Error(`Figma render failed: ${body.err}`);
		Object.assign(images, body.images ?? {});
	}
	console.log(`  rendered ${nodeIds.length} nodes in Figma        `);
	return images;
}

// ------------------------------------------------------------------- sanity

async function uploadImage(url, filename) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Could not download ${filename}: ${res.status}`);
	const buffer = Buffer.from(await res.arrayBuffer());
	// Sanity dedupes by content hash, so re-runs reuse the existing asset.
	const asset = await client.assets.upload('image', buffer, { filename });
	return asset._id;
}

/**
 * Lexicographically increasing ranks for @sanity/orderable-document-list. The
 * leading 2 keeps these after the existing DOME document (`0|100008:`) so the
 * index opens with DOME, as the design shows. Drag to reorder in the Studio.
 */
const orderRank = (i) => `0|2${String(i + 1).padStart(5, '0')}:`;

function galleryItem(slot, assetId) {
	const base = { _type: 'galleryItem', _key: randomUUID(), layout: slot.layout };
	if (slot.kind === 'video') {
		// Deliberately no `video` asset — the slot renders as a placeholder at
		// this aspect ratio until a file is uploaded in the Studio.
		return { ...base, type: 'video', aspectRatio: slot.aspectRatio };
	}
	return {
		...base,
		type: 'image',
		image: { _type: 'image', asset: { _type: 'reference', _ref: assetId } }
	};
}

// --------------------------------------------------------------------- main

async function importProject(label, slots) {
	const config = PROJECTS[label];
	if (!config) {
		console.warn(`  ! no document configured for "${label}" — skipping`);
		return;
	}

	const imageSlots = slots.filter((s) => s.kind === 'image');
	const videoSlots = slots.filter((s) => s.kind === 'video');
	console.log(
		`\n${label}: ${slots.length} slots (${imageSlots.length} images, ` +
			`${videoSlots.length} video placeholders)`
	);

	if (DRY) {
		for (const [i, s] of slots.entries()) {
			console.log(`  ${String(i).padStart(2)}. ${s.layout.padEnd(11)} ${s.kind}`);
		}
		return;
	}

	const rendered = await renderNodes(imageSlots.map((s) => s.nodeId));

	const assetIds = new Map();
	for (const [i, slot] of imageSlots.entries()) {
		const url = rendered[slot.nodeId];
		if (!url) {
			throw new Error(`Figma returned no render for ${slot.nodeId} (${slot.src})`);
		}
		const name = `${config.slug ?? 'personal'}-${String(i).padStart(2, '0')}.png`;
		assetIds.set(slot.nodeId, await uploadImage(url, name));
		process.stdout.write(`  uploaded ${name}\r`);
	}
	console.log(`  uploaded ${imageSlots.length} images        `);

	const galleryItems = slots.map((s) => galleryItem(s, assetIds.get(s.nodeId)));

	if (config.type === 'personalGallery') {
		await client.createIfNotExists({ _id: config.id, _type: 'personalGallery' });
		await client.patch(config.id).set({ galleryItems }).commit();
		console.log('  patched personalGallery');
		return;
	}

	const docId = `workProject-${config.slug}`;
	const index = Object.keys(PROJECTS).indexOf(label);

	await client.createIfNotExists({
		_id: docId,
		_type: 'workProject',
		title: config.title,
		slug: { _type: 'slug', current: config.slug },
		publishedAt: new Date().toISOString(),
		orderRank: orderRank(index)
	});

	await client.patch(docId).set({ galleryItems }).commit();
	console.log(`  patched ${docId}`);
}

/** Portable Text for a single line of copy. */
const textBlock = (text) => [
	{
		_type: 'block',
		_key: randomUUID(),
		style: 'normal',
		markDefs: [],
		children: [{ _type: 'span', _key: randomUUID(), text, marks: [] }]
	}
];

/**
 * Fill in each project's copy and credits. Uses setIfMissing throughout, so
 * anything already written in the Studio wins and re-runs are harmless.
 */
async function syncContent() {
	const slugs = Object.keys(CONTENT);
	console.log(`\nCopy + credits for ${slugs.length} projects`);

	if (DRY) {
		for (const slug of slugs) {
			const c = CONTENT[slug];
			console.log(
				`  ${slug.padEnd(28)} ${c.role.join(', ')} · ${c.year} · ` +
					`${c.collaborators.length} collaborator${c.collaborators.length === 1 ? '' : 's'}`
			);
		}
		return;
	}

	const docs = await client.fetch(
		'*[_type == "workProject" && slug.current in $slugs]{ "slug": slug.current, _id }',
		{ slugs }
	);

	for (const slug of slugs) {
		const doc = docs.find((d) => d.slug === slug);
		if (!doc) {
			console.warn(`  ! no document with slug "${slug}" — skipping`);
			continue;
		}
		const c = CONTENT[slug];
		await client
			.patch(doc._id)
			.setIfMissing({
				tagline: c.tagline,
				description: textBlock(c.description),
				infoBlocks: [
					{ _type: 'infoBlock', _key: randomUUID(), title: 'role', items: c.role },
					{ _type: 'infoBlock', _key: randomUUID(), title: 'year', items: [c.year] }
				],
				collaborators: c.collaborators,
				instagramUrl: c.instagram,
				websiteUrl: c.website
			})
			.commit();
		console.log(`  ${slug} → ${c.role.join(', ')} · ${c.year} · ${c.collaborators.length} credits`);
	}
}

/**
 * Set every project's /work card art from the Work index design. Runs on its
 * own so a wrong thumbnail can be repaired with `--thumbs` without re-uploading
 * the galleries.
 */
async function syncThumbnails() {
	const slugs = Object.keys(THUMBNAILS);
	console.log(`\nThumbnails: ${slugs.length} cards from the Work index`);

	if (DRY) {
		for (const slug of slugs) {
			console.log(`  ${slug.padEnd(28)} node ${THUMBNAILS[slug].nodeId}  ratio ${THUMBNAILS[slug].ratio}`);
		}
		return;
	}

	const ids = await client.fetch(
		'*[_type == "workProject" && slug.current in $slugs]{ "slug": slug.current, _id }',
		{ slugs }
	);
	const bySlug = new Map(ids.map((d) => [d.slug, d._id]));

	const rendered = await renderNodes(slugs.map((s) => THUMBNAILS[s].nodeId));

	for (const slug of slugs) {
		const docId = bySlug.get(slug);
		if (!docId) {
			console.warn(`  ! no document with slug "${slug}" — skipping`);
			continue;
		}
		const { nodeId, ratio } = THUMBNAILS[slug];
		const url = rendered[nodeId];
		if (!url) throw new Error(`Figma returned no render for thumbnail ${nodeId} (${slug})`);

		const assetId = await uploadImage(url, `${slug}-thumb.png`);
		await client
			.patch(docId)
			.set({
				thumbnailImage: { _type: 'image', asset: { _type: 'reference', _ref: assetId } },
				thumbnailRatio: ratio
			})
			.commit();
		console.log(`  ${slug} → ${ratio === 1 ? 'square' : '4:5'}`);
	}
}

async function main() {
	const manifest = JSON.parse(readFileSync(resolve(__dirname, 'figma-slots.json'), 'utf8'));
	const entries = Object.entries(manifest).filter(([label]) => !ONLY || label === ONLY);

	if (entries.length === 0) {
		console.error(`No project matched --only "${ONLY}"`);
		process.exit(1);
	}
	if (DRY) console.log('dry run — nothing will be written\n');

	const step = THUMBS_ONLY ? 'thumbs' : CONTENT_ONLY ? 'content' : null;

	if (!step) {
		for (const [label, slots] of entries) {
			await importProject(label, slots);
		}
	}
	if (step !== 'content') await syncThumbnails();
	if (step !== 'thumbs') await syncContent();
	console.log('\ndone');
}

main().catch((err) => {
	console.error(`\n${err.message}`);
	process.exit(1);
});
