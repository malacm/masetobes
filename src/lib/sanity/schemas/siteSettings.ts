import { defineType, defineField } from 'sanity';

export const siteSettings = defineType({
	name: 'siteSettings',
	title: 'Site Settings',
	type: 'document',
	fields: [
		defineField({
			name: 'name',
			title: 'Display name',
			description: 'Shown in the nav (top-left) and used as the document title.',
			type: 'string',
			initialValue: 'Mason Tobia',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'aboutContent',
			title: 'About content',
			description: 'Bio + clients list shown in the about overlay.',
			type: 'array',
			of: [{ type: 'block' }]
		}),
		defineField({
			name: 'contactEmail',
			title: 'Contact email',
			description: 'Where contact-form messages get delivered. Also displayed in the about overlay.',
			type: 'string',
			validation: (rule) => rule.email()
		}),
		defineField({
			name: 'themeIconDefault',
			title: 'Theme icon — default (homepage)',
			description: 'SVG shown as the central homepage icon when the default (dark) theme is active.',
			type: 'image',
			options: { accept: 'image/svg+xml,image/*' }
		}),
		defineField({
			name: 'themeIconAlt',
			title: 'Theme icon — alt (homepage)',
			description: 'SVG shown as the central homepage icon when the alt (sage) theme is active.',
			type: 'image',
			options: { accept: 'image/svg+xml,image/*' }
		}),
		defineField({
			name: 'themeIconFooterDefault',
			title: 'Theme icon — default (footer)',
			description: 'Optional. Pre-skewed footer variant of the default-theme icon. Leave empty to reuse the homepage version.',
			type: 'image',
			options: { accept: 'image/svg+xml,image/*' }
		}),
		defineField({
			name: 'themeIconFooterAlt',
			title: 'Theme icon — alt (footer)',
			description: 'Optional. Footer variant of the alt-theme icon. Leave empty to reuse the homepage version.',
			type: 'image',
			options: { accept: 'image/svg+xml,image/*' }
		}),
		defineField({
			name: 'footerWordmark',
			title: 'Footer wordmark (text fallback)',
			description: 'Used only if no wordmark SVG is uploaded below.',
			type: 'string',
			initialValue: 'MGT'
		}),
		defineField({
			name: 'footerWordmarkAsset',
			title: 'Footer wordmark (SVG)',
			description:
				'Upload the full wordmark graphic — MGT + ©year baked in — as a single SVG. Sits to the right of the footer theme icon and scales to fill the remaining width.',
			type: 'image',
			options: { accept: 'image/svg+xml,image/*' }
		}),
		defineField({
			name: 'playlist',
			title: 'Homepage playlist',
			type: 'array',
			of: [{ type: 'playlistTrack' }]
		})
	],
	preview: {
		prepare() {
			return { title: 'Site Settings' };
		}
	}
});
