import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Feed from './pages/Feed';
import CreatePost from './pages/CreatePost';
import StatusCheck from './pages/StatusCheck';
import AdminDashboard from './pages/AdminDashboard';

// Shield Icon Component
const ShieldIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#grad)" stroke="#6366f1" />
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#818cf8' }} />
                <stop offset="100%" style={{ stopColor: '#6366f1' }} />
            </linearGradient>
        </defs>
    </svg>
);

// Desktop Navigation
function Navigation() {
    const location = useLocation();

    return (
        <nav className="nav">
            <Link to="/" className="nav-brand">
                <ShieldIcon />
                <span>CrimeAware</span>
            </Link>
            <div className="nav-links">
                <Link
                    to="/"
                    className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                >
                    Feed
                </Link>
                <Link
                    to="/create-post"
                    className={`nav-link ${location.pathname === '/create-post' ? 'active' : ''}`}
                >
                    Report Incident
                </Link>
                <Link
                    to="/admin"
                    className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                >
                    Admin
                </Link>
            </div>
        </nav>
    );
}

// Mobile Bottom Navigation
function MobileNavigation() {
    const location = useLocation();

    return (
        <div className="mobile-nav">
            <Link to="/" className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span>Feed</span>
            </Link>
            <Link to="/create-post" className={`mobile-nav-item ${location.pathname === '/create-post' ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                <span>Report</span>
            </Link>
            <Link to="/admin" className={`mobile-nav-item ${location.pathname === '/admin' ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Admin</span>
            </Link>
        </div>
    );
}

function App() {
    return (
        <Router>
            <Navigation />
            <Routes>
                <Route path="/" element={<Feed />} />
                <Route path="/create-post" element={<CreatePost />} />
                <Route path="/status" element={<StatusCheck />} />
                <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
            <MobileNavigation />
        </Router>
    );
}

export default App;
