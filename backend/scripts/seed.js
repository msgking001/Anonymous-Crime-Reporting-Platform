import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Post from '../src/models/Post.js';
import { encrypt, hashToken } from '../src/utils/encryption.js';
import { generateToken, generateReportId } from '../src/utils/tokenGenerator.js';

// Setup environment and paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const CATEGORIES = ['theft', 'harassment', 'cyber_fraud', 'stalking', 'assault', 'corruption', 'suspicious_activity', 'accident'];
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur'];
const AREAS = ['Downtown', 'Suburbs', 'East District', 'West Side', 'Central Park', 'Industrial Area', 'Business Hub', 'Residential Colony'];
const THREAT_LEVELS = ['low_risk', 'concerning', 'urgent', 'critical'];

const MOCK_DESCRIPTIONS = [
    "I witnessed a suspicious individual loitering near the ATM for over an hour. They seemed to be watching people's PIN entries.",
    "Someone snatched a gold chain from an elderly woman and ran towards the main road. The thief was wearing a black hoodie.",
    "Multiple people reported receiving fraudulent calls claiming to be from the electricity department demanding immediate payment.",
    "Vandalism noticed at the community center. Some windows were broken and there are spray paint tags on the north wall.",
    "A reckless driver was spotted speeding through the school zone during dismissal time. License plate partially visible.",
    "I observed an illegal gambling setup in the back alley behind the old warehouse. About 5-7 people were involved.",
    "Street lights have been non-functional for three days on 5th Avenue, making it unsafe for commuters after dark.",
    "A group of teens were seen harassing pedestrians near the shopping mall entrance yesterday evening.",
    "Possible drug activity suspected in the park during late nights. Frequent short-term visits by cars to the east gate.",
    "Industrial waste being dumped into the local stream by a white tanker truck. Happened around 2:00 AM."
];

const seedDatabase = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGO_URI is missing from .env");

        console.log("Connecting to MongoDB...");
        await mongoose.connect(uri);
        console.log("✅ Connected!");

        // We do NOT delete existing data to be safe, just adding new ones
        console.log("Generating 10 random reports...");

        const posts = [];
        for (let i = 0; i < 10; i++) {
            const token = generateToken();
            const reportId = generateReportId();
            const city = CITIES[Math.floor(Math.random() * CITIES.length)];
            const area = AREAS[Math.floor(Math.random() * AREAS.length)];

            // Random Unsplash image (filtered by category context)
            const randomImageId = Math.floor(Math.random() * 1000);
            const mediaUrl = `https://picsum.photos/seed/${randomImageId}/800/600`;

            posts.push({
                postId: reportId,
                hashedToken: hashToken(token),
                title: `${CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)].replace('_', ' ').toUpperCase()} in ${area}`,
                description: encrypt(MOCK_DESCRIPTIONS[i % MOCK_DESCRIPTIONS.length]),
                category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
                location: {
                    area,
                    city,
                    coordinates: {
                        lat: (Math.random() * (40 - 10) + 10).toFixed(4),
                        lng: (Math.random() * (100 - 70) + 70).toFixed(4)
                    }
                },
                status: 'submitted',
                initialThreatLevel: THREAT_LEVELS[Math.floor(Math.random() * THREAT_LEVELS.length)],
                mediaUrls: [mediaUrl],
                votes: {
                    low_risk: Math.floor(Math.random() * 5),
                    concerning: Math.floor(Math.random() * 5),
                    urgent: Math.floor(Math.random() * 5),
                    critical: Math.floor(Math.random() * 5)
                }
            });

            console.log(`- Prepared report ${i + 1}: [Token: ${token}]`);
        }

        await Post.insertMany(posts);
        console.log("✅ Successfully inserted 10 reports!");

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedDatabase();
