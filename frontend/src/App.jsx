import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import ReportForm from './pages/ReportForm';
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

// Navigation Component
function Navigation() {
    const location = useLocation();

    return (
        <nav className="nav">
            <Link to="/" className="nav-brand">
                <ShieldIcon />
                <span>SafeReport</span>
            </Link>
            <div className="nav-links">
                <Link
                    to="/"
                    className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                >
                    Home
                </Link>
                <Link
                    to="/report"
                    className={`nav-link ${location.pathname === '/report' ? 'active' : ''}`}
                >
                    Submit Report
                </Link>
                <Link
                    to="/status"
                    className={`nav-link ${location.pathname === '/status' ? 'active' : ''}`}
                >
                    Check Status
                </Link>
            </div>
        </nav>
    );
}

function App() {
    return (
        <Router>
            <Navigation />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/report" element={<ReportForm />} />
                <Route path="/status" element={<StatusCheck />} />
                <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
        </Router>
    );
}

export default App;
