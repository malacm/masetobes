import type { PageServerLoad } from './$types';
import { safeFetch } from '$lib/sanity/client';
import { workProjectsListQuery } from '$lib/sanity/queries';
import type { WorkProjectListItem } from '$lib/sanity/types';

export const load: PageServerLoad = async () => {
	const projects = (await safeFetch<WorkProjectListItem[]>(workProjectsListQuery)) ?? [];
	return { projects };
};
