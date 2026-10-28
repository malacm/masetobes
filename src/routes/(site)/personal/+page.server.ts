import type { PageServerLoad } from './$types';
import { safeFetch } from '$lib/sanity/client';
import { personalGalleryQuery } from '$lib/sanity/queries';
import { fetchSvgMarkup } from '$lib/server/inlineSvg';
import type { PersonalGallery } from '$lib/sanity/types';

export const load: PageServerLoad = async () => {
	const personal = await safeFetch<PersonalGallery>(personalGalleryQuery);

	// The SVG artworks are inlined so their shapes can be animated in — see
	// animations/svgEntrance.ts. One that cannot be fetched falls back to the
	// plain <img> the gallery renders for any other image.
	if (personal?.galleryItems) {
		personal.galleryItems = await Promise.all(
			personal.galleryItems.map(async (item) =>
				item.type === 'svg' ? { ...item, svgMarkup: (await fetchSvgMarkup(item)) ?? undefined } : item
			)
		);
	}

	return { personal };
};
