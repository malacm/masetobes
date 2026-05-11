import type { PageLoad } from './$types';
import { safeFetch } from '$lib/sanity/client';
import { workProjectsListQuery } from '$lib/sanity/queries';
import type { WorkProjectListItem } from '$lib/sanity/types';

export const load: PageLoad = async () => {
	const projects = (await safeFetch<WorkProjectListItem[]>(workProjectsListQuery)) ?? [];
	return { projects };
};
