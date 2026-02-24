import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request) {
    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
        return NextResponse.json({ success: false, message: "No file uploaded" });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
        await mkdir(uploadDir, { recursive: true });
    } catch (e) {
        // ignore if exists
    }

    // Compress and resize with sharp
    let processedBuffer;
    let outputFilename;
    try {
        processedBuffer = await sharp(buffer)
            .resize(1200, 1680, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer();
        outputFilename = `${Date.now()}-${file.name.replace(/\s/g, '-').replace(/\.[^.]+$/, '')}.jpg`;
    } catch (e) {
        // If sharp fails (non-image file), fall back to raw buffer
        processedBuffer = buffer;
        outputFilename = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
    }

    const filepath = join(uploadDir, outputFilename);
    await writeFile(filepath, processedBuffer);

    // Return the public URL
    return NextResponse.json({
        success: true,
        url: `/uploads/${outputFilename}`
    });
}
