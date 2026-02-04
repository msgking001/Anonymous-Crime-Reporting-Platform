
import mongoose from 'mongoose';
import express from 'express';
import { getPosts, createPost, submitVote } from './controllers/postController.js';
import postRoutes from './routes/postRoutes.js';
import Post from './models/Post.js';
import { postCreationLimiter } from './middleware/rateLimit.js';

console.log('Successfully imported all modules');

// Basic mock check
if (typeof getPosts !== 'function') throw new Error('getPosts is not a function');
if (typeof createPost !== 'function') throw new Error('createPost is not a function');
if (typeof postRoutes !== 'function') throw new Error('postRoutes is not a valid router');
if (!Post.schema) throw new Error('Post model invalid');

console.log('Verification passed: All modules exported correctly.');
process.exit(0);
