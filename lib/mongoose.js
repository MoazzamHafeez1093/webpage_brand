// MongoDB Atlas connection — AslamCluster
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    // We don't error here because we want to fallback to mock data if not set.
    // console.warn('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (!MONGODB_URI) {
        console.log("❌ MONGODB_URI not defined in environment.");
        return null;
    }

    if (cached.conn) {
        // console.log("⚡ Using cached DB connection");
        return cached.conn;
    }

    // Fast-path: if Mongoose is already connected (e.g. warm Vercel instance),
    // store and return immediately without opening a new connection.
    if (mongoose.connection.readyState === 1) {
        cached.conn = mongoose.connection;
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            // Pool size of 5 allows parallel queries within one Vercel function
            // (e.g. getCategoryTree + getCollectionsWithProducts at the same time).
            // 5 connections × ~20 concurrent Vercel instances = ~100 max, well under Atlas 500 limit.
            maxPoolSize: 5,
            minPoolSize: 0,           // Still don't keep idle sockets when no traffic
            maxIdleTimeMS: 60000,     // Keep connections alive for 60s to avoid cold-reconnect overhead
            serverSelectionTimeoutMS: 10000,  // Give Atlas more time to respond on cold start
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            heartbeatFrequencyMS: 30000,      // Keepalive ping every 30s to prevent idle drops
        };

        console.log("⏳ Connecting to MongoDB Atlas...");
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log("✅ New MongoDB Connection Established!");
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error("❌ MongoDB Connection Error:", e);
        throw e;
    }

    return cached.conn;
}

export const dbConnect = connectToDatabase;
export default connectToDatabase;
