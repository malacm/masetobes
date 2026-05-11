import type { SchemaTypeDefinition } from 'sanity';
import { siteSettings } from './siteSettings';
import { workProject } from './workProject';
import { personalGallery } from './personalGallery';
import { galleryItem } from './objects/galleryItem';
import { infoBlock } from './objects/infoBlock';
import { playlistTrack } from './objects/playlistTrack';

export const schemaTypes: SchemaTypeDefinition[] = [
	siteSettings,
	workProject,
	personalGallery,
	galleryItem,
	infoBlock,
	playlistTrack
];
