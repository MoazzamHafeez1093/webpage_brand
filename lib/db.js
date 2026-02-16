// lib/db.js
import { dbConnect } from './mongoose';
import Collection from '@/models/Collection';
import Product from '@/models/Product';

// --- HYBRID DATA LAYER ---
export const db = {
    getAllItems: async (collectionSlug) => {
        try {
            const conn = await dbConnect();
            if (conn) {
                let query = { isActive: true };

                if (collectionSlug && collectionSlug !== 'All' && collectionSlug !== 'all') {
                    const collectionDoc = await Collection.findOne({ slug: collectionSlug });
                    if (collectionDoc) {
                        // Find this collection AND all its descendant children (recursive)
                        const getAllDescendantIds = async (parentId) => {
                            const children = await Collection.find({ parentCollection: parentId, isActive: true });
                            let ids = [];
                            for (const child of children) {
                                ids.push(child._id);
                                const grandchildren = await getAllDescendantIds(child._id);
                                ids = ids.concat(grandchildren);
                            }
                            return ids;
                        };

                        const descendantIds = await getAllDescendantIds(collectionDoc._id);
                        const allCollectionIds = [collectionDoc._id, ...descendantIds];
                        query.collectionRef = { $in: allCollectionIds };
                    } else {
                        return [];
                    }
                }

                const products = await Product.find(query)
                    .populate('collectionRef')
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
                const collections = await Collection.find({ isActive: true })
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
                const collections = await Collection.find({ isActive: true }).sort({ order: 1 }).lean();
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
                const collection = await Collection.findOne({ slug, isActive: true }).lean();
                if (!collection) return null;

                // Get children
                const children = await Collection.find({ parentCollection: collection._id, isActive: true })
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
                    parentCollection: null
                }).sort({ order: 1 }).lean();

                const result = [];
                for (const collection of topLevelCollections) {
                    const getAllDescendantIds = async (parentId) => {
                        const children = await Collection.find({ parentCollection: parentId, isActive: true });
                        let ids = [];
                        for (const child of children) {
                            ids.push(child._id);
                            const grandchildren = await getAllDescendantIds(child._id);
                            ids = ids.concat(grandchildren);
                        }
                        return ids;
                    };

                    const descendantIds = await getAllDescendantIds(collection._id);
                    const allIds = [collection._id, ...descendantIds];

                    const products = await Product.find({
                        collectionRef: { $in: allIds },
                        isActive: true
                    }).populate('collectionRef').sort({ order: 1, createdAt: -1 }).lean();

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
                // Find products linked to this collection (and its children)
                const getAllDescendantIds = async (parentId) => {
                    const children = await Collection.find({ parentCollection: parentId, isActive: true });
                    let ids = [];
                    for (const child of children) {
                        ids.push(child._id);
                        const grandchildren = await getAllDescendantIds(child._id);
                        ids = ids.concat(grandchildren);
                    }
                    return ids;
                };

                const descendantIds = await getAllDescendantIds(categoryDoc._id);
                const allIds = [categoryDoc._id, ...descendantIds];

                const products = await Product.find({
                    collectionRef: { $in: allIds },
                    isActive: true
                })
                    .populate('collectionRef')
                    .sort({ order: 1, createdAt: -1 })
                    .lean();

                return products.map(serializeDoc);
            }
        } catch (e) {
            console.error("DB Error getProductsByCategory:", e);
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
