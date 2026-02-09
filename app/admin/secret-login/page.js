'use client';

import { useState, useEffect } from 'react';
import {
    getProductsAction, createProductAction, deleteProductAction,
    getCollectionsAction, createCollectionAction, deleteCollectionAction,
    addProductToCollectionAction, removeProductFromCollectionAction
} from '@/app/actions';
import styles from './admin.module.css';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState('products'); // 'products' | 'collections'

    // --- PRODUCT STATE ---
    const [products, setProducts] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [existingCategories, setExistingCategories] = useState([
        'Shirts', 'Pants', 'Outerwear', 'Accessories', 'Shoes', 'Luxury', 'New Arrivals'
    ]);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- COLLECTION STATE ---
    const [collections, setCollections] = useState([]);
    const [colTitle, setColTitle] = useState('');
    const [colDesc, setColDesc] = useState('');
    const [colImage, setColImage] = useState('');
    const [managingCollection, setManagingCollection] = useState(null); // The collection currently being edited

    useEffect(() => {
        if (isAuthenticated) {
            refreshData();
        }
    }, [isAuthenticated]);

    const refreshData = async () => {
        await Promise.all([refreshProducts(), refreshCollections()]);
    };

    const refreshProducts = async () => {
        const data = await getProductsAction();
        setProducts(data);
        const dbCats = [...new Set(data.map(p => p.category))];
        setExistingCategories(prev => [...new Set([...prev, ...dbCats])]);
    };

    const refreshCollections = async () => {
        const data = await getCollectionsAction();
        setCollections(data);
        // If we are managing a collection, update its state too
        if (managingCollection) {
            const updated = data.find(c => c._id === managingCollection._id);
            if (updated) setManagingCollection(updated);
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === '1234') setIsAuthenticated(true);
        else alert('Access Denied');
    };

    // --- CLOUDINARY WIDGET ---
    const openCloudinaryWidget = (onSuccess) => {
        if (typeof window === 'undefined' || !window.cloudinary) {
            alert("Cloudinary script is loading... please wait a moment and try again.");
            return;
        }
        const widget = window.cloudinary.createUploadWidget(
            {
                cloudName: 'dk9pid4ec',
                uploadPreset: 'my_unsigned_preset',
                sources: ['local', 'camera'],
                multiple: false,
                styles: {
                    palette: { window: "#FFFFFF", sourceBg: "#E4EBF1", windowBorder: "#90A0B3", tabIcon: "#0078FF", inactiveTabIcon: "#0E2F5A", menuIcons: "#5A616A", link: "#0078FF", action: "#FF620C", inProgress: "#0078FF", complete: "#20B832", error: "#F44235", textDark: "#000000", textLight: "#FFFFFF" }
                }
            },
            (error, result) => {
                if (!error && result && result.event === "success") {
                    onSuccess(result.info.secure_url);
                }
            }
        );
        widget.open();
    };

    // --- PRODUCT LOGIC ---
    const handleProductImageUpload = () => {
        openCloudinaryWidget((url) => setUploadedImages(prev => [...prev, url]));
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        if (uploadedImages.length === 0 || !description || !category) {
            alert("Please fill in all required fields and add at least one image.");
            return;
        }
        setIsSubmitting(true);
        const p = {
            title, description, price: parseFloat(price), category,
            sizes: ['M', 'L'],
            images: uploadedImages.map(url => ({ thumbnail: url, fullRes: url }))
        };

        try {
            const res = await createProductAction(p);
            if (!res.success) throw new Error(res.error);
            await refreshProducts();
            setTitle(''); setDescription(''); setPrice(''); setCategory(''); setUploadedImages([]);
            alert("Product Saved!");
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (confirm("Delete this product?")) {
            await deleteProductAction(id);
            refreshProducts();
        }
    };

    // --- COLLECTION LOGIC ---
    const handleCollectionImageUpload = () => {
        openCloudinaryWidget((url) => setColImage(url));
    };

    const handleCreateCollection = async () => {
        if (!colTitle || !colDesc || !colImage) {
            alert("Please fill all collection fields.");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await createCollectionAction({ title: colTitle, description: colDesc, image: colImage });
            if (!res.success) throw new Error(res.error);
            await refreshCollections();
            setColTitle(''); setColDesc(''); setColImage('');
            alert("Collection Created!");
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCollection = async (id) => {
        if (confirm("Delete this collection?")) {
            await deleteCollectionAction(id);
            if (managingCollection?._id === id) setManagingCollection(null);
            refreshCollections();
        }
    };

    const handleAddToCollection = async (productId) => {
        if (!managingCollection) return;
        const res = await addProductToCollectionAction(managingCollection._id, productId);
        if (res.success) refreshCollections();
    };

    const handleRemoveFromCollection = async (productId) => {
        if (!managingCollection) return;
        const res = await removeProductFromCollectionAction(managingCollection._id, productId);
        if (res.success) refreshCollections();
    };

    // --- RENDER HELPERS ---
    if (!isAuthenticated) return (
        <div className={styles.loginWrapper}>
            <div className={styles.loginCard}>
                <div className={styles.brandLogo}>LUXE.</div>
                <h2 className={styles.loginTitle}>Concierge Login</h2>
                <form onSubmit={handleLogin}>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={styles.loginInput} placeholder="PIN" />
                    <button className={styles.loginBtn}>Unlock</button>
                </form>
            </div>
        </div>
    );

    return (
        <div className={styles.dashboard}>
            <nav className={styles.nav}>
                <span className={styles.navBrand}>LUXE. Admin</span>
                <div className={styles.navTabs}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'products' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        Products
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'collections' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('collections')}
                    >
                        Collections
                    </button>
                </div>
                <button onClick={() => setIsAuthenticated(false)} className={styles.logoutBtn}>Lock</button>
            </nav>

            <div className={styles.content}>
                {activeTab === 'products' ? (
                    <>
                        <section className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>New Product</h3>
                            <div className={styles.fieldGroup}>
                                <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className={styles.input} />
                                <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className={styles.input} rows={2} />
                                <div className={styles.row}>
                                    <input placeholder="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} className={styles.input} />
                                    <input list="cats" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} className={styles.input} />
                                    <datalist id="cats">{existingCategories.map(c => <option key={c} value={c} />)}</datalist>
                                </div>
                                <div className={styles.toggleRow}>
                                    <button className={styles.modeBtn} onClick={handleProductImageUpload}>+ Add Image</button>
                                    <button className={styles.modeBtn} onClick={() => {
                                        const url = prompt("Image URL");
                                        if (url) setUploadedImages(prev => [...prev, url]);
                                    }}>Link URL</button>
                                </div>
                                <div className={styles.previewGrid}>
                                    {uploadedImages.map((url, i) => (
                                        <div key={i} className={styles.previewCard}>
                                            <img src={url} alt="p" />
                                            <button onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))} className={styles.removeX}>×</button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleCreateProduct} disabled={isSubmitting} className={styles.submitBtn}>{isSubmitting ? '...' : 'Save Product'}</button>
                            </div>
                        </section>
                        <section className={styles.listSection}>
                            <h3>Inventory ({products.length})</h3>
                            <div className={styles.inventoryList}>
                                {products.map(p => (
                                    <div key={p._id} className={styles.inventoryItem}>
                                        <img src={p.images[0]?.thumbnail} className={styles.listThumb} />
                                        <div className={styles.itemMeta}>
                                            <strong>{p.title}</strong>
                                            <span>${p.price}</span>
                                        </div>
                                        <button className={styles.deleteBtn} onClick={() => handleDeleteProduct(p._id)}>Delete</button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                ) : (
                    <>
                        {/* COLLECTIONS TAB */}
                        {!managingCollection ? (
                            <>
                                <section className={styles.formSection}>
                                    <h3 className={styles.sectionTitle}>New Collection</h3>
                                    <div className={styles.fieldGroup}>
                                        <input placeholder="Collection Title" value={colTitle} onChange={e => setColTitle(e.target.value)} className={styles.input} />
                                        <textarea placeholder="Description" value={colDesc} onChange={e => setColDesc(e.target.value)} className={styles.input} rows={2} />
                                        <div className={styles.row} style={{ alignItems: 'center', gap: '1rem' }}>
                                            <button className={styles.modeBtn} onClick={handleCollectionImageUpload}>
                                                {colImage ? 'Change Cover' : 'Upload Cover Image'}
                                            </button>
                                            {colImage && <img src={colImage} alt="cover" style={{ height: 40, borderRadius: 4 }} />}
                                        </div>
                                        <button onClick={handleCreateCollection} disabled={isSubmitting} className={styles.submitBtn}>{isSubmitting ? '...' : 'Create Collection'}</button>
                                    </div>
                                </section>
                                <section className={styles.listSection}>
                                    <h3>Collections ({collections.length})</h3>
                                    <div className={styles.inventoryList}>
                                        {collections.map(c => (
                                            <div key={c._id} className={styles.inventoryItem}>
                                                <img src={c.image} className={styles.listThumb} />
                                                <div className={styles.itemMeta}>
                                                    <strong>{c.title}</strong>
                                                    <span style={{ fontSize: '0.8rem' }}>{c.products?.length || 0} items</span>
                                                </div>
                                                <button className={styles.modeBtn} onClick={() => setManagingCollection(c)} style={{ marginRight: '0.5rem' }}>Manage</button>
                                                <button className={styles.deleteBtn} onClick={() => handleDeleteCollection(c._id)}>Delete</button>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </>
                        ) : (
                            // MANAGE VIEW
                            <div className={styles.manageView}>
                                <div className={styles.manageHeader}>
                                    <button onClick={() => setManagingCollection(null)} className={styles.backBtn}>← Back</button>
                                    <h2>Manage: {managingCollection.title}</h2>
                                </div>
                                <div className={styles.dualGrid}>
                                    <div className={styles.column}>
                                        <h4>Available Products</h4>
                                        <div className={styles.scrollList}>
                                            {products.filter(p => !managingCollection.products?.some(cp => cp._id === p._id)).map(p => (
                                                <div key={p._id} className={styles.miniItem} onClick={() => handleAddToCollection(p._id)}>
                                                    <img src={p.images[0]?.thumbnail} />
                                                    <span>{p.title}</span>
                                                    <span className={styles.addIcon}>+</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={styles.column}>
                                        <h4>In Collection</h4>
                                        <div className={styles.scrollList}>
                                            {managingCollection.products?.map(p => (
                                                <div key={p?._id || Math.random()} className={styles.miniItem} onClick={() => handleRemoveFromCollection(p._id)}>
                                                    <img src={p?.images?.[0]?.thumbnail} />
                                                    <span>{p?.title}</span>
                                                    <span className={styles.removeIcon}>-</span>
                                                </div>
                                            ))}
                                            {(!managingCollection.products || managingCollection.products.length === 0) && <p>No items yet.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
