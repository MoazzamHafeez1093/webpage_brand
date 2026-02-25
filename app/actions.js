'use server'

import { dbConnect } from '@/lib/mongoose';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

// SIDE EFFECT IMPORTS TO REGISTER MODELS
import '@/models/Collection';
import '@/models/Product';

// ============================================
// COLLECTION ACTIONS
// ============================================

export async function createCollectionAction(formData) {
    try {
        await dbConnect();

        // Runtime Retrieval to avoid build issues
        const Collection = mongoose.models.Collection;

        const name = formData.get('name');
        if (!name || name.trim() === '') {
            return { success: false, error: 'Collection name is required' };
        }

        // Explicit Slug Logic (Moved from Model Hook)
        let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let slug = baseSlug;
        let counter = 1;

        while (await Collection.findOne({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const parentId = formData.get('parentCollection');
        const parentCollection = (parentId && parentId !== 'null' && parentId !== '') ? parentId : null;

        const newCollection = await Collection.create({
            name: name.trim(),
            description: (formData.get('description') || '').trim(),
            slug,
            coverImage: formData.get('coverImage') || '',
            parentCollection,
            order: 0
        });

        try {
            revalidatePath('/');
            revalidatePath('/admin/secret-login');
        } catch (e) {
            console.warn('Revalidate warning:', e);
        }

        return {
            success: true,
            collection: JSON.parse(JSON.stringify(newCollection))
        };

    } catch (error) {
        console.error('[CreateCollection] ERROR:', error);
        return {
            success: false,
            error: `Server Error: ${error.message}`
        };
    }
}


export async function getCollectionsAction() {
    try {
        await dbConnect();
        const Collection = mongoose.models.Collection;
        const collections = await Collection.find({ isActive: true, isArchived: { $ne: true } }).sort({ order: 1 }).lean();
        return JSON.parse(JSON.stringify(collections));
    } catch (error) {
        console.error('Get all collections error:', error);
        return [];
    }
}

export async function getCollectionTreeAction(includeArchived = false) {
    try {
        await dbConnect();
        const Collection = mongoose.models.Collection;
        const query = includeArchived
            ? { isActive: true }
            : { isActive: true, isArchived: { $ne: true } };
        const collections = await Collection.find(query).sort({ order: 1 }).lean();

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

export async function updateCollectionAction(id, formData) {
    try {
        await dbConnect();
        const Collection = mongoose.models.Collection;

        const name = formData.get('name');
        if (!name || !name.trim()) return { success: false, error: 'Name required' };

        const parentId = formData.get('parentCollection');
        const parentCollection = (parentId && parentId !== 'null' && parentId !== '') ? parentId : null;

        // Prevent circular dependency
        if (parentCollection === id) {
            return { success: false, error: 'Cannot set collection as its own parent' };
        }

        await Collection.findByIdAndUpdate(id, {
            name: name.trim(),
            description: (formData.get('description') || '').trim(),
            coverImage: formData.get('coverImage') || '',
            parentCollection
        });

        revalidatePath('/');
        revalidatePath('/admin/secret-login');
        return { success: true };
    } catch (error) {
        console.error('[UpdateCollection] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteCollectionAction(id) {
    try {
        await dbConnect();
        const Collection = mongoose.models.Collection;
        const Product = mongoose.models.Product;

        const hasChildren = await Collection.findOne({ parentCollection: id });
        if (hasChildren) return { success: false, error: 'Cannot delete: Has subcollections' };

        const hasProducts = await Product.findOne({ collectionRef: id });
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

export async function updateProductAction(id, formData) {
    try {
        await dbConnect();
        const Product = mongoose.models.Product;

        const collectionId = formData.get('collection');
        if (!collectionId) return { success: false, error: 'Collection required' };

        const imagesString = formData.get('images') || '';
        const images = imagesString.split(',').filter(x => x);

        // Parse sizeOptions JSON
        let sizeOptions = [];
        const sizeOptionsRaw = formData.get('sizeOptions');
        if (sizeOptionsRaw) {
            try { sizeOptions = JSON.parse(sizeOptionsRaw); } catch (e) { sizeOptions = []; }
        }

        await Product.findByIdAndUpdate(id, {
            name: formData.get('name'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')) || 0,
            images,
            collectionRef: collectionId,
            businessType: formData.get('businessType') || 'retail',
            inspirationImage: formData.get('inspirationImage') || '',
            availableSizes: (formData.get('availableSizes') || '').split(',').filter(x => x),
            sizeOptions,
            hasSizes: formData.get('hasSizes') === 'true',
            customizationNotes: formData.get('customizationNotes') || '',
            inStock: formData.get('inStock') !== 'false',
            isOutOfStock: formData.get('isOutOfStock') === 'true',
            isArchived: formData.get('isArchived') === 'true',
            order: parseInt(formData.get('order')) || 0,
            isActive: formData.get('isActive') !== 'false',
            isFeatured: formData.get('isFeatured') === 'true',
            metaTitle: formData.get('metaTitle') || '',
            metaDescription: formData.get('metaDescription') || '',
            tags: (formData.get('tags') || '').split(',').map(t => t.trim()).filter(Boolean),
        });

        revalidatePath('/');
        revalidatePath('/admin/secret-login');
        return { success: true };
    } catch (error) {
        console.error('[UpdateProduct] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteProductAction(id) {
    try {
        await dbConnect();
        const Product = mongoose.models.Product;
        await Product.findByIdAndDelete(id);

        revalidatePath('/');
        revalidatePath('/admin/secret-login');
        return { success: true };
    } catch (error) {
        console.error('[DeleteProduct] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function createProductAction(formData) {
    try {
        await dbConnect();
        const Product = mongoose.models.Product;

        const collectionId = formData.get('collection');
        if (!collectionId) return { success: false, error: 'Collection required' };

        const name = formData.get('name');
        const imagesString = formData.get('images') || '';
        const images = imagesString.split(',').filter(x => x);

        // Parse sizeOptions JSON
        let sizeOptions = [];
        const sizeOptionsRaw = formData.get('sizeOptions');
        if (sizeOptionsRaw) {
            try { sizeOptions = JSON.parse(sizeOptionsRaw); } catch (e) { sizeOptions = []; }
        }

        const product = await Product.create({
            name,
            description: formData.get('description'),
            price: parseFloat(formData.get('price')) || 0,
            images,
            collectionRef: collectionId,
            businessType: formData.get('businessType') || 'retail',
            inspirationImage: formData.get('inspirationImage') || '',
            availableSizes: (formData.get('availableSizes') || '').split(',').filter(x => x),
            sizeOptions,
            hasSizes: formData.get('hasSizes') === 'true',
            customizationNotes: formData.get('customizationNotes') || '',
            inStock: formData.get('inStock') !== 'false',
            isOutOfStock: formData.get('isOutOfStock') === 'true',
            isArchived: formData.get('isArchived') === 'true',
            order: parseInt(formData.get('order')) || 0,
            isActive: formData.get('isActive') !== 'false',
            isFeatured: formData.get('isFeatured') === 'true',
            metaTitle: formData.get('metaTitle') || '',
            metaDescription: formData.get('metaDescription') || '',
            tags: (formData.get('tags') || '').split(',').map(t => t.trim()).filter(Boolean),
        });

        revalidatePath('/');
        revalidatePath('/admin/secret-login');

        return { success: true, product: JSON.parse(JSON.stringify(product)) };
    } catch (error) {
        console.error('[CreateProduct] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllProductsAction(includeArchived = false) {
    try {
        await dbConnect();
        const Product = mongoose.models.Product;
        const query = includeArchived ? {} : { isArchived: { $ne: true } };
        const products = await Product.find(query).populate('collectionRef').sort({ order: 1 }).lean();
        return JSON.parse(JSON.stringify(products));
    } catch (error) {
        console.error('Get products error:', error);
        return [];
    }
}


// ============================================
// ARCHIVE ACTIONS
// ============================================

export async function archiveProductAction(id) {
    try {
        await dbConnect();
        const Product = mongoose.models.Product;
        await Product.findByIdAndUpdate(id, { isArchived: true, archivedAt: new Date() });
        revalidatePath('/');
        revalidatePath('/admin/secret-login');
        return { success: true };
    } catch (error) {
        console.error('[ArchiveProduct] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function unarchiveProductAction(id) {
    try {
        await dbConnect();
        const Product = mongoose.models.Product;
        await Product.findByIdAndUpdate(id, { isArchived: false, archivedAt: null });
        revalidatePath('/');
        revalidatePath('/admin/secret-login');
        return { success: true };
    } catch (error) {
        console.error('[UnarchiveProduct] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function archiveCollectionAction(id) {
    try {
        await dbConnect();
        const Collection = mongoose.models.Collection;
        await Collection.findByIdAndUpdate(id, { isArchived: true, archivedAt: new Date() });
        revalidatePath('/');
        revalidatePath('/admin/secret-login');
        return { success: true };
    } catch (error) {
        console.error('[ArchiveCollection] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function unarchiveCollectionAction(id) {
    try {
        await dbConnect();
        const Collection = mongoose.models.Collection;
        await Collection.findByIdAndUpdate(id, { isArchived: false, archivedAt: null });
        revalidatePath('/');
        revalidatePath('/admin/secret-login');
        return { success: true };
    } catch (error) {
        console.error('[UnarchiveCollection] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllCollectionsAction(includeArchived = false) {
    try {
        await dbConnect();
        const Collection = mongoose.models.Collection;
        const query = includeArchived
            ? { isActive: true }
            : { isActive: true, isArchived: { $ne: true } };
        const collections = await Collection.find(query).sort({ order: 1 }).lean();
        return JSON.parse(JSON.stringify(collections));
    } catch (error) {
        console.error('Get all collections error:', error);
        return [];
    }
}

export async function reorderCollectionAction(id, direction) {
    try {
        await dbConnect();
        const Collection = mongoose.models.Collection;

        const current = await Collection.findById(id).lean();
        if (!current) return { success: false, error: 'Collection not found' };

        // Get siblings (same parent level), sorted by order then createdAt
        const siblings = await Collection.find({
            parentCollection: current.parentCollection || null,
            isActive: true
        }).sort({ order: 1, createdAt: 1 }).lean();

        const currentIndex = siblings.findIndex(s => s._id.toString() === id);
        if (currentIndex === -1) return { success: false, error: 'Collection not found in siblings' };

        const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (swapIndex < 0 || swapIndex >= siblings.length) {
            return { success: false, error: 'Already at the edge' };
        }

        // Normalize: assign sequential order values based on current position,
        // then swap the two items. This handles cases where multiple items share order: 0.
        const updates = siblings.map((s, i) => {
            let newOrder = i;
            if (i === currentIndex) newOrder = swapIndex;
            else if (i === swapIndex) newOrder = currentIndex;
            return Collection.findByIdAndUpdate(s._id, { order: newOrder });
        });

        await Promise.all(updates);

        revalidatePath('/');
        revalidatePath('/admin/secret-login');
        return { success: true };
    } catch (error) {
        console.error('[ReorderCollection] Error:', error);
        return { success: false, error: error.message };
    }
}
