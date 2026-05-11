import { defineType, defineField } from 'sanity';

export const playlistTrack = defineType({
	name: 'playlistTrack',
	title: 'Playlist Track',
	type: 'object',
	fields: [
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'artist',
			title: 'Artist',
			type: 'string',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'audio',
			title: 'Audio file',
			type: 'file',
			options: { accept: 'audio/*' },
			validation: (rule) => rule.required()
		})
	],
	preview: {
		select: { title: 'title', artist: 'artist' },
		prepare({ title, artist }) {
			return {
				title: title || 'Untitled track',
				subtitle: artist || ''
			};
		}
	}
});
