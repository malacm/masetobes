import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { safeFetch } from '$lib/sanity/client';
import { workProjectBySlugQuery, workProjectNeighborsQuery } from '$lib/sanity/queries';
import type { WorkProject, WorkProjectNeighbors } from '$lib/sanity/types';

export const load: PageLoad = async ({ params }) => {
	const project = await safeFetch<WorkProject>(workProjectBySlugQuery, { slug: params.slug });
	if (!project) throw error(404, 'Project not found');

	const neighbors =
		(await safeFetch<WorkProjectNeighbors>(workProjectNeighborsQuery, {
			orderRank: project.orderRank ?? ''
		})) ?? { prev: null, next: null };

	return { project, neighbors };
};
