import { defineType, defineField } from 'sanity';

export const galleryItem = defineType({
	name: 'galleryItem',
	title: 'Gallery Item',
	type: 'object',
	fields: [
		defineField({
			name: 'type',
			title: 'Type',
			type: 'string',
			options: {
				list: [
					{ title: 'Image', value: 'image' },
					{ title: 'SVG', value: 'svg' },
					{ title: 'Video', value: 'video' },
					{ title: 'GIF', value: 'gif' }
				],
				layout: 'radio'
			},
			initialValue: 'image',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'image',
			title: 'Image / SVG / GIF',
			type: 'image',
			options: { hotspot: true, accept: 'image/*' },
			hidden: ({ parent }) => parent?.type === 'video'
		}),
		defineField({
			name: 'video',
			title: 'Video file',
			type: 'file',
			options: { accept: 'video/*' },
			hidden: ({ parent }) => parent?.type !== 'video'
		}),
		defineField({
			name: 'layout',
			title: 'Layout',
			description:
				'Two adjacent "Half" items form a row. Large + Small in either order = ~62/38 split (smaller item sits at top of its cell with blank space below). Same size + same size = 50/50 split with true image sizes, bottom-aligned.',
			type: 'string',
			options: {
				list: [
					{ title: 'Full width', value: 'full' },
					{ title: 'Half — large (paired)', value: 'pair-large' },
					{ title: 'Half — small (paired)', value: 'pair-small' }
				],
				layout: 'radio'
			},
			initialValue: 'full',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'caption',
			title: 'Caption (optional)',
			type: 'string'
		})
	],
	preview: {
		select: {
			type: 'type',
			layout: 'layout',
			caption: 'caption',
			media: 'image'
		},
		prepare({ type, layout, caption, media }) {
			return {
				title: caption || `${type ?? 'item'}`,
				subtitle: layout,
				media
			};
		}
	}
});
