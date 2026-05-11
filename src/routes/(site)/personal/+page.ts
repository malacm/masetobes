import type { PageLoad } from './$types';
import { safeFetch } from '$lib/sanity/client';
import { personalGalleryQuery } from '$lib/sanity/queries';
import type { PersonalGallery } from '$lib/sanity/types';

export const load: PageLoad = async () => {
	const personal = await safeFetch<PersonalGallery>(personalGalleryQuery);
	return { personal };
};
