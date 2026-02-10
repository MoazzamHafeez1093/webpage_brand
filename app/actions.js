'use server'

import { dbConnect } from '@/lib/mongoose';
import Collection from '@/models/Collection';
import Product from '@/models/Product';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

// ============================================
// COLLECTION ACTIONS
// ============================================

/**
 * RENAMED FUNCTION to bust cache and ensure fresh deployment.
 * Includes massive logging to debug "a is not a function".
 */
export async function createNewCollectionAction(formData) {
    console.log('[CreateCollection] 1. START');

    try {
        // 0. CHECK DEPENDENCIES
        if (typeof dbConnect !== 'function') {
            throw new Error(`dbConnect is not a function, it is: ${typeof dbConnect}`);
        }
        console.log('[CreateCollection] 2. Dependencies checked');

        // 1. CONNECT DB
        await dbConnect();
        console.log('[CreateCollection] 3. DB Connected');

        // 2. PARSE DATA
        const name = formData.get('name');
        console.log('[CreateCollection] 4. Data received:', name);

        if (!name || name.trim() === '') {
            return { success: false, error: 'Collection name is required' };
        }

        // 3. MODEL CHECK
        // Dynamically check the model to ensure it's loaded correctly
        const CollectionModel = mongoose.models.Collection || Collection;
        if (!CollectionModel || typeof CollectionModel.create !== 'function') {
            console.error('[CreateCollection] Model Error. mongoose.models.Collection:', mongoose.models.Collection);
            throw new Error('Collection Model is not loaded correctly (create is not a function)');
        }

        // 4. SLUG GENERATION
        let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let slug = baseSlug;
        let counter = 1;

        while (await CollectionModel.findOne({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        console.log('[CreateCollection] 5. Slug generated:', slug);

        // 5. CREATE DOCUMENT
        const newCollection = await CollectionModel.create({
            name: name.trim(),
            description: (formData.get('description') || '').trim(),
            slug,
            coverImage: formData.get('coverImage') || '',
            parentCollection: formData.get('parentCollection') || null,
            order: 0 // Default order
        });
        console.log('[CreateCollection] 6. Created:', newCollection._id);

        // 6. REVALIDATE
        try {
            if (typeof revalidatePath === 'function') {
                revalidatePath('/');
                revalidatePath('/admin/secret-login');
                console.log('[CreateCollection] 7. Revalidated');
            } else {
                console.warn('[CreateCollection] revalidatePath is NOT a function');
            }
        } catch (e) {
            console.error('[CreateCollection] Revalidation warning:', e);
        }

        return {
            success: true,
            collection: JSON.parse(JSON.stringify(newCollection))
        };

    } catch (error) {
        console.error('[CreateCollection] FATAL ERROR:', error);
        // Return full stack to UI for debugging
        return {
            success: false,
            error: `Server Error: ${error.message}`
        };
    }
}

export async function getAllCollections() {
    try {
        await dbConnect();
        const collections = await Collection.find({ isActive: true }).sort({ order: 1 }).lean();
        return JSON.parse(JSON.stringify(collections));
    } catch (error) {
        console.error('Get all collections error:', error);
        return [];
    }
}

export async function getCollectionTree() {
    try {
        await dbConnect();
        const collections = await Collection.find({ isActive: true }).sort({ order: 1 }).lean();

        const buildTree = (parentId = null) => {
            return collections
                .filter(col => {
                    const colParentId = col.parentCollection?.toString() || null;
                    const targetParentId = parentId?.toString() || null;
                    return colParentId === targetParentId;
                })
                .map(col => ({
                    ...col,
                    _id: col._id.toString(),
                    children: buildTree(col._id)
                }));
        };

        return JSON.parse(JSON.stringify(buildTree()));
    } catch (error) {
        console.error('Get collection tree error:', error);
        return [];
    }
}

export async function deleteCollection(id) {
    try {
        await dbConnect();

        const hasChildren = await Collection.findOne({ parentCollection: id });
        if (hasChildren) return { success: false, error: 'Cannot delete: Has subcollections' };

        const hasProducts = await Product.findOne({ collection: id });
        if (hasProducts) return { success: false, error: 'Cannot delete: Contains products' };

        await Collection.findByIdAndDelete(id);

        revalidatePath('/');
        revalidatePath('/admin/secret-login');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================
// PRODUCT ACTIONS
// ============================================

export async function createProduct(formData) {
    try {
        await dbConnect();

        const collectionId = formData.get('collection');
        if (!collectionId) return { success: false, error: 'Collection required' };

        const name = formData.get('name');
        const imagesString = formData.get('images') || '';
        const images = imagesString.split(',').filter(x => x);

        const product = await Product.create({
            name,
            description: formData.get('description'),
            price: parseFloat(formData.get('price')) || 0,
            images,
            collection: collectionId,
            businessType: formData.get('businessType') || 'retail',
            inspirationImage: formData.get('inspirationImage'),
        });

        revalidatePath('/');
        revalidatePath('/admin/secret-login');

        return { success: true, product: JSON.parse(JSON.stringify(product)) };
    } catch (error) {
        console.error('[CreateProduct] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllProducts() {
    try {
        await dbConnect();
        const products = await Product.find({ isActive: true }).populate('collection').sort({ order: 1 }).lean();
        return JSON.parse(JSON.stringify(products));
    } catch (error) {
        console.error('Get products error:', error);
        return [];
    }
}
