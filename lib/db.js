// lib/db.js
import connectToDatabase from './mongoose';
import ClothingItem from '@/models/ClothingItem';
import Collection from '@/models/Collection';
import Category from '@/models/Category';

// --- MOCK DATA FALLBACK ---
let mockItems = [
    {
        _id: '1',
        title: 'Italian Merino Wool Sweater',
        description: 'Fine-gauge merino wool for sophisticated layering.',
        price: 120.00,
        category: 'Outerwear',
        sizes: ['S', 'M', 'L', 'XL'],
        inStock: true,
        images: [{
            thumbnail: 'https://images.unsplash.com/photo-1620799140408-ed5341cdb4f3?auto=format&fit=crop&w=600&q=80',
            fullRes: 'https://images.unsplash.com/photo-1620799140408-ed5341cdb4f3?auto=format&fit=crop&w=2000&q=100'
        }]
    },
    {
        _id: '2',
        title: 'Oxford Cotton Shirt',
        description: 'Classic durable oxford cloth with a perfect relaxed fit.',
        price: 85.00,
        category: 'Shirts',
        sizes: ['M', 'L'],
        inStock: true,
        images: [{
            thumbnail: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
            fullRes: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=2000&q=100'
        }]
    },
    {
        _id: '3',
        title: 'Pleated Linen Trousers',
        description: 'Breathable linen trousers with a double pleat for elegance.',
        price: 150.00,
        category: 'Pants',
        sizes: ['30', '32', '34'],
        inStock: true,
        images: [{
            thumbnail: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80',
            fullRes: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=2000&q=100'
        }]
    },
    {
        _id: '4',
        title: 'Leather Weekender Bag',
        description: 'Full-grain leather bag for your short trips.',
        price: 450.00,
        category: 'Accessories',
        sizes: ['One Size'],
        inStock: true,
        images: [{
            thumbnail: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
            fullRes: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=2000&q=100'
        }]
    }
];

// --- HYBRID DATA LAYER ---
// Checks if MongoDB is connected. If yes, runs real queries. No? Mock data.

