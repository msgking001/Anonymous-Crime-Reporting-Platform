import Post from '../models/Post.js';
import mongoose from 'mongoose';

/**
 * Get paginated feed of posts
 */
export const getPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.category) filter.category = req.query.category;
        if (req.query.city) filter.city = { $regex: req.query.city, $options: 'i' };

        const posts = await Post.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v');

        const total = await Post.countDocuments(filter);

        res.json({
            data: posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
};

/**
 * Create a new anonymous post
 */
export const createPost = async (req, res) => {
    try {
        const { title, description, category, city } = req.body;

        // Manual validation (also handled by Mongoose, but good for custom error messages)
        if (!title || !description || !category || !city) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const mediaUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        const newPost = new Post({
            title,
            description,
            category,
            city,
            mediaUrls
        });

        await newPost.save();

        res.status(201).json({
            message: 'Post created successfully',
            post: newPost
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
};

/**
 * Submit a threat vote
 */
export const submitVote = async (req, res) => {
    try {
        const { id } = req.params;
        const { voteType } = req.body;
        const sessionId = req.headers['x-session-id'];

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required for voting' });
        }

        if (!['low_risk', 'concerning', 'urgent', 'critical'].includes(voteType)) {
            return res.status(400).json({ error: 'Invalid vote type' });
        }

        // Since we don't have a separate Vote model in the user requirements,
        // and the Post model requirements only specified a nested `votes` object,
        // we need to be careful about abuse prevention as requested ("Session-based vote restriction").
        //
        // However, the requested Post model:
        // votes { low_risk, concerning, urgent, critical }
        //
        // This structure helps with aggregation but doesn't track *who* voted.
        // To implement "Check if current session already voted" and "Session-based vote restriction",
        // we strictly need to store WHO voted on WHAT.
        //
        // I will check if a `Vote` model exists or create a simple one for tracking.
        // Re-reading requirements:
        // "3. Abuse Prevention... Session-based vote restriction"
        // "2. Routes... GET /api/posts/:id/vote - Check if current session already voted"
        //
        // Implementation:
        // I will use a separate collection `PostVotes` to track (postId, sessionId, voteType).
        // This was not explicitly asked in "1. New MongoDB Model: Post", but it is IMPLIED by the functional requirements.
        // I will use a dynamic model or a separate collection logic here without defining a full new file if possible,
        // OR I will define a helper schema here if I can't create a new file.
        // Actually, I can just use a separate collection `post_votes` directly via mongoose/mongodb driver or define a schema inline.
        // Better yet, I'll use a `PostVote` model. Wait, the user listed "FILES YOU MUST GENERATE".
        // It didn't list `PostVote.js`.
        // But it required "Session-based vote restriction".
        // I will implement this using a Mongoose model defined inside this controller or utilize the logical equivalent.
        // Actually, I'll define it at the top of this file to stay compliant with "Keep files small and readable" and "No extra files unless necessary".

        // NOTE: The previous `posts.js` used `ThreatVote` model. I should probably reuse that concept or define it here.
        // Let's define a simple internal model for tracking votes.

        const PostVote = mongoose.models.PostVote || mongoose.model('PostVote', new mongoose.Schema({
            postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
            sessionId: { type: String, required: true, index: true },
            voteType: { type: String, required: true }
        }, { timestamps: true }));

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check previous vote
        const existingVote = await PostVote.findOne({ postId: id, sessionId });

        if (existingVote) {
            if (existingVote.voteType === voteType) {
                return res.json({ message: 'Vote already recorded', severityScore: post.severityScore });
            }

            // Decrement old vote
            post.votes[existingVote.voteType] = Math.max(0, post.votes[existingVote.voteType] - 1);
            // Increment new vote
            post.votes[voteType] += 1;

            existingVote.voteType = voteType;
            await existingVote.save();
        } else {
            // New vote
            post.votes[voteType] += 1;
            await PostVote.create({ postId: id, sessionId, voteType });
        }

        // Recalculate severity score
        // Weighted sum: low_risk=1, concerning=3, urgent=6, critical=10
        const weights = { low_risk: 1, concerning: 3, urgent: 6, critical: 10 };
        let totalScore = 0;
        let totalVotes = 0;

        for (const [type, count] of Object.entries(post.votes)) {
            if (weights[type]) {
                totalScore += count * weights[type];
                totalVotes += count;
            }
        }

        // Normalize or just keep raw score? 
        // "severityScore // computed from votes"
        // Let's use the raw weighted score for simplicity and sorting.
        post.severityScore = totalScore;

        await post.save();

        res.json({
            message: 'Vote submitted',
            severityScore: post.severityScore,
            votes: post.votes
        });

    } catch (error) {
        console.error('Error submitting vote:', error);
        res.status(500).json({ error: 'Failed to submit vote' });
    }
};

/**
 * Check if user has voted
 */
export const checkVoteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const sessionId = req.headers['x-session-id'];

        if (!sessionId) {
            return res.json({ hasVoted: false });
        }

        const PostVote = mongoose.models.PostVote; // Reuse the model defined above
        // If model not initialized yet (rare race condition), handle it
        if (!PostVote) {
            return res.json({ hasVoted: false });
        }

        const vote = await PostVote.findOne({ postId: id, sessionId });

        if (vote) {
            res.json({ hasVoted: true, voteType: vote.voteType });
        } else {
            res.json({ hasVoted: false });
        }
    } catch (error) {
        console.error('Error checking vote status:', error);
        res.status(500).json({ error: 'Failed to check vote status' });
    }
};
