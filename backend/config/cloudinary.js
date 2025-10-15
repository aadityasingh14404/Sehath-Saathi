import { v2 as cloudinary } from 'cloudinary';

const connectCloudinary = async () => {

    // Support common env var aliases to avoid misnaming issues
    const cloudName = process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY;
    const apiSecret = process.env.CLOUDINARY_SECRET_KEY || process.env.CLOUDINARY_API_SECRET;

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
    });

}

export default connectCloudinary;