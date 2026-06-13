# 🏠 RentCare — Rental Property Management System

> A full-stack web application that digitizes and streamlines the relationship between landlords, tenants, and contractors — making property management effortless and transparent.

---

## 📌 Overview

**RentCare** is a role-based rental management platform built as part of an Advanced Database Systems (ADBS) course project. It addresses the real-world friction in property management by giving each stakeholder — **landlord**, **tenant**, and **contractor** — their own dedicated dashboard with the tools they need.

From filing maintenance complaints with photo evidence to verifying rent payments and generating downloadable PDF reports, RentCare handles the complete lifecycle of rental property operations in one place.

---

## ✨ Key Features

### 👤 Role-Based Access Control
Three distinct user roles, each with a tailored experience:
- **Landlord** — Oversees all properties, tenants, complaints, and payments. Has full administrative control.
- **Tenant** — Files complaints, submits rent payments with proof, tracks issue status, and reviews contractors.
- **Contractor** — Receives work assignments, views complaint details, and manages job progress.

### 🔧 Complaint Management
- Tenants can file maintenance complaints (plumbing, electrical, cleaning, etc.) with optional photo attachments
- Landlords can assign complaints to contractors and set resolution deadlines
- Status lifecycle: `pending → assigned → in-progress → resolved`
- Real-time notifications sent to all relevant parties at each stage

### 💰 Rent Payment Tracking
- Tenants submit monthly rent payments with proof-of-payment images
- Landlords verify or reject submissions
- Full payment history with month-by-month breakdown

### 📊 PDF Report Generation
- Landlords can export detailed PDF reports for:
  - **Complaints** (with embedded photos, status, contractor info)
  - **Rent Payments** (with receipts, amounts, verification status)
- Reports include a summary section and are paginated automatically

### 🔔 Real-Time Notifications
- Powered by **Socket.IO** for instant, push-based alerts
- Notifications stored in MongoDB and delivered live to the user's browser session
- Events include: new complaints, status changes, contractor assignments, overdue deadlines

### ⏰ Automated Deadline Alerts
- A **cron job** runs daily at 8:00 AM
- Automatically detects overdue (unresolved past-deadline) complaints
- Sends notifications to tenants and landlords without any manual trigger

### ⭐ Contractor Review System
- After a complaint is resolved, tenants can rate and review the assigned contractor (1–5 stars)
- Helps landlords make better contractor assignments over time

### 📁 File Storage with GridFS
- Images (complaint photos, payment receipts) are stored directly in **MongoDB GridFS**
- No external storage service required — everything stays within the database

---

## 🗂️ Project Structure

```
rentcare-backend/
│
├── server.js                  # App entry point — Express, Socket.IO, routes
│
├── config/
│   └── db.js                  # MongoDB connection setup
│
├── models/                    # Mongoose data schemas
│   ├── User.js                # Roles: tenant, landlord, contractor
│   ├── Property.js            # Property with linked landlord & tenants
│   ├── Complaint.js           # Full complaint lifecycle
│   ├── RentPayment.js         # Payment records with proof
│   ├── Review.js              # Contractor ratings per complaint
│   └── Notification.js        # Persistent in-app notifications
│
├── controllers/               # Business logic layer
│   ├── authController.js      # Register & login with JWT
│   ├── userController.js      # User profile management
│   ├── propertyController.js  # Property CRUD
│   ├── complaintController.js # Complaint management + notifications
│   ├── rentController.js      # Rent submission & verification
│   └── reviewController.js    # Contractor reviews
│
├── routes/                    # API route definitions
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── propertyRoutes.js
│   ├── complaintRoutes.js
│   ├── rentRoutes.js
│   ├── reviewRoutes.js
│   ├── notificationRoutes.js
│   ├── fileRoutes.js          # GridFS file upload/download
│   └── reportRoutes.js        # PDF report generation
│
├── middleware/
│   └── authMiddleware.js      # JWT verification & route protection
│
├── utils/
│   └── cronJobs.js            # Scheduled overdue complaint alerts
│
└── frontend/                  # Vanilla HTML/CSS/JS client
    ├── index.html             # Landing / Login page
    ├── register.html          # Registration page
    ├── landlord.html          # Landlord dashboard
    ├── tenant.html            # Tenant dashboard
    ├── contractor.html        # Contractor dashboard
    ├── style.css              # Shared stylesheet
    └── app.js                 # Frontend JS logic
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Framework** | Express.js v5 |
| **Database** | MongoDB Atlas (via Mongoose) |
| **File Storage** | MongoDB GridFS |
| **Authentication** | JWT + bcryptjs |
| **Real-time** | Socket.IO |
| **Scheduling** | node-cron |
| **PDF Generation** | PDFKit |
| **Frontend** | Vanilla HTML, CSS, JavaScript |
| **Backend Hosting** | Render |
| **Frontend Hosting** | Netlify |

---

## 🌐 Live Demo

The application is fully deployed and accessible online:

| Service | URL |
|---|---|
| 🖥️ **Frontend (Netlify)** | [https://ahmad-rentcare.netlify.app](https://ahmad-rentcare.netlify.app) |
| ⚙️ **Backend API (Render)** | [https://rentcare-fj1w.onrender.com](https://rentcare-fj1w.onrender.com) |
| 🗄️ **Database (MongoDB Atlas)** | MongoDB Atlas — Cluster0 |

> **Note:** The backend is hosted on Render's free tier. If the server has been inactive for 15+ minutes, the first request may take ~30–50 seconds (cold start). After that, it responds normally.

---

## 🚀 Deployment Architecture

```
┌─────────────────────┐     API Calls      ┌─────────────────────┐
│                     │ ──────────────────► │                     │
│   Netlify (Frontend)│                     │   Render (Backend)  │
│   HTML / CSS / JS   │ ◄────────────────── │   Node.js / Express │
│                     │     JSON Responses  │                     │
└─────────────────────┘                     └─────────┬───────────┘
                                                      │
                                                      │ Mongoose
                                                      ▼
                                            ┌─────────────────────┐
                                            │  MongoDB Atlas       │
                                            │  (Cloud Database)    │
                                            │  + GridFS (Files)    │
                                            └─────────────────────┘
