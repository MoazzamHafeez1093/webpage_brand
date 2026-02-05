'use server';

import { db } from '@/lib/db';

// Wrapper actions to be called from Client Components
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
