import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="40" viewBox="0 0 260 40"><text x="0" y="30" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#1E3A8A">Talent By Design</text></svg>`;

try {
    const result = await cloudinary.uploader.upload(`data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`, {
        public_id: 'talent-by-design-logo',
        folder: 'talent-by-design',
        format: 'png' // Convert SVG to PNG for better compatibility
    });
    console.log('UPLOAD_SUCCESS');
    console.log('URL:' + result.secure_url);
} catch (error) {
    console.error('UPLOAD_ERROR:', error);
}
