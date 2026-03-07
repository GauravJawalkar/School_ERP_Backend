export const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

export const deSlugify = (slug: string) => slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");