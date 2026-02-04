import dotenv from 'dotenv';
import app from './src/index.js';
import connectDB from './src/config/db.js';

dotenv.config();

const startServer = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) {
            console.error("FATAL ERROR: MONGO_URI (or MONGODB_URI) is not defined.");
            process.exit(1);
        }

        // 2. Connect to Database BEFORE starting server
        await connectDB();

        // 3. Start Express app
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
