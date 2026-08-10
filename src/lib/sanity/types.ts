import type { PortableTextBlock } from '@portabletext/types';

export type SanityImageRef = {
	_type: 'image';
	asset?: { _ref: string; _type: 'reference' };
	hotspot?: { x: number; y: number; height: number; width: number };
	crop?: { top: number; bottom: number; left: number; right: number };
};

export type SanityFileRef = {
	_type: 'file';
	asset?: { _ref: string; _type: 'reference' };
};

/* Column span of a gallery item within the 12-column grid. `pair-large` and
   `pair-small` predate the grid — they are still accepted so existing Sanity
   content keeps rendering, and both resolve to a 6-column half. */
export type GalleryItemLayout =
	| 'full'
	| 'two-thirds'
	| 'large-half'
	| 'half'
	| 'small-half'
	| 'third'
	| 'pair-large'
	| 'pair-small';

export type GalleryItem = {
	_key: string;
	type: 'image' | 'svg' | 'video' | 'gif';
	image?: SanityImageRef;
	video?: SanityFileRef;
	layout: GalleryItemLayout;
	aspectRatio?: number;
	caption?: string;
};

export type InfoBlock = {
	_key: string;
	title: string;
	items: string[];
};

export type PlaylistTrack = {
	_key: string;
	title: string;
	artist: string;
	audio: SanityFileRef;
};

export type SiteSettings = {
	name: string;
	aboutContent?: PortableTextBlock[];
	contactEmail?: string;
	themeIconDefault?: SanityImageRef;
	themeIconAlt?: SanityImageRef;
	themeIconFooterDefault?: SanityImageRef;
	themeIconFooterAlt?: SanityImageRef;
	footerWordmark?: string;
	footerWordmarkAsset?: SanityImageRef;
	playlist?: PlaylistTrack[];
};

export type WorkProject = {
	_id: string;
	title: string;
	slug: { current: string };
	tagline?: string;
	description?: PortableTextBlock[];
	infoBlocks?: InfoBlock[];
	collaborators?: string[];
	instagramUrl?: string;
	websiteUrl?: string;
	thumbnailImage?: SanityImageRef;
	thumbnailRatio?: number;
	heroImage?: SanityImageRef;
	heroVideo?: SanityFileRef;
	heroVideoPoster?: SanityImageRef;
	heroLogo?: SanityImageRef;
	heroLogoPosition?:
		| 'top-left'
		| 'top-center'
		| 'top-right'
		| 'middle-left'
		| 'center'
		| 'middle-right'
		| 'bottom-left'
		| 'bottom-center'
		| 'bottom-right';
	heroLogoWidth?: number;
	galleryItems?: GalleryItem[];
	publishedAt?: string;
	orderRank?: string;
};

export type WorkProjectListItem = Pick<
	WorkProject,
	'_id' | 'title' | 'slug' | 'thumbnailImage' | 'thumbnailRatio' | 'infoBlocks'
>;

export type WorkProjectNeighbors = {
	prev: { slug: string; title: string } | null;
	next: { slug: string; title: string } | null;
};

export type PersonalGallery = {
	galleryItems?: GalleryItem[];
};
