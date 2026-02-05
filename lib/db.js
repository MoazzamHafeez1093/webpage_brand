// lib/db.js
import connectToDatabase from './mongoose';
import ClothingItem from '@/models/ClothingItem';

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
            if (conn) {
                console.log("📝 Attempting to save to MongoDB...", data.title);
                const newItem = await ClothingItem.create(data);
                console.log("✅ Saved to MongoDB:", newItem._id);
                return serializeDoc(newItem.toObject());
            } else {
                console.warn("⚠️ No DB Connection returned. Using Mock.");
            }
        } catch (e) {
            console.error("❌ DB Create Error:", e.message);
        }
        // Mock
        console.log("⚠️ Persisting to temporary in-memory mock data.");
        const newItem = { _id: Date.now().toString(), ...data };
        mockItems.push(newItem);
        return newItem;
    },

    deleteItem: async (id) => {
        try {
            const conn = await connectToDatabase();
            if (conn) {
                await ClothingItem.findByIdAndDelete(id);
                return true;
            }
        } catch (e) {
            console.error("Delete Error:", e);
        }
        // Mock
        mockItems = mockItems.filter(i => i._id !== id);
        return true;
    }
};

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
