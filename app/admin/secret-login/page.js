'use client'
import { useState, useEffect } from 'react';
import {
    createNewCollectionAction, // NEW NAME
    getAllCollections,
    getCollectionTree,
    deleteCollection,
    createProduct,
    getAllProducts
} from '@/app/actions';
import styles from './admin.module.css';

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

    // Products state
    const [products, setProducts] = useState([]);

    // Collection form
    const [collectionForm, setCollectionForm] = useState({
        name: '',
        description: '',
        coverImage: '',
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
        availableSizes: []
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
                getCollectionTreeAction(),
                getAllProducts()
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
            formData.append('coverImage', collectionForm.coverImage);

            if (collectionForm.parentCollection) {
                formData.append('parentCollection', collectionForm.parentCollection);
            }

            // CALL NEW ACTION NAME
            const result = await createCollectionAction(formData);

            if (result.success) {
                setSuccessMessage('Collection created successfully!');
                resetCollectionForm();
                await loadAllData();
            } else {
                setError(result.error || 'Failed to create collection');
            }
        } catch (err) {
            console.error('Collection submission catch:', err);
            setError(err.message || 'An error occurred while creating the collection');
            // If error message mentions a stack trace, show part of it
            if (err.message && err.message.length > 100) {
                setError('Server Error (Check Console/Logs)');
            }
        } finally {
            setLoading(false);
        }
    };

    const resetCollectionForm = () => {
        setCollectionForm({
            name: '',
            description: '',
            coverImage: '',
            parentCollection: ''
        });
    };

    const handleDeleteCollection = async (id) => {
        if (!confirm('Are you sure you want to delete this collection?')) return;

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
    };

    // ============ PRODUCT HANDLERS ============
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

            const result = await createProduct(formData);

            if (result.success) {
                setSuccessMessage('Product created successfully!');
                resetProductForm();
                await loadAllData();
            } else {
                setError(result.error || 'Failed to create product');
            }
        } catch (err) {
            console.error('Product submission error:', err);
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const resetProductForm = () => {
        setProductForm({
            name: '',
            description: '',
            price: '',
            images: [],
            collection: '',
            businessType: 'retail',
            inspirationImage: '',
            availableSizes: []
        });
    };

    // ============ CLOUDINARY ============
    const openCloudinaryWidget = (onSuccess, multiple = true) => {
        if (typeof window === 'undefined' || !window.cloudinary) {
            setError('Cloudinary widget not loaded. Refresh page.');
            return;
        }
        const widget = window.cloudinary.createUploadWidget(
            {
                cloudName: 'dk9pid4ec',
                uploadPreset: 'my_unsigned_preset',
                sources: ['local', 'url', 'camera'],
                multiple: multiple,
                folder: 'digital-atelier'
            },
            (error, result) => {
                if (!error && result && result.event === 'success') {
                    onSuccess(result.info.secure_url);
                }
            }
        );
        widget.open();
    };

    // ============ HELPER: RECURSIVE TREE RENDER ============
    const renderCollectionTree = (tree, level = 0) => {
        return tree.map(col => (
            <div key={col._id} style={{ paddingLeft: `${level * 20}px`, marginBottom: '10px' }}>
                <div className={styles.collectionItem}>
                    <strong>{col.name}</strong>
                    <button
                        onClick={() => handleDeleteCollection(col._id)}
                        className={styles.deleteBtn}
                    >
                        Delete
                    </button>
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

    // ============ DASHBOARD UI ============
    return (
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
                    <button onClick={() => setError('')}>×</button>
                </div>
            )}
            {successMessage && (
                <div className={styles.successMessage}>
                    {successMessage}
                    <button onClick={() => setSuccessMessage('')}>×</button>
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
                    <h2>Create New Collection</h2>
                    <form onSubmit={handleCollectionSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Collection Name *</label>
                            <input
                                type="text"
                                value={collectionForm.name}
                                onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })}
                                placeholder="e.g. Bridal"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea
                                value={collectionForm.description}
                                onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Parent Collection</label>
                            <select
                                value={collectionForm.parentCollection}
                                onChange={(e) => setCollectionForm({ ...collectionForm, parentCollection: e.target.value })}
                            >
                                <option value="">-- Top Level --</option>
                                {collections.map(col => (
                                    <option key={col._id} value={col._id}>{col.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Cover Image</label>
                            <button
                                type="button"
                                onClick={() => openCloudinaryWidget((url) => setCollectionForm({ ...collectionForm, coverImage: url }), false)}
                                className={styles.uploadBtn}
                            >
                                {collectionForm.coverImage ? 'Change Image' : 'Upload Image'}
                            </button>
                            {collectionForm.coverImage && <img src={collectionForm.coverImage} alt="Preview" style={{ height: '50px', marginTop: '10px' }} />}
                        </div>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? 'Creating...' : 'CREATE COLLECTION'}
                        </button>
                    </form>

                    <h2>Existing Collections</h2>
                    <div className={styles.collectionTree}>
                        {collectionTree.length ? renderCollectionTree(collectionTree) : <p>No collections found.</p>}
                    </div>
                </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
                <div className={styles.tabContent}>
                    <h2>Create New Product</h2>
                    <form onSubmit={handleProductSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Name *</label>
                            <input
                                type="text"
                                value={productForm.name}
                                onChange={e => setProductForm({ ...productForm, name: e.target.value })}
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
                                {collections.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
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
                            <label>Images *</label>
                            <button
                                type="button"
                                onClick={() => openCloudinaryWidget((url) => setProductForm(prev => ({ ...prev, images: [...prev.images, url] })), true)}
                                className={styles.uploadBtn}
                            >
                                Upload Images
                            </button>
                            <div className={styles.imageGallery}>
                                {productForm.images.map((img, i) => (
                                    <img key={i} src={img} alt="Product" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                                ))}
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? 'Creating...' : 'CREATE PRODUCT'}
                        </button>
                    </form>

                    <h2>Products</h2>
                    <div className={styles.productGrid}>
                        {products.map(p => (
                            <div key={p._id} className={styles.productCard}>
                                <strong>{p.name}</strong>
                                <p>{p.businessType}</p>
                                <button onClick={() => {/* Delete stub */ }} className={styles.deleteBtn}>Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
