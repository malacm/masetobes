import { defineType, defineField } from 'sanity';
import { orderRankField } from '@sanity/orderable-document-list';

export const workProject = defineType({
	name: 'workProject',
	title: 'Work Project',
	type: 'document',
	fields: [
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: { source: 'title', maxLength: 96 },
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'tagline',
			title: 'Tagline',
			description: 'Small project label displayed above the 3-column grid (e.g. "Dome").',
			type: 'string'
		}),
		defineField({
			name: 'description',
			title: 'Description',
			description: 'Large text block — first column of the 3-column grid (50%).',
			type: 'array',
			of: [{ type: 'block' }]
		}),
		defineField({
			name: 'infoBlocks',
			title: 'Info blocks',
			description: 'Two title + list blocks shown to the right of the description (25% each). Add exactly two.',
			type: 'array',
			of: [{ type: 'infoBlock' }],
			validation: (rule) => rule.length(2)
		}),
		defineField({
			name: 'collaborators',
			title: 'Collaborators',
			description: 'Listed above the footer with the "collaborators" label on the left.',
			type: 'array',
			of: [{ type: 'string' }]
		}),
		defineField({
			name: 'instagramUrl',
			title: 'Instagram URL',
			description: 'Project Instagram link, shown top-right above the footer.',
			type: 'url'
		}),
		defineField({
			name: 'websiteUrl',
			title: 'Website URL',
			description: 'Project website link, shown top-right above the footer.',
			type: 'url'
		}),
		defineField({
			name: 'thumbnailImage',
			title: 'Thumbnail image',
			description: 'Used in the /work index grid.',
			type: 'image',
			options: { hotspot: true },
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'heroImage',
			title: 'Hero image',
			description: 'Featured opening image of the project page (e.g. the Dome wordmark).',
			type: 'image',
			options: { hotspot: true }
		}),
		defineField({
			name: 'galleryItems',
			title: 'Gallery items',
			description: 'Ordered media following the hero. Two adjacent "Half" items form a row — see each item\'s Layout field for sizing rules.',
			type: 'array',
			of: [{ type: 'galleryItem' }]
		}),
		defineField({
			name: 'publishedAt',
			title: 'Published at',
			type: 'datetime',
			initialValue: () => new Date().toISOString()
		}),
		orderRankField({ type: 'workProject' })
	],
	preview: {
		select: {
			title: 'title',
			tagline: 'tagline',
			media: 'thumbnailImage'
		},
		prepare({ title, tagline, media }) {
			return {
				title: title || 'Untitled project',
				subtitle: tagline,
				media
			};
		}
	}
});
