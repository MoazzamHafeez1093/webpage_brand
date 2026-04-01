import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * GET /api/upload-video
 * Returns a signed Cloudinary upload signature so the browser can upload
 * a video DIRECTLY to Cloudinary (bypassing Vercel's 4.5MB body limit).
 */
export async function GET() {
    try {
        const timestamp = Math.round(Date.now() / 1000);
        const params = {
            timestamp,
            folder: 'house-of-aslam/videos',
        };

        const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

        return NextResponse.json({
            success: true,
            timestamp,
            signature,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            folder: params.folder,
        });
    } catch (err) {
        console.error('[upload-video signature] Error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
