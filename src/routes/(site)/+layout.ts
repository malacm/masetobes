import type { LayoutLoad } from './$types';
import { safeFetch } from '$lib/sanity/client';
import { siteSettingsQuery } from '$lib/sanity/queries';
import type { SiteSettings } from '$lib/sanity/types';

export const load: LayoutLoad = async () => {
	try {
		const siteSettings = await safeFetch<SiteSettings>(siteSettingsQuery);
		return { siteSettings };
	} catch (err) {
		// Belt-and-suspenders: safeFetch already catches, but if anything
		// upstream throws (module load, Sanity client init), surface it in
		// Vercel logs instead of bubbling a 500.
		console.error('[(site)/+layout] siteSettings load failed:', err);
		return { siteSettings: null };
	}
};
