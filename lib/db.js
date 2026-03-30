// lib/db.js
import { dbConnect } from './mongoose';
import Collection from '@/models/Collection';
import Product from '@/models/Product';

// Fields needed for product cards (list views) — skip heavy fields like description, SEO, tags
const CARD_FIELDS = 'name price images businessType inStock isOutOfStock sizeOptions collectionRef inspirationImage slug isFeatured availableSizes hasSizes';

// Shared helper: fetch all descendant collection IDs using BFS (single query per level, avoids N+1)
async function getAllDescendantIds(rootId) {
    let ids = [];
    let queue = [rootId];

    while (queue.length > 0) {
        const children = await Collection.find(
            { parentCollection: { $in: queue }, isActive: true, isArchived: { $ne: true } },
            { _id: 1 }
        ).lean();

        queue = children.map(c => c._id);
        ids = ids.concat(queue);
    }

    return ids;
}

// --- HYBRID DATA LAYER ---
export const db = {
    getAllItems: async (collectionSlug) => {
        try {
            const conn = await dbConnect();
            if (conn) {
                let query = { isActive: true, isArchived: { $ne: true } };

                if (collectionSlug && collectionSlug !== 'All' && collectionSlug !== 'all') {
                    const collectionDoc = await Collection.findOne({ slug: collectionSlug });
                    if (collectionDoc) {
                        const descendantIds = await getAllDescendantIds(collectionDoc._id);
                        const allCollectionIds = [collectionDoc._id, ...descendantIds];
                        query.collectionRef = { $in: allCollectionIds };
                    } else {
                        return [];
                    }
                }

                const products = await Product.find(query)
                    .select(CARD_FIELDS)
                    .populate('collectionRef', 'name slug')
                    .sort({ order: 1, createdAt: -1 })
                    .lean();

                return products.map(serializeDoc);
            }
        } catch (e) {
            console.error("DB Error getAllItems:", e);
            return [];
        }
        return [];
    },

    getItemById: async (id) => {
        try {
            const conn = await dbConnect();
            if (conn) {
                try {
                    const item = await Product.findById(id).populate('collectionRef').lean();
                    return item ? serializeDoc(item) : null;
                } catch (e) {
                    return null;
                }
            }
        } catch (e) {
            console.error("DB Error getItemById:", e);
        }
        return null;
    },

    // --- COLLECTION LOGIC ---
    getAllCollections: async () => {
        try {
            const conn = await dbConnect();
            if (conn) {
                const collections = await Collection.find({ isActive: true, isArchived: { $ne: true } })
                    .sort({ order: 1, createdAt: -1 })
                    .lean();
                return collections.map(serializeDoc);
            }
        } catch (e) {
            console.error("DB Error getAllCollections:", e);
            return [];
        }
        return [];
    },

    getCategoryTree: async () => {
        try {
            const conn = await dbConnect();
            if (conn) {
                const collections = await Collection.find({ isActive: true, isArchived: { $ne: true } }).sort({ order: 1 }).lean();
                const serialized = collections.map(serializeDoc);

                const buildCollectionTree = (items, parentId = null) => {
                    return items
                        .filter(item => {
                            const pId = item.parentCollection ? item.parentCollection.toString() : null;
                            const tId = parentId ? parentId.toString() : null;
                            return pId === tId;
                        })
                        .map(item => ({
                            ...item,
                            children: buildCollectionTree(items, item._id)
                        }));
                };

                return buildCollectionTree(serialized);
            }
        } catch (e) {
            console.error("DB Error getCategoryTree:", e);
            return [];
        }
        return [];
    },

    getCategoryBySlug: async (slug) => {
        try {
            const conn = await dbConnect();
            if (conn) {
                const collection = await Collection.findOne({ slug, isActive: true, isArchived: { $ne: true } }).lean();
                if (!collection) return null;

                // Get children
                const children = await Collection.find({ parentCollection: collection._id, isActive: true, isArchived: { $ne: true } })
                    .sort({ order: 1 })
                    .lean();
                collection.children = children.map(serializeDoc);

                return serializeDoc(collection);
            }
        } catch (e) {
            console.error("DB Error getCategoryBySlug:", e);
            return null;
        }
        return null;
    },

    getCollectionsWithProducts: async () => {
        try {
            const conn = await dbConnect();
            if (conn) {
                const topLevelCollections = await Collection.find({
                    isActive: true,
                    isArchived: { $ne: true },
                    parentCollection: null
                }).sort({ order: 1 }).lean();

                const result = [];
                for (const collection of topLevelCollections) {
                    const descendantIds = await getAllDescendantIds(collection._id);
                    const allIds = [collection._id, ...descendantIds];

                    const products = await Product.find({
                        collectionRef: { $in: allIds },
                        isActive: true,
                        isArchived: { $ne: true }
                    }).select(CARD_FIELDS).populate('collectionRef', 'name slug').sort({ order: 1, createdAt: -1 }).lean();

                    result.push({
                        ...serializeDoc(collection),
                        products: products.map(serializeDoc)
                    });
                }

                return result;
            }
        } catch (e) {
            console.error("DB Error getCollectionsWithProducts:", e);
            return [];
        }
        return [];
    },

    getProductsByCategory: async (categoryDoc) => {
        try {
            const conn = await dbConnect();
            if (conn) {
                const descendantIds = await getAllDescendantIds(categoryDoc._id);
                const allIds = [categoryDoc._id, ...descendantIds];

                const products = await Product.find({
                    collectionRef: { $in: allIds },
                    isActive: true,
                    isArchived: { $ne: true }
                })
                    .select(CARD_FIELDS)
                    .populate('collectionRef', 'name slug')
                    .sort({ order: 1, createdAt: -1 })
                    .lean();

                return products.map(serializeDoc);
            }
        } catch (e) {
            console.error("DB Error getProductsByCategory:", e);
            return [];
        }
        return [];
    },

    // Get ONLY direct products (no descendants) for a collection
    getDirectProductsByCategory: async (categoryDoc) => {
        try {
            const conn = await dbConnect();
            if (conn) {
                const products = await Product.find({
                    collectionRef: categoryDoc._id,
                    isActive: true,
                    isArchived: { $ne: true }
                })
                    .select(CARD_FIELDS)
                    .populate('collectionRef', 'name slug')
                    .sort({ order: 1, createdAt: -1 })
                    .lean();

                return products.map(serializeDoc);
            }
        } catch (e) {
            console.error("DB Error getDirectProductsByCategory:", e);
            return [];
        }
        return [];
    },

    // Count all products in a collection (including descendants)
    getProductCountByCategory: async (categoryId) => {
        try {
            const conn = await dbConnect();
            if (conn) {
                const descendantIds = await getAllDescendantIds(categoryId);
                const allIds = [categoryId, ...descendantIds];

                return await Product.countDocuments({
                    collectionRef: { $in: allIds },
                    isActive: true,
                    isArchived: { $ne: true }
                });
            }
        } catch (e) {
            console.error("DB Error getProductCountByCategory:", e);
            return 0;
        }
        return 0;
    },

    // Get the first product image from a collection (including descendants) — used as cover image fallback
    getFirstProductImage: async (categoryId) => {
        try {
            const conn = await dbConnect();
            if (conn) {
                const descendantIds = await getAllDescendantIds(categoryId);
                const allIds = [categoryId, ...descendantIds];

                const product = await Product.findOne({
                    collectionRef: { $in: allIds },
                    isActive: true,
                    isArchived: { $ne: true },
                    'images.0': { $exists: true }
                })
                    .select('images')
                    .sort({ order: 1, createdAt: -1 })
                    .lean();

                return product?.images?.[0] || null;
            }
        } catch (e) {
            console.error("DB Error getFirstProductImage:", e);
            return null;
        }
        return null;
    },

    // Batch-enrich an array of child collections with productCount + fallback coverImage.
    // Uses 2 DB queries total (one $group aggregation + one findOne per missing image)
    // instead of N×2 queries — eliminates the N+1 problem on collection pages.
    enrichChildren: async (children) => {
        if (!children || children.length === 0) return [];
        try {
            const conn = await dbConnect();
            if (!conn) return children.map(c => ({ ...c, productCount: 0 }));

            // Collect ALL descendant IDs for every child in one pass
            const childDescendantMap = {};
            const allIdsFlat = [];

            await Promise.all(
                children.map(async (child) => {
                    const descendants = await getAllDescendantIds(child._id);
                    const ids = [child._id, ...descendants];
                    childDescendantMap[child._id.toString()] = ids;
                    allIdsFlat.push(...ids);
                })
            );

            // Single aggregation to count products per collection ID
            const counts = await Product.aggregate([
                {
                    $match: {
                        collectionRef: { $in: allIdsFlat },
                        isActive: true,
                        isArchived: { $ne: true }
                    }
                },
                {
                    $group: {
                        _id: '$collectionRef',
                        count: { $sum: 1 },
                        firstImage: { $first: '$images' }
                    }
                }
            ]);

            // Build lookup maps
            const countMap = {};
            const imageMap = {};
            for (const row of counts) {
                const key = row._id.toString();
                countMap[key] = (countMap[key] || 0) + row.count;
                if (!imageMap[key] && row.firstImage && row.firstImage.length > 0) {
                    imageMap[key] = row.firstImage[0];
                }
            }

            // Map totals back to each child using its collected IDs
            return children.map((child) => {
                const ids = childDescendantMap[child._id.toString()] || [child._id];
                let totalCount = 0;
                let fallbackImage = null;
                for (const id of ids) {
                    const k = id.toString();
                    totalCount += countMap[k] || 0;
                    if (!fallbackImage && imageMap[k]) fallbackImage = imageMap[k];
                }
                return {
                    ...child,
                    productCount: totalCount,
                    coverImage: child.coverImage || fallbackImage || ''
                };
            });
        } catch (e) {
            console.error('DB Error enrichChildren:', e);
            return children.map(c => ({ ...c, productCount: 0 }));
        }
    },

    // Get related products from same collection (excluding current product)
    getRelatedProducts: async (collectionId, excludeProductId, limit = 4) => {
        try {
            const conn = await dbConnect();
            if (conn) {
                const query = {
                    collectionRef: collectionId,
                    isActive: true,
                    isArchived: { $ne: true }
                };

                if (excludeProductId) {
                    try {
                        const mongoose = (await import('mongoose')).default;
                        query._id = { $ne: new mongoose.Types.ObjectId(excludeProductId) };
                    } catch (e) {
                        // If ID conversion fails, skip exclusion
                    }
                }

                const products = await Product.find(query)
                    .select(CARD_FIELDS)
                    .populate('collectionRef', 'name slug')
                    .sort({ isFeatured: -1, order: 1, createdAt: -1 })
                    .limit(limit)
                    .lean();

                return products.map(serializeDoc);
            }
        } catch (e) {
            console.error("DB Error getRelatedProducts:", e);
            return [];
        }
        return [];
    }
};

// Helper: Convert MongoDB _id/dates to simple strings for Next.js components
function serializeDoc(doc) {
    if (!doc) return null;
    return JSON.parse(JSON.stringify(doc));
}
