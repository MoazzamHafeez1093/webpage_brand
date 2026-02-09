'use server';

import { db } from '@/lib/db';

// Wrapper actions to be called from Client Components

// --- UTILS / SEEDING ---
export async function seedCategoriesAction() {
    try {
        const res = await db.seedCategories();
        return { success: true, message: res.message };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// --- PRODUCT ACTIONS ---
export async function getProductsAction(category) {
    try {
        const items = await db.getAllItems(category);
        return JSON.parse(JSON.stringify(items));
    } catch (e) {
        return [];
    }
}

export async function createProductAction(data) {
    try {
        if (!process.env.MONGODB_URI) {
            return { success: false, error: "MONGODB_URI is missing in Vercel Environment Variables." };
        }

        // Auto-create category if it doesn't exist
        if (data.category) {
            const categories = await db.getAllCategories();
            const exists = categories.find(c => c.name.toLowerCase() === data.category.toLowerCase());
            if (!exists) {
                await db.createCategory({ name: data.category, type: 'general' });
            }
        }

        const newItem = await db.createItem(data);
        return { success: true, item: JSON.parse(JSON.stringify(newItem)) };
    } catch (e) {
        console.error("Create Action Error:", e);
        return { success: false, error: e.message || "Failed to create product" };
    }
}

export async function deleteProductAction(id) {
    try {
        await db.deleteItem(id);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// --- COLLECTION ACTIONS ---
export async function getCollectionsAction() {
    try {
        const collections = await db.getAllCollections();
        return JSON.parse(JSON.stringify(collections));
    } catch (e) {
        console.error("Get Collections Action Error:", e);
        return [];
    }
}

export async function createNewCollectionAction(data) {
    try {
        console.log("Creating Collection:", data);
        const newCollection = await db.createCollection(data);
        return { success: true, collection: JSON.parse(JSON.stringify(newCollection)) };
    } catch (e) {
        console.error("Create Collection Error:", e);
        return { success: false, error: e.message };
    }
}

export async function deleteCollectionAction(id) {
    try {
        await db.deleteCollection(id);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

export async function addProductToCollectionAction(collectionId, productId) {
    try {
        const updatedCollection = await db.addProductToCollection(collectionId, productId);
        return { success: true, collection: JSON.parse(JSON.stringify(updatedCollection)) };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

export async function removeProductFromCollectionAction(collectionId, productId) {
    try {
        await db.removeProductFromCollection(collectionId, productId);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// --- CATEGORY ACTIONS ---
export async function getCategoriesAction() {
    try {
        const categories = await db.getAllCategories();
        return JSON.parse(JSON.stringify(categories));
    } catch (e) {
        console.error("Get Categories Action Error:", e);
        return [];
    }
}

export async function getCategoryTreeAction() {
    try {
        const tree = await db.getCategoryTree();
        return JSON.parse(JSON.stringify(tree));
    } catch (e) {
        console.error("Get Category Tree Action Error:", e);
        return [];
    }
}

export async function createNewCategoryAction(data) {
    try {
        console.log("Creating Category:", data);
        const newCategory = await db.createCategory(data);
        return { success: true, category: JSON.parse(JSON.stringify(newCategory)) };
    } catch (e) {
        console.error("Create Category Error:", e);
        return { success: false, error: e.message };
    }
}

export async function updateCategoryAction(id, data) {
    try {
        const updated = await db.updateCategory(id, data);
        return { success: true, category: JSON.parse(JSON.stringify(updated)) };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

export async function deleteCategoryAction(id) {
    try {
        await db.deleteCategory(id);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}
