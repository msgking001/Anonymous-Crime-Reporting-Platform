# Anonymous Crime Reporting Platform

A secure, anonymous MERN stack web platform for reporting crimes and witness information without revealing identity. Reports are structured, automatically categorized, and routed to appropriate authorities.

![Platform Preview](https://img.shields.io/badge/Status-Demo%20Ready-10b981) ![Node](https://img.shields.io/badge/Node.js-18+-339933) ![React](https://img.shields.io/badge/React-18+-61dafb) ![MongoDB](https://img.shields.io/badge/MongoDB-7+-47a248)

## ⚠️ Important Disclaimer

**This platform is for crime reporting assistance only. It is NOT a replacement for an official FIR (First Information Report). For emergencies, please contact local authorities directly.**

---

## Features

### 🔒 Anonymous by Design
- **No login required** - No email, phone, or personal information collected
- **No IP logging** - We don't store your IP address
- **Token-based tracking** - Receive a unique token to track your report
- **Encrypted storage** - Sensitive report content is encrypted at rest

### 📝 Structured Reporting
- Categorized crime types (theft, harassment, cyber fraud, stalking, assault, corruption)
- Physical vs cyber crime classification
- Location and time information
- Threat level assessment
- Evidence upload support (images, videos, audio)

### 🤖 Intelligent Processing
- **Keyword-based NLP** for automatic categorization
- **Confidence scoring** (0-100) based on description analysis
- **Urgency scoring** based on threat level and keywords
- **Automatic routing** to cybercrime unit or local police
- **Spam detection** for low-quality reports

### 🛡️ Security Features
- Rate limiting (5 reports/hour per session)
- Input sanitization and validation
- XSS protection
- Content encryption (AES-256)
- Token hashing (SHA-256)
- Helmet security headers

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Styling | Vanilla CSS (Dark theme) |
| Authentication | Anonymous tokens (no user auth) |

---

## Project Structure

```
crime-reporting-platform/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   ├── adminAuth.js       # Admin authentication
│   │   ├── rateLimiter.js     # Rate limiting
│   │   └── sanitizer.js       # Input validation
│   ├── models/
│   │   └── Report.js          # Report schema
│   ├── routes/
│   │   ├── admin.js           # Admin API routes
│   │   └── reports.js         # Public API routes
│   ├── utils/
│   │   ├── categorizer.js     # NLP categorization
│   │   ├── encryption.js      # AES/SHA256 utilities
│   │   └── tokenGenerator.js  # Token generation
│   ├── uploads/               # Evidence storage
│   ├── server.js              # Express app
│   └── .env                   # Environment config
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── ReportForm.jsx
│   │   │   ├── StatusCheck.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── services/
│   │   │   └── api.js         # API client
│   │   ├── App.jsx
│   │   ├── index.css          # Design system
│   │   └── main.jsx
│   └── index.html
└── README.md
```

---

## API Documentation

### Public Endpoints

#### Submit Report
```
POST /api/reports
Content-Type: application/json

{
  "category": "theft" | "harassment" | "cyber_fraud" | "stalking" | "assault" | "corruption" | "other",
  "crimeType": "physical" | "cyber",
  "description": "string (50-1000 chars)",
  "location": {
    "area": "string",
    "city": "string",
    "coordinates": { "lat": number, "lng": number }  // optional
  },
  "threatLevel": "low" | "medium" | "high" | "emergency",
  "incidentTime": {  // optional
    "date": "ISO8601 date",
    "approximate": boolean
  },
  "evidenceUrls": ["string"]  // optional
}

Response:
{
  "success": true,
  "data": {
    "token": "ABC123XYZ789EFGH",  // 16-char token
    "reportId": "uuid",
    "status": "submitted",
    "assignedAuthority": "cybercrime_unit" | "local_police"
  }
}
```

#### Check Status
```
GET /api/reports/status/:token

Response:
{
  "success": true,
  "data": {
    "reportId": "uuid",
    "category": "theft",
    "status": "submitted" | "under_review" | "forwarded" | "closed",
    "statusMessage": "string",
    "assignedAuthority": "local_police",
    "submittedAt": "ISO8601",
    "lastUpdated": "ISO8601"
  }
}
```

#### Upload Evidence
```
POST /api/reports/upload
Content-Type: multipart/form-data

files: File[] (max 5 files, 10MB each)

Response:
{
  "success": true,
  "data": {
    "urls": ["/uploads/filename1.jpg", "/uploads/filename2.mp4"]
  }
}
```

### Admin Endpoints

All admin endpoints require `x-admin-key` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/reports` | List reports with filters |
| GET | `/api/admin/reports/stats` | Get statistics |
| GET | `/api/admin/reports/:id` | Get report details |
| PATCH | `/api/admin/reports/:id/status` | Update report status |

---

## Anonymity Model

```
┌─────────────────────────────────────────────────────────────┐
│                    ANONYMITY FLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Reporter                    System                         │
│  ────────                    ──────                         │
│                                                             │
│  1. Submits report  ─────►  2. Generate random token        │
│     (no identity)              (16 alphanumeric chars)      │
│                                                             │
│  3. Receives token  ◄─────  4. Store HASHED token only      │
│     (save this!)               (SHA-256, irreversible)      │
│                                                             │
│  5. Uses token to   ─────►  6. Hash input, compare to       │
│     check status               stored hash                  │
│                                                             │
│  ✓ No email stored                                          │
│  ✓ No phone stored                                          │
│  ✓ No IP address logged                                     │
│  ✓ Description encrypted (AES-256)                          │
│  ✓ Token cannot be recovered                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Routing Logic

Reports are automatically routed based on crime type and category:

| Crime Type | Authority |
|------------|-----------|
| Cyber | Cybercrime Unit |
| Physical | Local Police |

The system also analyzes the description for keywords:
- **Cyber keywords**: online, internet, website, email, hack, social media, OTP, UPI, bank transfer
- **Physical keywords**: street, home, office, face to face, attacked, weapon

---

## Misuse Prevention

1. **Rate Limiting**
   - 5 report submissions per hour per session
   - 20 status checks per hour per session
   - 10 file uploads per hour per session

2. **Quality Checks**
   - Minimum 50 characters description
   - Maximum 1000 characters description
   - Spam keyword detection
   - Repetitive character detection

3. **Spam Flagging**
   - Low-quality reports are flagged
   - Flagged reports go to a separate queue
   - Admin can review and close spam reports

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and keys
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### ⚠️ Windows PowerShell Users
If you encounter an "execution of scripts is disabled" error, use **npm.cmd** explicitly:

```bash
# Backend
npm.cmd run dev

# Frontend
npm.cmd run dev
```

Alternatively, you can update your execution policy (requires Admin):
`Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/crime_reports |
| PORT | Backend server port | 5000 |
| ENCRYPTION_KEY | 32-char AES encryption key | (required) |
| ADMIN_KEY | Admin dashboard access key | (required) |
| MAX_FILE_SIZE | Max upload size in bytes | 10485760 (10MB) |

---

## Admin Access

Navigate to `/admin` and enter the admin key from your `.env` file.

Default admin key for development: `admin-secret-key-2024`

**⚠️ Change this in production!**

---

## License

MIT License - For educational and development purposes only.

---

## Contributing

This is a demo/prototype project. For production use, consider:
- Proper authentication for admin panel
- Cloud storage for evidence files
- Email notifications (optional, with consent)
- Database encryption at rest
- HTTPS/TLS enforcement
- Regular security audits
