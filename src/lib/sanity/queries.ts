export const siteSettingsQuery = /* groq */ `
*[_type == "siteSettings"][0]{
  name,
  aboutContent,
  contactEmail,
  themeIconDefault,
  themeIconAlt,
  themeIconFooterDefault,
  themeIconFooterAlt,
  footerWordmark,
  footerWordmarkAsset,
  playlist[]{
    _key,
    title,
    artist,
    audio
  }
}
`;

export const workProjectsListQuery = /* groq */ `
*[_type == "workProject"] | order(orderRank){
  _id,
  title,
  slug,
  thumbnailImage
}
`;

export const workProjectBySlugQuery = /* groq */ `
*[_type == "workProject" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  tagline,
  description,
  infoBlocks,
  collaborators,
  instagramUrl,
  websiteUrl,
  thumbnailImage,
  heroImage,
  heroVideo,
  heroVideoPoster,
  heroLogo,
  heroLogoPosition,
  heroLogoWidth,
  galleryItems,
  publishedAt,
  orderRank
}
`;

export const workProjectNeighborsQuery = /* groq */ `
{
  "prev": *[_type == "workProject" && orderRank < $orderRank] | order(orderRank desc)[0]{
    "slug": slug.current,
    title
  },
  "next": *[_type == "workProject" && orderRank > $orderRank] | order(orderRank asc)[0]{
    "slug": slug.current,
    title
  }
}
`;

export const personalGalleryQuery = /* groq */ `
*[_type == "personalGallery"][0]{
  galleryItems
}
`;
