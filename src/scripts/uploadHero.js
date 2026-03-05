import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const imagePath = path.join(process.cwd(), 'src/public/images/ako-zarobit-peniaze.png');

try {
    const result = await cloudinary.uploader.upload(imagePath, {
        public_id: 'talent-by-design-hero',
        folder: 'talent-by-design'
    });
    console.log('UPLOAD_SUCCESS');
    console.log('URL:' + result.secure_url);
} catch (error) {
    console.error('UPLOAD_ERROR:', error);
}
