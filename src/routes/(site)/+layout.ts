import type { LayoutLoad } from './$types';
import { safeFetch } from '$lib/sanity/client';
import { siteSettingsQuery } from '$lib/sanity/queries';
import type { SiteSettings } from '$lib/sanity/types';

export const load: LayoutLoad = async () => {
	const siteSettings = await safeFetch<SiteSettings>(siteSettingsQuery);
	return { siteSettings };
};
