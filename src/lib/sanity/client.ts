import { createClient, type SanityClient } from '@sanity/client';
import { dev } from '$app/environment';
import { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } from '$env/static/public';

export const sanityConfig = {
	projectId: PUBLIC_SANITY_PROJECT_ID,
	dataset: PUBLIC_SANITY_DATASET || 'production',
	apiVersion: '2026-01-01',
	useCdn: !dev
};

export const isSanityConfigured = Boolean(PUBLIC_SANITY_PROJECT_ID);

export const sanity: SanityClient | null = isSanityConfigured ? createClient(sanityConfig) : null;

export async function safeFetch<T>(query: string, params: Record<string, unknown> = {}): Promise<T | null> {
	if (!sanity) return null;
	try {
		return await sanity.fetch<T>(query, params);
	} catch (err) {
		console.error('[sanity] fetch failed:', err);
		return null;
	}
}