```

### Step 1: MongoDB Atlas (Cloud Database)

> **Why Atlas?** During development, I used a **local MongoDB** instance (`mongodb://localhost:27017`). However, when deploying the backend to Render (a cloud server), the cloud server **cannot access a database running on my local machine**. MongoDB Atlas solves this by hosting the database in the cloud, making it accessible from anywhere — both my local machine during development and the Render server in production.

- Migrated from local MongoDB to **MongoDB Atlas** cloud cluster
- Database: `rentcare` on `Cluster0`
- Network Access: Configured to allow connections from Render's dynamic IPs (`0.0.0.0/0`)
- All data (users, properties, complaints, payments, files) stored in the cloud

### Step 2: Render (Backend Deployment)
- Backend API deployed as a **Web Service** on Render
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment variables (`MONGO_URI`, `JWT_SECRET`) configured in Render dashboard
- Express serves both the API and static frontend files
- Socket.IO works seamlessly for real-time notifications

### Step 3: Netlify (Frontend Deployment)
- Frontend (HTML/CSS/JS) deployed separately on **Netlify**
- Connected to the same GitHub repository
- Publish directory set to `frontend/`
- `BASE_URL` in `app.js` points to the Render backend URL
- Auto-deploys on every `git push` to the `main` branch

---

## 🔌 API Endpoints

| Module | Base Route | Description |
|---|---|---|
| Auth | `/api/auth` | Register, Login |
| Users | `/api/users` | Profile management |
| Properties | `/api/properties` | Add/manage rental properties |
| Complaints | `/api/complaints` | File, update, and track complaints |
| Rent | `/api/rent` | Submit and verify rent payments |
| Reviews | `/api/reviews` | Contractor ratings |
| Notifications | `/api/notifications` | Fetch & manage alerts |
| Files | `/api/files` | Upload/download via GridFS |
| Reports | `/api/reports` | Export PDF reports (complaints & rent) |

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** v18 or later
- **MongoDB** (local instance or MongoDB Atlas URI)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Bsai-24071/RentCare.git
cd RentCare

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create a .env file in the root directory:
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000

# 4. Start the development server
npm run dev
```

The server will start at `http://localhost:5000`.

Open any of the HTML files in the `frontend/` folder in your browser to use the application.

---

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `PORT` | Server port (default: `5000`) |

---

## 📸 Dashboards

The frontend provides three separate role-based dashboards:

- **`/frontend/landlord.html`** — Manage properties, view all complaints, verify payments, export reports
- **`/frontend/tenant.html`** — File complaints with photos, submit rent, track statuses, review contractors
- **`/frontend/contractor.html`** — View assigned work orders and update progress

---

## 🧠 What I Learned

This project gave me hands-on experience with:

- Designing a **multi-role RESTful API** with protected routes and JWT authentication
- Working with **MongoDB GridFS** for binary file storage within a NoSQL database
- Implementing **real-time event-driven communication** using Socket.IO rooms
- Automating server-side tasks with **cron jobs**
- Generating **dynamic PDF reports** with embedded images using PDFKit
- Building a clean, modular **MVC architecture** in Node.js
- **Cloud deployment** using MongoDB Atlas, Render, and Netlify
- Managing **environment variables** and secrets across multiple cloud platforms
- Handling **CORS**, cold starts, and cross-origin API communication in production

---

## 👨‍💻 Author

**BSAI-24071**  
BS Artificial Intelligence — 4th Semester  
Advanced Database Systems (ADBS) Project

---

## 🧪 Test Accounts (For Evaluation)

Use the following pre-registered accounts to test the application at [https://ahmad-rentcare.netlify.app](https://ahmad-rentcare.netlify.app):

| Role | Email | Password |
|---|---|---|
| 🏠 **Landlord** | `Landlord123@itu.com` | `Landloard123` |
| 🧑‍💼 **Tenant** | `Tenant123@itu.com` | `Tenant123` |
| 🔧 **Contractor** | `Contractor123@itu.com` | `Contrator123` |

> Each role has its own dedicated dashboard with different features and permissions.

---

*Built with ❤️ to solve a real-world problem.*