export const db = {
    getAllItems: async (category) => {
        try {
            const conn = await connectToDatabase();
            if (conn) {
                // Real DB
                const query = category && category !== 'All' ? { category } : {};
                const items = await ClothingItem.find(query).sort({ createdAt: -1 }).lean();
                return items.map(serializeDoc);
            }
        } catch (e) {
            // console.warn("Using Mock DB due to connection error:", e.message);
        }
        // Mock
        return new Promise((resolve) => {
            let items = [...mockItems];
            if (category && category !== 'All') {
                items = items.filter(i => i.category === category);
            }
            setTimeout(() => resolve(items), 500);
        });
    },

    getItemById: async (id) => {
        try {
            const conn = await connectToDatabase();
            if (conn) {
                // Real DB
                try {
                    const item = await ClothingItem.findById(id).lean();
                    return item ? serializeDoc(item) : null;
                } catch (e) {
                    return null; // Handle invalid IDs gracefully
                }
            }
        } catch (e) {
            // console.warn("Using Mock DB for lookup");
        }
        // Mock
        return new Promise((resolve) => {
            const item = mockItems.find(i => i._id === id);
            setTimeout(() => resolve(item || null), 300);
        });
    },

    createItem: async (data) => {
        try {
            const conn = await connectToDatabase();
            if (!conn) throw new Error("Database Connection Failed");

            console.log("📝 Attempting to save to MongoDB...", data.title);
            const newItem = await ClothingItem.create(data);
            console.log("✅ Saved to MongoDB:", newItem._id);
            return serializeDoc(newItem.toObject());
        } catch (e) {
            console.error("❌ DB Create Error:", e.message);
            throw new Error(e.message); // Throw to UI
        }
    },

    deleteItem: async (id) => {
        try {
            const conn = await connectToDatabase();
            if (!conn) throw new Error("Database Connection Failed");
            await ClothingItem.findByIdAndDelete(id);
            return true;
        } catch (e) {
            console.error("Delete Error:", e);
            throw new Error(e.message);
        }
    },

    // --- COLLECTION LOGIC ---
    getAllCollections: async () => {
        try {
            const conn = await connectToDatabase();
            if (conn) {
                const collections = await Collection.find({})
                    .populate('products')
                    .sort({ createdAt: -1 })
                    .lean();
                return collections.map(serializeDoc);
            }
        } catch (e) {
            console.error("DB Error getAllCollections:", e);
            return [];
        }
    },

    createCollection: async (data) => {
        try {
            const conn = await connectToDatabase();
            if (!conn) throw new Error("Database Connection Failed");
            const newCollection = await Collection.create(data);
            return serializeDoc(newCollection.toObject());
        } catch (e) {
            console.error("DB Create Collection Error:", e);
            throw new Error(e.message);
        }
    },

    deleteCollection: async (id) => {
        try {
            const conn = await connectToDatabase();
            if (!conn) throw new Error("Database Connection Failed");
            await Collection.findByIdAndDelete(id);
            return true;
        } catch (e) {
            console.error("Delete Collection Error:", e);
            throw new Error(e.message);
        }
    },

    addProductToCollection: async (collectionId, productId) => {
        try {
            const conn = await connectToDatabase();
            if (!conn) throw new Error("Database Connection Failed");
            const collection = await Collection.findById(collectionId);
            if (!collection.products.includes(productId)) {
                collection.products.push(productId);
                await collection.save();
            }
            return serializeDoc(collection.toObject());
        } catch (e) {
            console.error("Add Product Collection Error:", e);
            throw new Error(e.message);
        }
    },

    removeProductFromCollection: async (collectionId, productId) => {
        try {
            const conn = await connectToDatabase();
            if (!conn) throw new Error("Database Connection Failed");
            await Collection.findByIdAndUpdate(collectionId, {
                $pull: { products: productId }
            });
            return true;
        } catch (e) {
            console.error("Remove Product Collection Error:", e);
            throw new Error(e.message);
        }
    },

    // --- CATEGORY LOGIC ---
    getAllCategories: async () => {
        try {
            const conn = await connectToDatabase();
            if (conn) {
                const categories = await Category.find({}).sort({ order: 1 }).lean();
                return categories.map(serializeDoc);
            }
        } catch (e) {
            console.error("DB Error getAllCategories:", e);
            return [];
        }
    },

    getCategoryTree: async () => {
        try {
            const conn = await connectToDatabase();
            if (conn) {
                const categories = await Category.find({}).sort({ order: 1 }).lean();
                const serialized = categories.map(serializeDoc);
                return buildTree(serialized);
            }
        } catch (e) {
            console.error("DB Error getCategoryTree:", e);
            return [];
        }
    },

    getCategoryBySlug: async (slug) => {
        try {
            const conn = await connectToDatabase();
            if (conn) {
                const category = await Category.findOne({ slug }).lean();
                if (!category) return null;

                // Get children
                const children = await Category.find({ parent: category._id }).lean();
                category.children = children.map(serializeDoc);

                return serializeDoc(category);
            }
        } catch (e) {
            console.error("DB Error getCategoryBySlug:", e);
            return null;
        }
    },

    getProductsByCategory: async (categoryDoc) => {
        try {
            const conn = await connectToDatabase();
            if (conn) {
                // Hybrid query: match by category ID (future) OR category Name (legacy)
                const query = {
                    $or: [
                        { category: categoryDoc.name }, // Legacy string match
                        { categoryId: categoryDoc._id } // Future ID match
                    ]
                };
                const items = await ClothingItem.find(query).sort({ createdAt: -1 }).lean();
                return items.map(serializeDoc);
            }
        } catch (e) {
            console.error("DB Error getProductsByCategory:", e);
            return [];
        }
    },

    seedCategories: async () => {
        try {
            const conn = await connectToDatabase();
            if (!conn) throw new Error("Database Connection Failed");

            const count = await Category.countDocuments();
            if (count > 0) return { message: "Categories already exist." };

            const retail = await Category.create({ name: 'Retail', type: 'retail' });
            const custom = await Category.create({ name: 'Custom', type: 'custom' });

            await Category.create({ name: 'Bridal', parent: custom._id, type: 'custom' });
            await Category.create({ name: 'Evening Wear', parent: custom._id, type: 'custom' });
            await Category.create({ name: 'Ready to Wear', parent: retail._id, type: 'retail' });

            return { success: true, message: "Default categories created." };
        } catch (e) {
            console.error("Seed Error:", e);
            throw new Error(e.message);
        }
    },

    createCategory: async (data) => {
        try {
            const conn = await connectToDatabase();
            if (!conn) throw new Error("Database Connection Failed");
            const newCategory = await Category.create(data);
            return serializeDoc(newCategory.toObject());
        } catch (e) {
            console.error("DB Create Category Error:", e);
            throw new Error(e.message);
        }
    },

    updateCategory: async (id, data) => {
        try {
            const conn = await connectToDatabase();
            if (!conn) throw new Error("Database Connection Failed");

            // Basic cycle detection if moving
            if (data.parent) {
                if (data.parent === id) throw new Error("Cannot be own parent");
            }

            const updated = await Category.findByIdAndUpdate(id, data, { new: true });
            return serializeDoc(updated.toObject());
        } catch (e) {
            console.error("DB Update Category Error:", e);
            throw new Error(e.message);
        }
    },

    deleteCategory: async (id) => {
        try {
            const conn = await connectToDatabase();
            if (!conn) throw new Error("Database Connection Failed");

            // Cascade delete children
            await Category.deleteMany({ parent: id });

            await Category.findByIdAndDelete(id);
            return true;
        } catch (e) {
            console.error("Delete Category Error:", e);
            throw new Error(e.message);
        }
    }
};

// Helper: Build tree from flat list
function buildTree(categories, parentId = null) {
    const branch = [];
    categories.forEach(cat => {
        // Handle null vs string comparison safely
        const catParent = cat.parent ? cat.parent.toString() : null;
        const targetParent = parentId ? parentId.toString() : null;

        if (catParent === targetParent) {
            const children = buildTree(categories, cat._id);
            if (children.length) {
                cat.children = children;
            }
            branch.push(cat);
        }
    });
    return branch;
}

// Helper: Convert MongoDB _id/dates to simple strings for Next.js components
function serializeDoc(doc) {
    if (!doc) return null;

    // Top level
    if (doc._id && typeof doc._id !== 'string') doc._id = doc._id.toString();
    if (doc.createdAt) doc.createdAt = doc.createdAt.toString();
    if (doc.updatedAt) doc.updatedAt = doc.updatedAt.toString();

    // Nested Arrays (like images) which usually have their own _id
    if (doc.images && Array.isArray(doc.images)) {
        doc.images = doc.images.map(img => {
            if (img._id && typeof img._id !== 'string') img._id = img._id.toString();
            return img;
        });
    }

    return JSON.parse(JSON.stringify(doc)); // Final safety net to strip any remaining non-serializables
}
