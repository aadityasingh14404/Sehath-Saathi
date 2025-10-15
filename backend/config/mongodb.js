import mongoose from "mongoose";
import dotenv from 'dotenv';

// Ensure environment variables are available when this module loads
// Try backend/.env
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });
// Also try project-root/.env as fallback (useful if the file was placed one level up)
dotenv.config();

const connectDB = async () => {

    const fallbackLocalUri = 'mongodb://127.0.0.1:27017/sehath-saathi';
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || fallbackLocalUri;

    if (!uri) {
        console.error('Missing MongoDB URI. Set MONGODB_URI in backend/.env');
        return; // Do not crash the server
    }

    // Log target without leaking credentials
    try {
        const masked = uri.replace(/:\/\/.*?@/, '://<credentials>@');
        console.log(`Connecting to MongoDB at: ${masked}`);
    } catch {}

    mongoose.connection.on('connected', () => console.log("Database Connected"))
    mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err.message))
    mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'))

    const attemptConnect = async () => {
        try {
            await mongoose.connect(uri);
        } catch (err) {
            console.error('Failed to connect to MongoDB:', err.message);
            // Retry after delay without crashing the app
            setTimeout(attemptConnect, 5000);
        }
    }

    attemptConnect();

}

export default connectDB;

// Do not use '@' symbol in your databse user's password else it will show an error.