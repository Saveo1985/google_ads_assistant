
import * as dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import path from 'path';

console.log("Checking environment...");
try {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
    console.log("DOTENV loaded:", process.env.VITE_FIREBASE_API_KEY ? "YES" : "NO");

    // Check Firebase import
    console.log("Firebase app module:", typeof initializeApp);
    console.log("✅ Imports appear to work.");
} catch (e) {
    console.error("❌ Import/Config error:", e);
}
