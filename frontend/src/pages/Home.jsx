import { Link } from 'react-router-dom';

// Icons
const ShieldCheckIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
    </svg>
);

const LockIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);

const FileTextIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
);

const SearchIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
    </svg>
);

function Home() {
    return (
        <div className="container">
            {/* Hero Section */}
            <section className="page-header" style={{ paddingTop: '4rem' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '2rem'
                }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                        borderRadius: '50%',
                        color: '#818cf8'
                    }}>
                        <ShieldCheckIcon />
                    </div>
                </div>
                <h1>Report Crimes Anonymously</h1>
                <p>
                    A secure platform to report crimes and witness information without revealing your identity.
                    Your safety is our priority.
                </p>
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center',
                    marginTop: '2rem'
                }}>
                    <Link to="/report" className="btn btn-primary">
                        Submit a Report
                    </Link>
                    <Link to="/status" className="btn btn-secondary">
                        Check Status
                    </Link>
                </div>
            </section>

            {/* Features */}
            <section style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginTop: '4rem'
            }}>
                <div className="card fade-in">
                    <div style={{
                        color: '#10b981',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <LockIcon />
                        <h3 style={{ margin: 0 }}>100% Anonymous</h3>
                    </div>
                    <p style={{ margin: 0 }}>
                        No login required. No email, phone number, or personal information collected.
                        We don't store your IP address.
                    </p>
                </div>

                <div className="card fade-in" style={{ animationDelay: '0.1s' }}>
                    <div style={{
                        color: '#6366f1',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <FileTextIcon />
                        <h3 style={{ margin: 0 }}>Structured Reports</h3>
                    </div>
                    <p style={{ margin: 0 }}>
                        Submit detailed, categorized reports that are automatically routed to the
                        appropriate authorities – local police or cybercrime units.
                    </p>
                </div>

                <div className="card fade-in" style={{ animationDelay: '0.2s' }}>
                    <div style={{
                        color: '#f59e0b',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <SearchIcon />
                        <h3 style={{ margin: 0 }}>Track Your Report</h3>
                    </div>
                    <p style={{ margin: 0 }}>
                        Receive a unique token after submission. Use it to check your report status
                        and receive updates from authorities.
                    </p>
                </div>
            </section>

            {/* How It Works */}
            <section style={{ marginTop: '5rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>How It Works</h2>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    {[
                        { step: 1, title: 'Fill the Report Form', desc: 'Select crime category, describe the incident, and add optional evidence.' },
                        { step: 2, title: 'Get Your Anonymous Token', desc: 'After submission, you\'ll receive a unique token. Save it securely!' },
                        { step: 3, title: 'Report Gets Analyzed', desc: 'Our system categorizes and routes your report to the right authority.' },
                        { step: 4, title: 'Track Your Report', desc: 'Use your token to check status updates from authorities.' }
                    ].map((item) => (
                        <div key={item.step} className="card" style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '1.5rem'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'var(--gradient-primary)',
                                borderRadius: '50%',
                                fontWeight: '600',
                                fontSize: '1.25rem'
                            }}>
                                {item.step}
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 0.5rem' }}>{item.title}</h4>
                                <p style={{ margin: 0, fontSize: '0.95rem' }}>{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Disclaimer */}
            <section style={{ marginTop: '5rem', marginBottom: '3rem' }}>
                <div className="alert alert-warning" style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <div>
                        <strong style={{ color: '#f59e0b' }}>Important Disclaimer</strong>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.95rem' }}>
                            This platform is for crime reporting assistance only. It is <strong>NOT</strong> a replacement
                            for an official FIR (First Information Report). For emergencies, please contact local
                            authorities directly by calling emergency services.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;
