'use client';

import { useState, useEffect } from 'react';
import { getProductsAction, createProductAction, deleteProductAction } from '@/app/actions';
import styles from './admin.module.css';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [products, setProducts] = useState([]);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');

    // Custom Category Logic
    const [category, setCategory] = useState('');
    const [existingCategories, setExistingCategories] = useState([
        'Shirts', 'Pants', 'Outerwear', 'Accessories', 'Shoes', 'Luxury', 'New Arrivals'
    ]);

    // Images
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            refreshProducts();
        }
    }, [isAuthenticated]);

    const refreshProducts = async () => {
        const data = await getProductsAction();
        setProducts(data);
        const dbCats = [...new Set(data.map(p => p.category))];
        setExistingCategories(prev => [...new Set([...prev, ...dbCats])]);
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === '1234') setIsAuthenticated(true);
        else alert('Access Denied');
    };

    // --- UPLOAD LOGIC ---
    const handleUrlAdd = () => {
        const url = prompt("Enter Image URL:");
        if (url) {
            setUploadedImages(prev => [...prev, url]);
        }
    };

    // "Upload from Device" -> Triggers Cloudinary Widget
    const handleDeviceUpload = () => {
        if (typeof window === 'undefined' || !window.cloudinary) {
            alert("Cloudinary script is loading... please wait a moment and try again.");
            return;
        }

        const widget = window.cloudinary.createUploadWidget(
            {
                cloudName: 'dk9pid4ec',
                uploadPreset: 'my_unsigned_preset',
                sources: ['local', 'camera'], // Limit to device sources
                showAdvancedOptions: false,
                cropping: false,
                multiple: true,
                defaultSource: "local",
                styles: {
                    palette: {
                        window: "#FFFFFF",
                        windowBorder: "#90A0B3",
                        tabIcon: "#0078FF",
                        menuIcons: "#5A616A",
                        textDark: "#000000",
                        textLight: "#FFFFFF",
                        link: "#0078FF",
                        action: "#FF620C",
                        inactiveTabIcon: "#0E2F5A",
                        error: "#F44235",
                        inProgress: "#0078FF",
                        complete: "#20B832",
                        sourceBg: "#E4EBF1"
                    },
                }
            },
            (error, result) => {
                if (!error && result && result.event === "success") {
                    setUploadedImages(prev => [...prev, result.info.secure_url]);
                }
            }
        );
        widget.open();
    };

    const removeImage = (index) => {
        setUploadedImages(uploadedImages.filter((_, i) => i !== index));
    };

    // --- DELETE LOGIC ---
    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this item?")) {
            await deleteProductAction(id);
            refreshProducts();
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (uploadedImages.length === 0) {
            alert("Please add at least one image.");
            return;
        }
        if (!description) {
            alert("Please enter a description.");
            return;
        }
        if (!category) {
            alert("Please enter a category.");
            return;
        }

        setIsSubmitting(true);

        const formattedImages = uploadedImages.map(url => ({
            thumbnail: url,
            fullRes: url
        }));

        const p = {
            title,
            description,
            price: parseFloat(price),
            category,
            sizes: ['M', 'L'],
            images: formattedImages
        };

        try {
            await createProductAction(p);
            await refreshProducts();

            // Reset Form and Success
            setTitle('');
            setDescription('');
            setPrice('');
            setCategory('');
            setUploadedImages([]);
            alert("Saved Successfully to MongoDB!");
        } catch (err) {
            console.error(err);
            alert("SAVE FAILED: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                <button onClick={() => setIsAuthenticated(false)} className={styles.logoutBtn}>Lock</button>
            </nav>

            <div className={styles.content}>
                <section className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>New Catalog Entry</h3>

                    <div className={styles.fieldGroup}>
                        <label>Product Details</label>
                        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className={styles.input} />

                        <textarea
                            placeholder="Description (Required)"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className={styles.input}
                            rows={3}
                        />

                        <div className={styles.row}>
                            <input placeholder="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} className={styles.input} />

                            <div style={{ flex: 1 }}>
                                <input
                                    list="categoryOptions"
                                    placeholder="Category (Type new or select)"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className={styles.input}
                                />
                                <datalist id="categoryOptions">
                                    {existingCategories.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label>Image Gallery</label>

                        {/* Two Simple Options */}
                        <div className={styles.toggleRow}>
                            <button className={styles.modeBtnActive} onClick={handleDeviceUpload}>
                                📤 Upload from Device
                            </button>
                            <button className={styles.modeBtn} onClick={handleUrlAdd}>
                                🔗 Enter URL
                            </button>
                        </div>

                        <div className={styles.previewGrid}>
                            {uploadedImages.map((url, i) => (
                                <div key={i} className={styles.previewCard}>
                                    <img src={url} alt="upload" />
                                    <button onClick={() => removeImage(i)} className={styles.removeX}>×</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleCreate} disabled={isSubmitting} className={styles.submitBtn}>
                        {isSubmitting ? 'Saving...' : 'Publish Item'}
                    </button>
                </section>

                <section className={styles.listSection}>
                    <h3>Recent Items</h3>
                    <div className={styles.inventoryList}>
                        {products.map(p => (
                            <div key={p._id} className={styles.inventoryItem}>
                                <img src={p.images[0]?.thumbnail} className={styles.listThumb} />
                                <div className={styles.itemMeta}>
                                    <strong>{p.title}</strong>
                                    <span style={{ fontSize: '0.8rem', color: '#b08d55' }}>{p.category}</span>
                                    <span>${p.price}</span>
                                </div>
                                <button className={styles.deleteBtn} onClick={() => handleDelete(p._id)}>Delete</button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
