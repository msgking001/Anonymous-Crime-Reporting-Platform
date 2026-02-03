import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPosts } from '../services/api';
import PostCard from '../components/PostCard';
import InfiniteScroll from '../components/InfiniteScroll';

function Feed() {
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({ category: '', city: '' });
    const [error, setError] = useState(null);

    const fetchPosts = useCallback(async (pageNum, currentFilters) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getPosts(pageNum, currentFilters);
            if (result.success) {
                if (pageNum === 1) {
                    setPosts(result.data.posts);
                } else {
                    setPosts(prev => [...prev, ...result.data.posts]);
                }
                setHasMore(result.data.pagination.hasMore);
            }
        } catch (err) {
            console.error('Failed to fetch posts', err);
            setError('Failed to load feed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial load and filter change
    useEffect(() => {
        setPage(1);
        fetchPosts(1, filters);
    }, [filters, fetchPosts]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage, filters);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            {/* Header & Filters */}
            <div className="feed-header fade-in">
                <h1>Community Crime Awareness</h1>
                <p>Anonymous threat validation feed</p>

                <div className="filters">
                    <div className="filter-group">
                        <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                        >
                            <option value="">All Categories</option>
                            <option value="theft">Theft</option>
                            <option value="harassment">Harassment</option>
                            <option value="cyber_fraud">Cyber Fraud</option>
                            <option value="assault">Assault</option>
                            <option value="suspicious_activity">Suspicious Activity</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <input
                            type="text"
                            placeholder="Filter by City..."
                            value={filters.city}
                            onChange={(e) => handleFilterChange('city', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="alert alert-danger">
                    <p>{error}</p>
                    <button onClick={() => fetchPosts(page, filters)} className="btn btn-sm btn-secondary">Retry</button>
                </div>
            )}

            {/* Feed */}
            <InfiniteScroll
                onLoadMore={loadMore}
                hasMore={hasMore}
                isLoading={isLoading}
            >
                {posts.map(post => (
                    <div key={post.postId} className="fade-in">
                        <PostCard post={post} />
                    </div>
                ))}

                {!isLoading && posts.length === 0 && !error && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <h3>No reports found</h3>
                        <p>Be the first to report an incident in this area.</p>
                        <Link to="/create-post" className="btn btn-primary">Report Incident</Link>
                    </div>
                )}
            </InfiniteScroll>

            {/* Floating Action Button for Create Post */}
            <div className="fab-container">
                <Link to="/create-post" className="fab" title="Report Incident">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}

export default Feed;
