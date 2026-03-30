/**
 * Cloudinary URL transformer.
 * Injects w_, q_, f_auto transformation into existing Cloudinary upload URLs.
 * If the URL is not from Cloudinary, it is returned unchanged.
 *
 * @param {string} src    - Original image URL
 * @param {object} opts
 * @param {number} opts.width   - Target pixel width (default 600)
 * @param {number} opts.quality - JPEG/WebP quality 1-100 (default 75)
 * @returns {string}
 */
export function getCloudinaryUrl(src, { width = 600, quality = 75 } = {}) {
    if (!src || typeof src !== 'string') return src;

    // Only transform Cloudinary URLs
    if (!src.includes('res.cloudinary.com')) return src;

    // Already has transformations — don't double-process
    if (src.includes('/upload/w_') || src.includes('/upload/q_')) return src;

    // Inject transformation right after /upload/
    return src.replace(
        '/upload/',
        `/upload/w_${width},q_${quality},f_auto/`
    );
}

/**
 * Returns a small blurred placeholder URL for use as a loading state.
 * Uses very low quality + tiny size.
 */
export function getCloudinaryPlaceholder(src) {
    return getCloudinaryUrl(src, { width: 20, quality: 30 });
}
