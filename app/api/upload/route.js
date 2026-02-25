import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

// Target aspect ratio: 4:5 (width:height)
const ASPECT_W = 4;
const ASPECT_H = 5;

// Output sizes
const SIZES = {
    thumbnail: 200,  // width in px
    medium: 800,
    full: 1200,
};

/**
 * Smart center crop to enforce 4:5 aspect ratio, then resize.
 * Returns a buffer of the processed image.
 */
async function processImage(buffer, targetWidth) {
    const metadata = await sharp(buffer).metadata();
    const { width: origW, height: origH } = metadata;

    // Calculate the crop dimensions that maintain 4:5 ratio
    const targetRatio = ASPECT_W / ASPECT_H;
    const origRatio = origW / origH;

    let cropW, cropH, cropLeft, cropTop;

    if (origRatio > targetRatio) {
        // Image is wider than 4:5 → crop sides
        cropH = origH;
        cropW = Math.round(origH * targetRatio);
        cropLeft = Math.round((origW - cropW) / 2);
        cropTop = 0;
    } else if (origRatio < targetRatio) {
        // Image is taller than 4:5 → crop top/bottom
        cropW = origW;
        cropH = Math.round(origW / targetRatio);
        cropLeft = 0;
        cropTop = Math.round((origH - cropH) / 2);
    } else {
        // Already 4:5
        cropW = origW;
        cropH = origH;
        cropLeft = 0;
        cropTop = 0;
    }

    const targetHeight = Math.round(targetWidth * (ASPECT_H / ASPECT_W));

    return sharp(buffer)
        .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
        .resize(targetWidth, targetHeight, { fit: 'fill', withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
}

export async function POST(request) {
    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
        return NextResponse.json({ success: false, message: "No file uploaded" });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure upload directories exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const thumbDir = join(uploadDir, 'thumbnails');
    const mediumDir = join(uploadDir, 'medium');

    try {
        await mkdir(uploadDir, { recursive: true });
        await mkdir(thumbDir, { recursive: true });
        await mkdir(mediumDir, { recursive: true });
    } catch (e) {
        // ignore if exists
    }

    const baseName = `${Date.now()}-${file.name.replace(/\s/g, '-').replace(/\.[^.]+$/, '')}`;
    const outputFilename = `${baseName}.jpg`;

    try {
        // Process all three sizes in parallel
        const [fullBuffer, mediumBuffer, thumbBuffer] = await Promise.all([
            processImage(buffer, SIZES.full),
            processImage(buffer, SIZES.medium),
            processImage(buffer, SIZES.thumbnail),
        ]);

        // Write all files in parallel
        await Promise.all([
            writeFile(join(uploadDir, outputFilename), fullBuffer),
            writeFile(join(mediumDir, outputFilename), mediumBuffer),
            writeFile(join(thumbDir, outputFilename), thumbBuffer),
        ]);

        return NextResponse.json({
            success: true,
            url: `/uploads/${outputFilename}`,
            thumbnail: `/uploads/thumbnails/${outputFilename}`,
            medium: `/uploads/medium/${outputFilename}`,
        });
    } catch (e) {
        // If sharp fails (non-image file), fall back to raw buffer
        const fallbackName = `${baseName}-${file.name.split('.').pop()}`;
        await writeFile(join(uploadDir, fallbackName), buffer);
        return NextResponse.json({
            success: true,
            url: `/uploads/${fallbackName}`,
        });
    }
}
