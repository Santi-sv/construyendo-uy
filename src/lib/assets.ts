/** Public assets follow Vite's base path on both localhost and GitHub Pages. */
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
