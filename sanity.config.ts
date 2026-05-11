import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } from '$env/static/public';
import { schemaTypes } from './src/lib/sanity/schemas';

export default defineConfig({
	name: 'default',
	title: 'Mason Tobia',
	projectId: PUBLIC_SANITY_PROJECT_ID,
	dataset: PUBLIC_SANITY_DATASET || 'production',
	basePath: '/studio',
	plugins: [
		structureTool({
			structure: (S, context) =>
				S.list()
					.title('Content')
					.items([
						S.listItem()
							.title('Site Settings')
							.id('siteSettings')
							.child(
								S.document()
									.schemaType('siteSettings')
									.documentId('siteSettings')
							),
						S.listItem()
							.title('Personal Gallery')
							.id('personalGallery')
							.child(
								S.document()
									.schemaType('personalGallery')
									.documentId('personalGallery')
							),
						S.divider(),
						orderableDocumentListDeskItem({
							type: 'workProject',
							title: 'Work Projects',
							S,
							context
						})
					])
		}),
		visionTool()
	],
	schema: { types: schemaTypes }
});
