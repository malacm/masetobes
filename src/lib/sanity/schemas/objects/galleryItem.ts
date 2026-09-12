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
			description:
				'Leave empty to reserve the slot — the page renders a placeholder at the right size until a file is uploaded.',
			type: 'file',
			options: { accept: 'video/*' },
			hidden: ({ parent }) => parent?.type !== 'video'
		}),
		defineField({
			name: 'frame',
			title: 'Frame',
			description:
				'Sets the video on a flat colour panel instead of edge to edge. Landscape is the 3:2 panel for browser / desktop recordings; Portrait is the 3:4 panel for phone recordings.',
			type: 'string',
			options: {
				list: [
					{ title: 'None — video fills its slot', value: 'none' },
					{ title: 'Landscape panel (3:2) — desktop / browser recording', value: 'landscape' },
					{ title: 'Portrait panel (3:4) — phone recording', value: 'portrait' }
				],
				layout: 'radio'
			},
			initialValue: 'none',
			hidden: ({ parent }) => parent?.type !== 'video'
		}),
		defineField({
			name: 'frameColor',
			title: 'Frame colour',
			description: 'Hex colour of the panel behind the video. Leave empty for the default cream (#F1F0E8).',
			type: 'string',
			placeholder: '#F1F0E8',
			validation: (rule) =>
				rule.regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
					name: 'hex colour',
					invert: false
				}),
			hidden: ({ parent }) => parent?.type !== 'video' || !parent?.frame || parent.frame === 'none'
		}),
		defineField({
			name: 'layout',
			title: 'Width',
			description:
				'Items flow left-to-right and wrap onto a new row once 12 columns are filled — so Half + Half, Two-thirds + Third, or Third + Third + Third each make one row. Items in a row are top-aligned; a shorter item leaves blank space beneath it.',
			type: 'string',
			options: {
				list: [
					{ title: 'Full width — 12 columns', value: 'full' },
					{ title: 'Two-thirds — 8 columns', value: 'two-thirds' },
					{ title: 'Large half — 7 columns', value: 'large-half' },
					{ title: 'Half — 6 columns', value: 'half' },
					{ title: 'Small half — 5 columns', value: 'small-half' },
					{ title: 'Third — 4 columns', value: 'third' }
				],
				layout: 'radio'
			},
			initialValue: 'full',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'aspectRatio',
			title: 'Aspect ratio (width ÷ height)',
			description:
				'Optional. Used to reserve space for video slots before a file is uploaded, e.g. 1.5 for 3:2, 0.75 for 3:4. Ignored once the video is in place.',
			type: 'number',
			validation: (rule) => rule.positive(),
			hidden: ({ parent }) => parent?.type !== 'video'
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
			frame: 'frame',
			layout: 'layout',
			caption: 'caption',
			media: 'image'
		},
		prepare({ type, frame, layout, caption, media }) {
			const framed = type === 'video' && frame && frame !== 'none' ? ` · framed (${frame})` : '';
			return {
				title: caption || `${type ?? 'item'}`,
				subtitle: `${layout}${framed}`,
				media
			};
		}
	}
});
