import { defineType, defineField } from 'sanity';

export const infoBlock = defineType({
	name: 'infoBlock',
	title: 'Info Block',
	type: 'object',
	fields: [
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'items',
			title: 'Items',
			type: 'array',
			of: [{ type: 'string' }]
		})
	],
	preview: {
		select: { title: 'title', items: 'items' },
		prepare({ title, items }) {
			return {
				title,
				subtitle: items?.length ? `${items.length} item${items.length === 1 ? '' : 's'}` : 'no items'
			};
		}
	}
});
