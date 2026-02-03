import React, { useEffect, useRef } from 'react';

const InfiniteScroll = ({ children, onLoadMore, hasMore, isLoading }) => {
    const observerTarget = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    onLoadMore();
                }
            },
            { threshold: 0.5 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, isLoading, onLoadMore]);

    return (
        <div className="infinite-scroll-container">
            {children}
            <div ref={observerTarget} className="loading-trigger">
                {isLoading && (
                    <div className="feed-loader">
                        <div className="spinner"></div>
                        <span>Loading more reports...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InfiniteScroll;
