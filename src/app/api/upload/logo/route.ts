import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

/**
 * Cloudinary signed upload signature.
 * Rules: sort ALL params (except file, api_key, resource_type) alphabetically,
 * join as key=value&key=value, then append the API secret, SHA-256 hash.
 */
function generateSignature(params: Record<string, string>): string {
    const str = Object.keys(params)
        .sort()
        .map(k => `${k}=${params[k]}`)
        .join('&') + API_SECRET;
    return crypto.createHash('sha256').update(str).digest('hex');
}

export async function POST(req: NextRequest) {
    const { user, error } = requireAuth(req.headers);
    if (error) return NextResponse.json(error, { status: 401 });

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
        return NextResponse.json({ success: false, message: 'Cloudinary credentials not configured' }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
        if (!file.type.startsWith('image/')) return NextResponse.json({ success: false, message: 'File must be an image' }, { status: 400 });
        if (file.size > 10 * 1024 * 1024) return NextResponse.json({ success: false, message: 'Image must be under 10MB' }, { status: 400 });

        const timestamp = String(Math.floor(Date.now() / 1000));
        const folder = 'bytesflare/logos';
        const publicId = `logo_${user!.id}`;

        // ⚠️ sigParams must contain EXACTLY the same params sent in the form
        // (excluding file, api_key, resource_type). Order doesn't matter — we sort.
        const sigParams: Record<string, string> = {
            folder,
            overwrite: 'true',
            public_id: publicId,
            timestamp,
        };

        const signature = generateSignature(sigParams);

        const uploadForm = new FormData();
        uploadForm.append('file', file);
        uploadForm.append('api_key', API_KEY);
        uploadForm.append('timestamp', timestamp);
        uploadForm.append('signature', signature);
        uploadForm.append('folder', folder);
        uploadForm.append('public_id', publicId);
        uploadForm.append('overwrite', 'true');

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: uploadForm,
        });
        const data = await res.json();

        if (data.error) {
            console.error('Cloudinary error:', data.error.message);
            return NextResponse.json({ success: false, message: data.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, url: data.secure_url, publicId: data.public_id });
    } catch (err) {
        console.error('Logo upload error:', err);
        return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
    }
}
