# Blockchain-Based Academic Certification Verification System

A complete web-based academic certificate management and verification system using blockchain concepts. The system allows educational institutions to securely issue digital academic certificates and enables students, companies, recruiters, and authorized third parties to verify those certificates cryptographically.

## Features
- **Role-Based Access Control**: Super Admin, College Admin, Student, and Public Verifier.
- **Cryptographic Hashing**: Certificates are converted to a canonical JSON representation and hashed using SHA-256.
- **Blockchain Ledger**: A verifiable linked-list of blocks containing transaction data and previous hash references.
- **QR Code & PDF Generation**: Automatically generates downloadable PDF certificates with embedded verification QR codes.
- **Verification Portal**: Public-facing page to verify certificate authenticity.
- **Blockchain Integrity Checker**: Admin tool to detect any tampering within the database/blockchain.

## Technology Stack
- **Frontend**: React (Vite), TypeScript, Vanilla CSS (Custom Design System), Lucide Icons, Axios.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JSON Web Tokens (JWT).
- **Database**: PostgreSQL (or SQLite for local dev).
- **Other**: PDFKit (PDF generation), QRCode (QR generation).

---

## Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (or use the provided Docker Compose file)
- Docker (optional)

### 2. Database Setup (Docker)
```bash
docker-compose up -d
```

### 3. Backend Setup
```bash
cd backend
npm install
```
Configure your `.env` file (already created by default):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blockchain_cert?schema=public"
JWT_SECRET="academic_cert_secret_key_2026"
PORT=5000
FRONTEND_URL="http://localhost:5173"
```
Run Database Migrations and Seed:
```bash
npx prisma db push
npx prisma db seed
```
*Note: The seed script creates the Genesis Block, a Super Admin, a College Admin (MGM University), and a Sample Student.*

Start the backend:
```bash
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 5. Sample Login Credentials
- **Super Admin**: `admin@system.com` / `admin123`
- **College Admin**: `admin@mgm.edu` / `mgm123`
- **Student**: `nadeem@student.mgm.edu` / `student123`

---

## API Documentation

### Auth
- `POST /api/auth/login` - Authenticate and get JWT

### Certificates
- `POST /api/certificates` - Issue a new certificate (Admin only)
- `GET /api/certificates` - Get certificates based on role
- `GET /api/certificates/:id/download` - Download PDF certificate
- `POST /api/certificates/:id/revoke` - Revoke a certificate

### Blockchain
- `GET /api/blockchain` - Get full blockchain ledger
- `GET /api/blockchain/integrity` - Run integrity check on the blockchain

### Verification
- `GET /api/verify/:certificateId` - Publicly verify a certificate ID

### Students
- `POST /api/students` - Add a new student (Admin only)
- `GET /api/students` - Get all students in the institution

---

## Project Architecture Diagram

```mermaid
graph TD
    UI[Frontend Web UI React] --> API[Backend REST API Express]
    API --> Auth[Auth Service]
    API --> Cert[Certificate Service]
    API --> Verify[Verification Service]
    API --> BC[Blockchain Service]
    API --> Util[QR/PDF Service]
    
    Auth --> DB[(PostgreSQL)]
    Cert --> DB
    Verify --> DB
    BC --> DB
    
    Cert --> Util
```

---

## Database ER Diagram

```mermaid
erDiagram
    User ||--o{ Institution : belongs_to
    Institution ||--o{ Student : has
    Institution ||--o{ Certificate : issues
    Student ||--o{ Certificate : owns
    Certificate ||--o{ BlockchainBlock : mapped_to
    Certificate ||--o{ VerificationLog : has
    Certificate ||--o{ Revocation : has

    Institution {
        String id PK
        String name
        String code
    }
    User {
        String id PK
        String email
        String role
        String password_hash
    }
    Student {
        String id PK
        String student_id
        String name
        String roll_number
    }
    Certificate {
        String certificate_id PK
        String status
        String certificate_hash
        String course
    }
    BlockchainBlock {
        Int block_index PK
        String current_hash
        String previous_hash
        String certificate_id FK
    }
```

---

## Blockchain Flow Diagram

```mermaid
sequenceDiagram
    participant Admin
    participant App
    participant HashingService
    participant BlockchainLedger
    
    Admin->>App: Issue Certificate Data
    App->>HashingService: Canonicalize & Hash Data (SHA-256)
    HashingService-->>App: CertificateHash
    App->>BlockchainLedger: Get Last Block Hash
    BlockchainLedger-->>App: PreviousHash
    App->>HashingService: Hash(Index + CertHash + PrevHash + Timestamp)
    HashingService-->>App: CurrentBlockHash
    App->>BlockchainLedger: Store New Block
    App-->>Admin: Certificate Issued Successfully
```

---

## Certificate Verification Flowchart

```mermaid
graph TD
    Start[Scan QR or Enter ID] --> FindCert{Certificate Exists in DB?}
    FindCert -- No --> R1[NOT_FOUND / INVALID]
    FindCert -- Yes --> GetBlock{Blockchain Record Exists?}
    
    GetBlock -- No --> R2[INVALID_BLOCKCHAIN]
    GetBlock -- Yes --> CheckStatus{Status == ACTIVE?}
    
    CheckStatus -- No, Revoked --> R3[REVOKED / SUPERSEDED]
    CheckStatus -- Yes --> RecalcHash[Recalculate Hash from DB Data]
    
    RecalcHash --> MatchHash{Matches Stored Block Hash?}
    MatchHash -- No --> R4[TAMPERED / MISMATCH]
    MatchHash -- Yes --> R5[VERIFIED SUCCESSFULLY]
```
