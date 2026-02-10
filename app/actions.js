'use server'

import { dbConnect } from '@/lib/mongoose';
import Collection from '@/models/Collection';
import Product from '@/models/Product';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

// ============================================
// COLLECTION ACTIONS
// ============================================

export async function createCollection(formData) {
    try {
        console.log('[CreateCollection] Starting...');

        // 1. Connect DB
        try {
            await dbConnect();
            console.log('[CreateCollection] DB Connected');
        } catch (e) {
            console.error('[CreateCollection] DB Connection Failed:', e);
            return { success: false, error: 'Database connection failed' };
        }

        // 2. Parse Data
        const name = formData.get('name');
        const description = formData.get('description') || '';
        const coverImage = formData.get('coverImage') || '';
        const parentCollectionId = formData.get('parentCollection') || null;

        console.log('[CreateCollection] Data received:', { name, parentCollectionId });

        if (!name || name.trim() === '') {
            return { success: false, error: 'Collection name is required' };
        }

        // 3. Logic - Slug Generation
        let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let slug = baseSlug;
        let counter = 1;

        while (await Collection.findOne({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        // 4. Create
        console.log('[CreateCollection] Creating document...');
        const collection = await Collection.create({
            name: name.trim(),
            description: description.trim(),
            slug,
            coverImage,
            parentCollection: parentCollectionId || null,
        });
        console.log('[CreateCollection] Document created:', collection._id);

        // 5. Revalidate
        try {
            revalidatePath('/');
            revalidatePath('/admin/secret-login');
            console.log('[CreateCollection] Revalidation successful');
        } catch (e) {
            console.error('[CreateCollection] Revalidation failed (non-critical):', e);
        }

        return {
            success: true,
            collection: JSON.parse(JSON.stringify(collection))
        };

    } catch (error) {
        console.error('[CreateCollection] CRITICAL ERROR:', error);
        return {
            success: false,
            error: error.message || 'Failed to create collection'
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
        if (hasChildren) return { success: false, error: 'Has subcollections' };

        const hasProducts = await Product.findOne({ collection: id });
        if (hasProducts) return { success: false, error: 'Has products' };

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
