import { defineType, defineField } from 'sanity';

export const personalGallery = defineType({
	name: 'personalGallery',
	title: 'Personal Gallery',
	type: 'document',
	fields: [
		defineField({
			name: 'galleryItems',
			title: 'Gallery items',
			description: 'Items displayed on the /personal page. Two adjacent "Half" items form a row — see each item\'s Layout field for sizing rules.',
			type: 'array',
			of: [{ type: 'galleryItem' }]
		})
	],
	preview: {
		prepare() {
			return { title: 'Personal Gallery' };
		}
	}
});
