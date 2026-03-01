# Configuration Guide

This guide explains how to configure the critical services for **The Digital Atelier** website: Database (MongoDB), Image Hosting (Cloudinary), and Contact (WhatsApp).

## 1. MongoDB (Database)

The project uses MongoDB to store all product and collection data.

### Configuration File
- The connection string is stored in `.env.local` in the root directory.
- **Key**: `MONGODB_URI`

### Setup Steps
1.  Create a MongoDB Atlas account (free tier is sufficient).
2.  Create a Cluster and a Database user.
3.  Get the Connection String (SRV format).
4.  Update `.env.local`:
    ```env
    MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
    ```
    *Replace `<username>`, `<password>`, `<cluster>`, and `<dbname>` with your actual values.*

---

## 2. Cloudinary (Image Hosting)

Cloudinary is used for uploading and hosting product images.

### Widget Configuration
The Cloudinary Upload Widget is configured directly in the Admin Dashboard code.

- **File Path**: `app/admin/secret-login/page.js`
- **Search for**: `openCloudinaryWidget` function (approx. line 290).

### Key Settings to Change
If you change your Cloudinary account, update these values in `page.js`:
```javascript
cloudName: 'your_cloud_name_here',      // e.g., 'dk9pid4ec'
uploadPreset: 'your_unsigned_preset',   // e.g., 'my_unsigned_preset'
folder: 'digital-atelier'               // Optional: specific folder for uploads
```

### Script Inclusion
The Cloudinary Widget script is loaded globally in the main layout file.
- **File Path**: `app/layout.js`
- **Script Tag**: `<script src="https://widget.cloudinary.com/v2.0/global/all.js" ... />`
- *No changes usually needed here unless Cloudinary updates their widget URL.*

---

## 3. WhatsApp (Contact & Enquiries)

The specific WhatsApp number `923211234567` is currently used in multiple places for different functionalities (General Inquiries, Custom Quotes, Product Availability).

### Locations to Update
To change the phone number, you must find and replace it in the following files:

1.  **Homepage CTA Button** (Hero Section)
    *   **File**: `components/HeroCTA.js`
    *   **Line**: ~5 (`href="https://wa.me/923211234567..."`)

2.  **Product Cards** (Retail availability & Custom quotes)
    *   **File**: `components/ProductCard.js`
    *   **Line**: ~86 (`const phoneNumber = '923211234567';`)

3.  **Homepage Footer / Custom Quote Section**
    *   **File**: `app/page.js`
    *   **Line**: ~83 (`href="https://wa.me/923211234567..."`)

4.  **Product Detail Pages** (Similar to Product Card)
    *   **File**: `app/product/[id]/page.js` (Check for `wa.me` links or `handleWhatsApp` function)

### Tip
Use your code editor's "Find and Replace in Files" feature (`Ctrl+Shift+F`) to replace `923211234567` with your new number globally.

---

## Summary Checklist for New Owners

- [ ] **DB**: Verify `.env.local` has the correct `MONGODB_URI`.
- [ ] **Images**: Update `cloudName` and `uploadPreset` in `app/admin/secret-login/page.js`.
- [ ] **Phone**: Global search & replace `923211234567` with the business WhatsApp number.
