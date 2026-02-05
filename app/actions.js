'use server';

import { db } from '@/lib/db';

// Wrapper actions to be called from Client Components
export async function getProductsAction(category) {
    const items = await db.getAllItems(category);
    // We must ensure the result is a plain object for serialization
    return JSON.parse(JSON.stringify(items));
}

export async function createProductAction(data) {
    const newItem = await db.createItem(data);
    return JSON.parse(JSON.stringify(newItem));
}

export async function deleteProductAction(id) {
    await db.deleteItem(id);
    return true;
}
