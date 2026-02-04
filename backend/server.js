import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import connectDB from './config/db.js';
import reportRoutes from './routes/reports.js';
import postRoutes from './routes/postRoutes.js';
import adminRoutes from './routes/admin.js';
import { generalLimiter } from './middleware/rateLimiter.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General rate limiting
app.use(generalLimiter);

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/posts', postRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Anonymous Crime Reporting API is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint with disclaimer
app.get('/', (req, res) => {
    res.json({
        name: 'Anonymous Crime Reporting Platform API',
        version: '1.0.0',
        disclaimer: 'This platform is for crime reporting assistance only. It is NOT a replacement for an official FIR. For emergencies, please contact local authorities directly.',
        endpoints: {
            getPosts: 'GET /api/posts',
            createPost: 'POST /api/posts',
            admin: '/api/admin/* (requires authentication)'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║     Anonymous Crime Reporting Platform - Backend Server      ║
╠══════════════════════════════════════════════════════════════╣
║  Status:  Running                                            ║
║  Port:    ${PORT}                                              ║
║  Mode:    ${process.env.NODE_ENV || 'development'}                                     ║
║                                                              ║
║  DISCLAIMER: This is NOT a replacement for an official FIR  ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
