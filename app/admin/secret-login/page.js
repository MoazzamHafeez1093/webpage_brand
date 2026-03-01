'use client'
import { useState, useEffect, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import {
    createCollectionAction,
    getCollectionsAction,
    getCollectionTreeAction,
    deleteCollectionAction,
    updateCollectionAction,
    createProductAction,
    getAllProductsAction,
    updateProductAction,
    deleteProductAction,
    archiveProductAction,
    unarchiveProductAction,
    archiveCollectionAction,
    unarchiveCollectionAction,
    getAllCollectionsAction,
    reorderCollectionAction
} from '@/app/actions';
import Script from 'next/script';
import styles from './admin.module.css';

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'];

export default function AdminDashboard() {
    // ============ AUTH STATE ============
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [authError, setAuthError] = useState('');

    // ============ DASHBOARD STATE ============
    const [activeTab, setActiveTab] = useState('collections');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Collections state
    const [collections, setCollections] = useState([]);
    const [collectionTree, setCollectionTree] = useState([]);
    const [editingCollectionId, setEditingCollectionId] = useState(null);

    // Products state
    const [products, setProducts] = useState([]);
    const [editingProductId, setEditingProductId] = useState(null);
    const [productFilter, setProductFilter] = useState('active'); // 'active' | 'archived' | 'out_of_stock'
    const [collectionFilter, setCollectionFilter] = useState('active'); // 'active' | 'archived'
    const [uploadingImages, setUploadingImages] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [uploadProgress, setUploadProgress] = useState([]); // [{name, status: 'compressing'|'uploading'|'done'|'error'}]
    const productImageInputRef = useRef(null);
    const inspirationImageInputRef = useRef(null);

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null, type: 'danger' });

    // Collection form
    const [collectionForm, setCollectionForm] = useState({
        name: '',
        description: '',
        parentCollection: ''
    });

    // Product form
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        price: '',
        images: [],
        collection: '',
        businessType: 'retail',
        inspirationImage: '',
        availableSizes: [],
        sizeOptions: [],
        hasSizes: false,
        customizationNotes: '',
        inStock: true,
        order: 0,
        isActive: true,
        isFeatured: false,
        metaTitle: '',
        metaDescription: '',
        tags: ''
    });

    // ============ LOAD DATA ============
    useEffect(() => {
        if (isAuthenticated) {
            loadAllData();
        }
    }, [isAuthenticated]);

    // ============ AUTH HANDLER ============
    const handleLogin = (e) => {
        e.preventDefault();
        if (pin === '1234') {
            setIsAuthenticated(true);
            setAuthError('');
        } else {
            setAuthError('Incorrect PIN');
        }
    };

    // ============ DATA LOADING ============
    async function loadAllData() {
        setLoading(true);

        try {
            const [collectionsData, treeData, productsData] = await Promise.all([
                getCollectionsAction(),
                getCollectionTreeAction(true), // include archived for admin view
                getAllProductsAction(true) // include archived for admin view
            ]);

            setCollections(collectionsData || []);
            setCollectionTree(treeData || []);
            setProducts(productsData || []);
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    }

    // ============ COLLECTION HANDLERS ============
    const handleEditCollection = (col) => {
        setEditingCollectionId(col._id);
        setCollectionForm({
            name: col.name,
            description: col.description || '',
            parentCollection: col.parentCollection || ''
        });
        window.scrollTo(0, 0);
    };

    const handleCollectionSubmit = async (e) => {
        e.preventDefault();

        if (!collectionForm.name.trim()) {
            setError('Collection name is required');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const formData = new FormData();
            formData.append('name', collectionForm.name.trim());
            formData.append('description', collectionForm.description.trim());

            if (collectionForm.parentCollection) {
                formData.append('parentCollection', collectionForm.parentCollection);
            }

            let result;
            if (editingCollectionId) {
                result = await updateCollectionAction(editingCollectionId, formData);
            } else {
                result = await createCollectionAction(formData);
            }

            if (result.success) {
                setSuccessMessage(editingCollectionId ? 'Collection updated!' : 'Collection created!');
                resetCollectionForm();
                await loadAllData();
            } else {
                setError(result.error || 'Operation failed');
            }
        } catch (err) {
            console.error('Collection submission catch:', err);
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const resetCollectionForm = () => {
        setEditingCollectionId(null);
        setCollectionForm({
            name: '',
            description: '',
            parentCollection: ''
        });
    };

    const handleDeleteCollection = async (id) => {
        setConfirmModal({
            open: true,
            title: 'Delete Collection',
            message: 'Are you sure you want to permanently delete this collection? This action cannot be undone.',
            type: 'danger',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, open: false }));
                setLoading(true);
                try {
                    const result = await deleteCollectionAction(id);
                    if (result.success) {
                        setSuccessMessage('Collection deleted successfully!');
                        await loadAllData();
                    } else {
                        setError(result.error || 'Failed to delete collection');
                    }
                } catch (err) {
                    setError('An error occurred');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // ============ PRODUCT HANDLERS ============
    const handleEditProduct = (p) => {
        setEditingProductId(p._id);
        const loadedSizeOptions = p.sizeOptions || [];
        setProductForm({
            name: p.name,
            description: p.description || '',
            price: p.price || '',
            images: p.images || [],
            collection: p.collectionRef?._id || p.collectionRef || '',
            businessType: p.businessType || 'retail',
            inspirationImage: p.inspirationImage || '',
            availableSizes: loadedSizeOptions.length > 0
                ? loadedSizeOptions.map(s => s.size)
                : (p.availableSizes || []),
            sizeOptions: loadedSizeOptions.length > 0
                ? loadedSizeOptions
                : (p.availableSizes || []).map(s => ({ size: s, inStock: true, stockQuantity: 0 })),
            hasSizes: p.hasSizes || false,
            customizationNotes: p.customizationNotes || '',
            inStock: p.inStock !== false,
            order: p.order || 0,
            isActive: p.isActive !== false,
            isFeatured: p.isFeatured || false,
            metaTitle: p.metaTitle || '',
            metaDescription: p.metaDescription || '',
            tags: (p.tags || []).join(', ')
        });
        setActiveTab('products');
        window.scrollTo(0, 0);
    };

    const handleDeleteProduct = async (id) => {
        setConfirmModal({
            open: true,
            title: 'Delete Product',
            message: 'Are you sure you want to permanently delete this product? This action cannot be undone.',
            type: 'danger',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, open: false }));
                setLoading(true);
                try {
                    await deleteProductAction(id);
                    setSuccessMessage('Product deleted');
                    await loadAllData();
                } catch (e) {
                    setError('Failed to delete');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // ============ ARCHIVE HANDLERS ============
    const handleArchiveProduct = async (id) => {
        setConfirmModal({
            open: true,
            title: 'Archive Product',
            message: 'This product will be hidden from the storefront. You can restore it later from the Archived tab.',
            type: 'archive',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, open: false }));
                setLoading(true);
                try {
                    const result = await archiveProductAction(id);
                    if (result.success) {
                        setSuccessMessage('Product archived');
                        await loadAllData();
                    } else {
                        setError(result.error || 'Failed to archive');
                    }
                } catch (e) {
                    setError('Failed to archive');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleUnarchiveProduct = async (id) => {
        setLoading(true);
        try {
            const result = await unarchiveProductAction(id);
            if (result.success) {
                setSuccessMessage('Product restored from archive');
                await loadAllData();
            } else {
                setError(result.error || 'Failed to unarchive');
            }
        } catch (e) {
            setError('Failed to unarchive');
        } finally {
            setLoading(false);
        }
    };

    const handleArchiveCollection = async (id) => {
        setConfirmModal({
            open: true,
            title: 'Archive Collection',
            message: 'This collection will be hidden from the storefront navigation. Products inside will remain active unless individually archived.',
            type: 'archive',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, open: false }));
                setLoading(true);
                try {
                    const result = await archiveCollectionAction(id);
                    if (result.success) {
                        setSuccessMessage('Collection archived');
                        await loadAllData();
                    } else {
                        setError(result.error || 'Failed to archive');
                    }
                } catch (e) {
                    setError('Failed to archive');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleUnarchiveCollection = async (id) => {
        setLoading(true);
        try {
            const result = await unarchiveCollectionAction(id);
            if (result.success) {
                setSuccessMessage('Collection restored from archive');
                await loadAllData();
            } else {
                setError(result.error || 'Failed to unarchive');
            }
        } catch (e) {
            setError('Failed to unarchive');
        } finally {
            setLoading(false);
        }
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();

        if (!productForm.name.trim()) {
            setError('Product name is required');
            return;
        }
        if (!productForm.collection) {
            setError('Please select a collection');
            return;
        }
        if (productForm.images.length === 0) {
            setError('Please upload at least one image');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const formData = new FormData();
            formData.append('name', productForm.name.trim());
            formData.append('description', productForm.description.trim());
            formData.append('price', productForm.price || '0');
            formData.append('images', productForm.images.join(','));
            formData.append('collection', productForm.collection);
            formData.append('businessType', productForm.businessType);
            formData.append('inspirationImage', productForm.inspirationImage);
            formData.append('availableSizes', productForm.sizeOptions.map(s => s.size).join(','));
            formData.append('sizeOptions', JSON.stringify(productForm.sizeOptions));
            formData.append('hasSizes', String(productForm.hasSizes));
            formData.append('customizationNotes', productForm.customizationNotes.trim());
            formData.append('inStock', String(productForm.inStock));
            formData.append('isOutOfStock', String(!productForm.inStock));
            formData.append('order', String(productForm.order));
            formData.append('isActive', String(productForm.isActive));
            formData.append('isFeatured', String(productForm.isFeatured));
            formData.append('metaTitle', productForm.metaTitle.trim());
            formData.append('metaDescription', productForm.metaDescription.trim());
            formData.append('tags', productForm.tags);

            let result;
            if (editingProductId) {
                result = await updateProductAction(editingProductId, formData);
            } else {
                result = await createProductAction(formData);
            }

            if (result.success) {
                setSuccessMessage(editingProductId ? 'Product updated!' : 'Product created!');
                resetProductForm();
                await loadAllData();
            } else {
                setError(result.error || 'Operation failed');
            }
        } catch (err) {
            console.error('Product submission error:', err);
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const resetProductForm = () => {
        setEditingProductId(null);
        setProductForm({
            name: '',
            description: '',
            price: '',
            images: [],
            collection: '',
            businessType: 'retail',
            inspirationImage: '',
            availableSizes: [],
            sizeOptions: [],
            hasSizes: false,
            customizationNotes: '',
            inStock: true,
            order: 0,
            isActive: true,
            isFeatured: false,
            metaTitle: '',
            metaDescription: '',
            tags: ''
        });
    };

    const toggleSize = (size) => {
        setProductForm(prev => {
            const isSelected = prev.availableSizes.includes(size);
            if (isSelected) {
                return {
                    ...prev,
                    availableSizes: prev.availableSizes.filter(s => s !== size),
                    sizeOptions: prev.sizeOptions.filter(s => s.size !== size)
                };
            } else {
                return {
                    ...prev,
                    availableSizes: [...prev.availableSizes, size],
                    sizeOptions: [...prev.sizeOptions, { size, inStock: true, stockQuantity: 0 }]
                };
            }
        });
    };

    const toggleSizeStock = (size) => {
        setProductForm(prev => ({
            ...prev,
            sizeOptions: prev.sizeOptions.map(s =>
                s.size === size ? { ...s, inStock: !s.inStock } : s
            )
        }));
    };

    // ============ CLOUDINARY (OPTIMIZED PARALLEL UPLOADS) ============
    const CLOUDINARY_CLOUD_NAME = 'dk9pid4ec';
    const CLOUDINARY_UPLOAD_PRESET = 'my_unsigned_preset';
    const CLOUDINARY_FOLDER = 'digital-atelier';

    // Light compression only — Cloudinary handles final resize + quality
    const compressAndUpload = async (file, index, total) => {
        // Update progress: compressing
        setUploadProgress(prev => prev.map((p, i) => i === index ? { ...p, status: 'compressing' } : p));
        setUploadStatus(`Compressing ${index + 1}/${total}...`);

        // Light compression: just reduce size, don't resize aggressively
        const options = {
            maxSizeMB: 2,            // Lighter than before (was 1MB)
            maxWidthOrHeight: 2400,  // Keep more resolution, let Cloudinary handle final sizing
            useWebWorker: true,
            initialQuality: 0.9,     // Higher quality, Cloudinary will optimize
        };
        const compressed = await imageCompression(file, options);

        // Update progress: uploading
        setUploadProgress(prev => prev.map((p, i) => i === index ? { ...p, status: 'uploading' } : p));

        // Upload to Cloudinary with eager transforms (Cloudinary does final processing)
        const formData = new FormData();
        formData.append('file', compressed);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', CLOUDINARY_FOLDER);

        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: 'POST', body: formData }
        );
        const data = await res.json();
        if (!data.secure_url) throw new Error('Upload failed');

        // Update progress: done
        setUploadProgress(prev => prev.map((p, i) => i === index ? { ...p, status: 'done' } : p));

        return data.secure_url;
    };

    // PARALLEL upload handler — all images upload simultaneously
    const handleImageUpload = async (inputRef, onSuccess, multiple = true) => {
        const files = inputRef.current?.files;
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        setUploadingImages(true);
        setUploadProgress(fileArray.map(f => ({ name: f.name, status: 'pending' })));
        setUploadStatus(`Uploading 0/${fileArray.length}...`);

        try {
            // Upload ALL images in parallel
            const results = await Promise.allSettled(
                fileArray.map((file, index) =>
                    compressAndUpload(file, index, fileArray.length)
                        .then(url => {
                            onSuccess(url);
                            // Update overall status
                            setUploadProgress(prev => {
                                const doneCount = prev.filter(p => p.status === 'done').length + 1;
                                setUploadStatus(`Uploaded ${doneCount}/${fileArray.length}`);
                                return prev;
                            });
                            return url;
                        })
                )
            );

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (failed > 0) {
                setError(`${failed} image(s) failed to upload. ${succeeded} succeeded.`);
            }
            if (succeeded > 0) {
                setSuccessMessage(`${succeeded} image${succeeded > 1 ? 's' : ''} uploaded!`);
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('Image upload failed: ' + err.message);
        } finally {
            setUploadingImages(false);
            setUploadStatus('');
            setUploadProgress([]);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    // URL UPLOAD — upload image from a URL directly to Cloudinary
    const handleUrlUpload = async (imageUrl, onSuccess) => {
        if (!imageUrl || !imageUrl.trim()) {
            setError('Please enter a valid image URL');
            return;
        }

        setUploadingImages(true);
        setUploadStatus('Uploading from URL...');
        setUploadProgress([{ name: 'URL Image', status: 'uploading' }]);

        try {
            const formData = new FormData();
            formData.append('file', imageUrl.trim());
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            formData.append('folder', CLOUDINARY_FOLDER);

            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: 'POST', body: formData }
            );
            const data = await res.json();
            if (!data.secure_url) throw new Error(data.error?.message || 'Upload from URL failed');

            onSuccess(data.secure_url);
            setSuccessMessage('Image uploaded from URL!');
            setUploadProgress([{ name: 'URL Image', status: 'done' }]);
        } catch (err) {
            console.error('URL upload error:', err);
            setError('URL upload failed: ' + err.message);
            setUploadProgress([{ name: 'URL Image', status: 'error' }]);
        } finally {
            setUploadingImages(false);
            setUploadStatus('');
            setTimeout(() => setUploadProgress([]), 1500);
        }
    };

    const openCloudinaryWidget = (onSuccess, multiple = true) => {
        if (typeof window === 'undefined' || !window.cloudinary) {
            setError('Cloudinary widget not loaded. Refresh page.');
            return;
        }
        const widget = window.cloudinary.createUploadWidget(
            {
                cloudName: CLOUDINARY_CLOUD_NAME,
                uploadPreset: CLOUDINARY_UPLOAD_PRESET,
                sources: ['local', 'url', 'camera'],
                multiple: multiple,
                folder: CLOUDINARY_FOLDER,
                eager: 'w_1200,h_1680,c_fill,q_auto,f_auto'
            },
            (error, result) => {
                if (!error && result && result.event === 'success') {
                    onSuccess(result.info.secure_url);
                }
            }
        );
        widget.open();
    };

    // ============ HELPER: Flat list with indentation for parent dropdown ============
    const getCollectionOptions = (tree, level = 0) => {
        let options = [];
        tree.forEach(col => {
            options.push({ _id: col._id, name: '\u00A0\u00A0'.repeat(level) + col.name, level });
            if (col.children && col.children.length > 0) {
                options = options.concat(getCollectionOptions(col.children, level + 1));
            }
        });
        return options;
    };

    // ============ HELPER: RECURSIVE TREE RENDER ============
    const hasArchivedDescendant = (col) => {
        if (col.isArchived) return true;
        if (col.children) return col.children.some(child => hasArchivedDescendant(child));
        return false;
    };

    const filterCollectionTree = (tree, showArchived) => {
        if (showArchived) {
            // Keep any node that is archived OR has an archived descendant
            return tree
                .filter(col => hasArchivedDescendant(col))
                .map(col => ({
                    ...col,
                    children: col.children ? filterCollectionTree(col.children, showArchived) : []
                }));
        } else {
            // Active view: only show non-archived collections
            return tree
                .filter(col => !col.isArchived)
                .map(col => ({
                    ...col,
                    children: col.children ? filterCollectionTree(col.children, showArchived) : []
                }));
        }
    };

    const handleMoveCollection = async (id, direction) => {
        setLoading(true);
        const result = await reorderCollectionAction(id, direction);
        if (result.success) {
            await loadAllData();
        } else {
            setError(result.error || 'Failed to reorder');
        }
        setLoading(false);
    };

    const renderCollectionTree = (tree, level = 0) => {
        return tree.map((col, index) => (
            <div key={col._id} style={{ paddingLeft: `${level * 20}px`, marginBottom: '10px' }}>
                <div className={styles.collectionItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <button
                                onClick={() => handleMoveCollection(col._id, 'up')}
                                disabled={index === 0 || loading}
                                title="Move up"
                                style={{
                                    padding: '0', width: '22px', height: '16px', border: '1px solid #ddd',
                                    background: index === 0 ? '#f5f5f5' : '#fff', cursor: index === 0 ? 'default' : 'pointer',
                                    borderRadius: '3px 3px 0 0', fontSize: '10px', lineHeight: '1', color: index === 0 ? '#ccc' : '#555',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >&#9650;</button>
                            <button
                                onClick={() => handleMoveCollection(col._id, 'down')}
                                disabled={index === tree.length - 1 || loading}
                                title="Move down"
                                style={{
                                    padding: '0', width: '22px', height: '16px', border: '1px solid #ddd',
                                    background: index === tree.length - 1 ? '#f5f5f5' : '#fff', cursor: index === tree.length - 1 ? 'default' : 'pointer',
                                    borderRadius: '0 0 3px 3px', fontSize: '10px', lineHeight: '1', color: index === tree.length - 1 ? '#ccc' : '#555',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-1px'
                                }}
                            >&#9660;</button>
                        </div>
                        <strong>{col.name}</strong>
                        {col.isArchived && <span style={{ marginLeft: '8px', background: '#718096', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase' }}>Archived</span>}
                    </div>
                    <div className={styles.actionButtons}>
                        <button
                            onClick={() => handleEditCollection(col)}
                            className={styles.editBtn}
                        >
                            Edit
                        </button>
                        {col.isArchived ? (
                            <button
                                onClick={() => handleUnarchiveCollection(col._id)}
                                style={{ padding: '4px 12px', background: '#48bb78', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            >
                                Restore
                            </button>
                        ) : (
                            <button
                                onClick={() => handleArchiveCollection(col._id)}
                                style={{ padding: '4px 12px', background: '#718096', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            >
                                Archive
                            </button>
                        )}
                        <button
                            onClick={() => handleDeleteCollection(col._id)}
                            className={styles.deleteBtn}
                        >
                            Delete
                        </button>
                    </div>
                </div>
                {col.children && col.children.length > 0 && (
                    <div style={{ paddingLeft: '10px', borderLeft: '2px solid #eee' }}>
                        {renderCollectionTree(col.children, level + 1)}
                    </div>
                )}
            </div>
        ));
    };

    // ============ LOGIN SCREEN ============
    if (!isAuthenticated) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#f5f5f5'
            }}>
                <form onSubmit={handleLogin} style={{
                    background: 'white',
                    padding: '40px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    width: '100%',
                    maxWidth: '400px'
                }}>
                    <h1 style={{ marginBottom: '20px', fontFamily: 'serif' }}>Digital Atelier Admin</h1>
                    {authError && <p style={{ color: 'red', marginBottom: '15px' }}>{authError}</p>}
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="Enter Admin PIN"
                        style={{
                            padding: '12px',
                            width: '100%',
                            marginBottom: '20px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                        }}
                        autoFocus
                    />
                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#2c2c2c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        LOGIN
                    </button>
                </form>
            </div>
        );
    }

    const nestedCollectionOptions = getCollectionOptions(collectionTree);

    // ============ DASHBOARD UI ============
    return (
        <>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>Admin Dashboard</h1>
                    <div>
                        <a href="/" className={styles.viewSiteBtn} style={{ marginRight: '10px' }}>View Website</a>
                        <button onClick={() => setIsAuthenticated(false)} className={styles.viewSiteBtn} style={{ background: '#666' }}>Logout</button>
                    </div>
                </header>

                {error && (
                    <div className={styles.errorMessage}>
                        {error}
                        <button onClick={() => setError('')}>&times;</button>
                    </div>
                )}
                {successMessage && (
                    <div className={styles.successMessage}>
                        {successMessage}
                        <button onClick={() => setSuccessMessage('')}>&times;</button>
                    </div>
                )}

                <div className={styles.tabs}>
                    <button
                        className={activeTab === 'collections' ? styles.activeTab : ''}
                        onClick={() => setActiveTab('collections')}
                    >
                        Collections
                    </button>
                    <button
                        className={activeTab === 'products' ? styles.activeTab : ''}
                        onClick={() => setActiveTab('products')}
                    >
                        Products
                    </button>
                </div>

                {/* COLLECTIONS TAB */}
                {activeTab === 'collections' && (
                    <div className={styles.tabContent}>
                        <h2>{editingCollectionId ? 'Edit Collection' : 'Create New Collection'}</h2>
                        {editingCollectionId && (
                            <button onClick={resetCollectionForm} style={{ marginBottom: '1rem', padding: '5px 10px' }}>Cancel Edit</button>
                        )}
                        <form onSubmit={handleCollectionSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Collection Name *</label>
                                <input
                                    type="text"
                                    value={collectionForm.name}
                                    onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })}
                                    placeholder="e.g. Bridal, Evening Wear, 2026 Velvet Series"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    value={collectionForm.description}
                                    onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
                                    placeholder="Brief description of this collection"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Parent Collection (for nesting)</label>
                                <select
                                    value={collectionForm.parentCollection}
                                    onChange={(e) => setCollectionForm({ ...collectionForm, parentCollection: e.target.value })}
                                >
                                    <option value="">-- Top Level (No Parent) --</option>
                                    {nestedCollectionOptions
                                        .filter(c => c._id !== editingCollectionId)
                                        .map(col => (
                                            <option key={col._id} value={col._id}>{col.name}</option>
                                        ))}
                                </select>
                                <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                                    Select a parent to nest this inside another collection. E.g. Custom Couture &rarr; Bridal &rarr; 2026 Velvet Series
                                </small>
                            </div>
                            <button type="submit" disabled={loading || uploadingImages} className={styles.submitBtn}>
                                {loading ? 'Processing...' : uploadingImages ? uploadStatus : (editingCollectionId ? 'UPDATE COLLECTION' : 'CREATE COLLECTION')}
                            </button>
                        </form>

                        <h2>Existing Collections</h2>
                        <div className={styles.filterTabs}>
                            <button
                                onClick={() => setCollectionFilter('active')}
                                className={collectionFilter === 'active' ? styles.filterTabActive : styles.filterTabInactive}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setCollectionFilter('archived')}
                                className={collectionFilter === 'archived' ? styles.filterTabArchived : styles.filterTabInactive}
                            >
                                Archived
                            </button>
                        </div>
                        <div className={styles.collectionTree}>
                            {collectionTree.length ? renderCollectionTree(
                                filterCollectionTree(collectionTree, collectionFilter === 'archived')
                            ) : <p>No collections found. Create your first collection above.</p>}
                        </div>
                    </div>
                )}

                {/* PRODUCTS TAB */}
                {activeTab === 'products' && (
                    <div className={styles.tabContent}>
                        <h2>{editingProductId ? 'Edit Product' : 'Create New Product'}</h2>
                        {editingProductId && (
                            <button onClick={resetProductForm} style={{ marginBottom: '1rem', padding: '5px 10px' }}>Cancel Edit</button>
                        )}
                        <form onSubmit={handleProductSubmit} className={styles.form}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className={styles.formGroup}>
                                    <label>Name *</label>
                                    <input
                                        type="text"
                                        value={productForm.name}
                                        onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                        placeholder="Product name"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Collection *</label>
                                    <select
                                        value={productForm.collection}
                                        onChange={e => setProductForm({ ...productForm, collection: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Select Collection --</option>
                                        {nestedCollectionOptions.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    value={productForm.description}
                                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                                    placeholder="Product description"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className={styles.formGroup}>
                                    <label>Business Type</label>
                                    <select
                                        value={productForm.businessType}
                                        onChange={e => setProductForm({ ...productForm, businessType: e.target.value })}
                                    >
                                        <option value="retail">Retail</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Price {productForm.businessType === 'custom' ? '(optional for custom)' : ''}</label>
                                    <input
                                        type="number"
                                        value={productForm.price}
                                        onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            {/* Sizes - only show for retail */}
                            {productForm.businessType === 'retail' && (
                                <div className={styles.formGroup}>
                                    <label>Enable Size Options</label>
                                    <button
                                        type="button"
                                        onClick={() => setProductForm(prev => ({ ...prev, hasSizes: !prev.hasSizes }))}
                                        className={productForm.hasSizes ? styles.toggleBtnGold : styles.toggleBtnOff}
                                    >
                                        {productForm.hasSizes ? '✓ Sizes Enabled' : 'Sizes Disabled'}
                                    </button>
                                </div>
                            )}

                            {productForm.businessType === 'retail' && productForm.hasSizes && (
                                <div className={styles.formGroup}>
                                    <label>Available Sizes</label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {AVAILABLE_SIZES.map(size => (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => toggleSize(size)}
                                                style={{
                                                    padding: '8px 16px',
                                                    border: productForm.availableSizes.includes(size) ? '2px solid #2c2c2c' : '1px solid #ddd',
                                                    background: productForm.availableSizes.includes(size) ? '#2c2c2c' : 'white',
                                                    color: productForm.availableSizes.includes(size) ? 'white' : '#333',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: productForm.availableSizes.includes(size) ? '600' : '400',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                    {productForm.sizeOptions.length > 0 && (
                                        <div style={{ marginTop: '12px', padding: '12px', background: '#f9f9f9', borderRadius: '6px', border: '1px solid #eee' }}>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Per-Size Stock Status & Quantity</label>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {productForm.sizeOptions.map(opt => (
                                                    <div key={opt.size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSizeStock(opt.size)}
                                                            style={{
                                                                padding: '6px 14px',
                                                                border: '1px solid',
                                                                borderColor: opt.inStock ? '#48bb78' : '#e53e3e',
                                                                background: opt.inStock ? '#f0fff4' : '#fff5f5',
                                                                color: opt.inStock ? '#276749' : '#9b2c2c',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                transition: 'all 0.2s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px'
                                                            }}
                                                        >
                                                            <span style={{
                                                                width: '8px',
                                                                height: '8px',
                                                                borderRadius: '50%',
                                                                background: opt.inStock ? '#48bb78' : '#e53e3e',
                                                                display: 'inline-block'
                                                            }} />
                                                            {opt.size}: {opt.inStock ? 'In Stock' : 'Out'}
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={opt.stockQuantity || 0}
                                                            onChange={(e) => {
                                                                const qty = parseInt(e.target.value) || 0;
                                                                setProductForm(prev => ({
                                                                    ...prev,
                                                                    sizeOptions: prev.sizeOptions.map(s =>
                                                                        s.size === opt.size ? { ...s, stockQuantity: qty } : s
                                                                    )
                                                                }));
                                                            }}
                                                            style={{
                                                                width: '60px',
                                                                padding: '4px 6px',
                                                                border: '1px solid #ddd',
                                                                borderRadius: '4px',
                                                                fontSize: '12px',
                                                                textAlign: 'center'
                                                            }}
                                                            placeholder="Qty"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label>Product Images *</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    ref={productImageInputRef}
                                    onChange={() => handleImageUpload(productImageInputRef, (url) => setProductForm(prev => ({ ...prev, images: [...prev.images, url] })), true)}
                                    style={{ display: 'none' }}
                                />
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        onClick={() => productImageInputRef.current?.click()}
                                        className={styles.uploadBtn}
                                        disabled={uploadingImages}
                                    >
                                        📁 From Device
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const url = prompt('Enter image URL:');
                                            if (url) handleUrlUpload(url, (uploadedUrl) => setProductForm(prev => ({ ...prev, images: [...prev.images, uploadedUrl] })));
                                        }}
                                        className={styles.uploadBtn}
                                        disabled={uploadingImages}
                                    >
                                        🔗 From URL
                                    </button>
                                </div>

                                {/* Upload Progress Indicator */}
                                {uploadProgress.length > 0 && (
                                    <div style={{ marginTop: '10px', padding: '12px', background: '#f7fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#2c2c2c' }}>
                                                {uploadStatus}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#718096' }}>
                                                {uploadProgress.filter(p => p.status === 'done').length}/{uploadProgress.length} done
                                            </span>
                                        </div>
                                        {/* Progress bar */}
                                        <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${(uploadProgress.filter(p => p.status === 'done').length / uploadProgress.length) * 100}%`,
                                                height: '100%',
                                                background: 'linear-gradient(90deg, #48bb78, #38a169)',
                                                borderRadius: '3px',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                        {/* Per-image status */}
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                                            {uploadProgress.map((p, i) => (
                                                <span key={i} style={{
                                                    fontSize: '11px',
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    background: p.status === 'done' ? '#c6f6d5' : p.status === 'error' ? '#fed7d7' : p.status === 'uploading' ? '#bee3f8' : '#e2e8f0',
                                                    color: p.status === 'done' ? '#276749' : p.status === 'error' ? '#9b2c2c' : p.status === 'uploading' ? '#2b6cb0' : '#4a5568',
                                                }}>
                                                    {p.status === 'done' ? '✓' : p.status === 'error' ? '✗' : p.status === 'uploading' ? '↑' : '⏳'} {p.name.substring(0, 12)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className={styles.imageGallery}>
                                    {productForm.images.map((img, i) => (
                                        <div key={i} style={{ position: 'relative', display: 'inline-block', marginRight: 5 }}>
                                            <img src={img} alt="Product" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                            <button
                                                type="button"
                                                onClick={() => setProductForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                                                style={{ position: 'absolute', top: -5, right: -5, background: '#e53e3e', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Inspiration Image - only show for custom */}
                            {productForm.businessType === 'custom' && (
                                <div className={styles.formGroup}>
                                    <label>Customer Inspiration Image (for side-by-side comparison)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={inspirationImageInputRef}
                                        onChange={() => handleImageUpload(inspirationImageInputRef, (url) => setProductForm(prev => ({ ...prev, inspirationImage: url })), false)}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => inspirationImageInputRef.current?.click()}
                                            className={styles.uploadBtn}
                                            disabled={uploadingImages}
                                        >
                                            📁 {productForm.inspirationImage ? 'Change Image' : 'Upload'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const url = prompt('Enter inspiration image URL:');
                                                if (url) handleUrlUpload(url, (uploadedUrl) => setProductForm(prev => ({ ...prev, inspirationImage: uploadedUrl })));
                                            }}
                                            className={styles.uploadBtn}
                                            disabled={uploadingImages}
                                        >
                                            🔗 From URL
                                        </button>
                                    </div>
                                    {productForm.inspirationImage && (
                                        <div style={{ position: 'relative', display: 'inline-block', marginTop: '10px' }}>
                                            <img src={productForm.inspirationImage} alt="Inspiration" style={{ height: '100px', borderRadius: '4px' }} />
                                            <button
                                                type="button"
                                                onClick={() => setProductForm(prev => ({ ...prev, inspirationImage: '' }))}
                                                style={{ position: 'absolute', top: -5, right: -5, background: '#e53e3e', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    )}
                                    <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                                        Upload the customer&apos;s inspiration photo. It will be shown side-by-side with your creation on the website.
                                    </small>
                                </div>
                            )}

                            {/* Customization Notes - only show for custom */}
                            {productForm.businessType === 'custom' && (
                                <div className={styles.formGroup}>
                                    <label>Customization Notes</label>
                                    <textarea
                                        value={productForm.customizationNotes}
                                        onChange={e => setProductForm({ ...productForm, customizationNotes: e.target.value })}
                                        placeholder="Details about the customization process, turnaround time, materials used, etc."
                                        maxLength={1000}
                                    />
                                    <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                                        Shown on product page. Max 1000 characters.
                                    </small>
                                </div>
                            )}

                            {/* Tags */}
                            <div className={styles.formGroup}>
                                <label>Tags</label>
                                <input
                                    type="text"
                                    value={productForm.tags}
                                    onChange={e => setProductForm({ ...productForm, tags: e.target.value })}
                                    placeholder="bridal, velvet, 2026, luxury (comma-separated)"
                                />
                                <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                                    Comma-separated tags for filtering and display on product page.
                                </small>
                            </div>

                            {/* Order + Toggles */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', alignItems: 'end' }}>
                                <div className={styles.formGroup}>
                                    <label>Display Order</label>
                                    <input
                                        type="number"
                                        value={productForm.order}
                                        onChange={e => setProductForm({ ...productForm, order: parseInt(e.target.value) || 0 })}
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>In Stock</label>
                                    <button
                                        type="button"
                                        onClick={() => setProductForm(prev => ({ ...prev, inStock: !prev.inStock }))}
                                        className={productForm.inStock ? styles.toggleBtnGreen : styles.toggleBtnRed}
                                    >
                                        {productForm.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                                    </button>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Featured</label>
                                    <button
                                        type="button"
                                        onClick={() => setProductForm(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
                                        className={productForm.isFeatured ? styles.toggleBtnGold : styles.toggleBtnOff}
                                    >
                                        {productForm.isFeatured ? '★ Featured' : 'Not Featured'}
                                    </button>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Active</label>
                                    <button
                                        type="button"
                                        onClick={() => setProductForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                                        className={productForm.isActive ? styles.toggleBtnGreen : styles.toggleBtnGray}
                                    >
                                        {productForm.isActive ? '✓ Active' : 'Inactive'}
                                    </button>
                                </div>
                            </div>

                            {/* SEO Fields */}
                            <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '10px' }}>
                                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#999', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>SEO (Optional)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className={styles.formGroup}>
                                        <label>Meta Title</label>
                                        <input
                                            type="text"
                                            value={productForm.metaTitle}
                                            onChange={e => setProductForm({ ...productForm, metaTitle: e.target.value })}
                                            placeholder="SEO title (max 60 chars)"
                                            maxLength={60}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Meta Description</label>
                                        <input
                                            type="text"
                                            value={productForm.metaDescription}
                                            onChange={e => setProductForm({ ...productForm, metaDescription: e.target.value })}
                                            placeholder="SEO description (max 160 chars)"
                                            maxLength={160}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={loading || uploadingImages} className={styles.submitBtn}>
                                {loading ? 'Processing...' : uploadingImages ? uploadStatus : (editingProductId ? 'UPDATE PRODUCT' : 'CREATE PRODUCT')}
                            </button>
                        </form>

                        <h2>Existing Products</h2>
                        <div className={styles.filterTabs}>
                            <button
                                onClick={() => setProductFilter('active')}
                                className={productFilter === 'active' ? styles.filterTabActive : styles.filterTabInactive}
                            >
                                Active ({products.filter(p => !p.isArchived && p.inStock !== false).length})
                            </button>
                            <button
                                onClick={() => setProductFilter('out_of_stock')}
                                className={productFilter === 'out_of_stock' ? styles.filterTabOutOfStock : styles.filterTabInactive}
                            >
                                Out of Stock ({products.filter(p => !p.isArchived && p.inStock === false).length})
                            </button>
                            <button
                                onClick={() => setProductFilter('archived')}
                                className={productFilter === 'archived' ? styles.filterTabArchived : styles.filterTabInactive}
                            >
                                Archived ({products.filter(p => p.isArchived).length})
                            </button>
                        </div>
                        <div className={styles.productList}>
                            {products.filter(p => {
                                if (productFilter === 'archived') return p.isArchived;
                                if (productFilter === 'out_of_stock') return !p.isArchived && p.inStock === false;
                                return !p.isArchived && p.inStock !== false;
                            }).map(p => (
                                <div key={p._id} className={styles.productRow}>
                                    <img
                                        src={p.images && p.images[0] ? p.images[0] : '/placeholder.jpg'}
                                        alt={p.name}
                                        className={styles.productImage}
                                    />
                                    <div className={styles.productInfo}>
                                        <strong>
                                            {p.name}
                                            {p.isFeatured && <span className={styles.badgeFeatured}>Featured</span>}
                                            {p.isActive === false && <span className={styles.badgeInactive}>Inactive</span>}
                                            {p.inStock === false && <span className={styles.badgeOutOfStock}>Out of Stock</span>}
                                            {p.isArchived && <span className={styles.badgeArchived}>Archived</span>}
                                        </strong>
                                        <span className={styles.productMeta}>{p.collectionRef?.name || 'No Collection'}</span>
                                    </div>
                                    <div>
                                        <span className={styles.productType}>{p.businessType}</span>
                                    </div>
                                    <div className={styles.priceTag}>
                                        {p.price > 0 ? `Rs. ${p.price.toLocaleString()}` : '-'}
                                    </div>
                                    <div className={styles.actionButtons}>
                                        <button onClick={() => handleEditProduct(p)} className={styles.editBtn}>Edit</button>
                                        {p.isArchived ? (
                                            <button
                                                onClick={() => handleUnarchiveProduct(p._id)}
                                                style={{ padding: '4px 12px', background: '#48bb78', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                            >
                                                Restore
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleArchiveProduct(p._id)}
                                                style={{ padding: '4px 12px', background: '#718096', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                            >
                                                Archive
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteProduct(p._id)} className={styles.deleteBtn}>Delete</button>
                                    </div>
                                </div>
                            ))}
                            {products.filter(p => {
                                if (productFilter === 'archived') return p.isArchived;
                                if (productFilter === 'out_of_stock') return !p.isArchived && p.inStock === false;
                                return !p.isArchived && p.inStock !== false;
                            }).length === 0 && <p style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>{productFilter === 'archived' ? 'No archived products.' : productFilter === 'out_of_stock' ? 'No out-of-stock products.' : 'No products found. Create your first product above.'}</p>}
                        </div>
                    </div>
                )}
            </div>

            {/* CONFIRMATION MODAL */}
            {confirmModal.open && (
                <div className={styles.modalOverlay} onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}>
                    <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
                        <h3>{confirmModal.title}</h3>
                        <p>{confirmModal.message}</p>
                        <div className={styles.modalActions}>
                            <button
                                className={styles.modalCancelBtn}
                                onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                            >
                                Cancel
                            </button>
                            <button
                                className={`${styles.modalConfirmBtn} ${confirmModal.type === 'archive' ? styles.modalConfirmArchive : ''}`}
                                onClick={confirmModal.onConfirm}
                            >
                                {confirmModal.type === 'archive' ? 'Archive' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Script
                src="https://upload-widget.cloudinary.com/global/all.js"
                strategy="lazyOnload"
            />
        </>
    );
}
