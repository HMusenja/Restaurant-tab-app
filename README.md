#  Restaurant Real-Time QR Ordering & POS System

A full-stack **MERN-based real-time restaurant management platform** that enables QR-based customer ordering, live table tracking, POS management, and financial reporting.

Built for modern restaurants that want to streamline operations, reduce manual order handling, and gain real-time operational visibility.

---

##  Overview

This system digitizes the entire restaurant workflow:

- Customers scan a **QR code** at their table  
- Browse the digital menu  
- Place orders directly from their device  
- Kitchen & POS receive updates in real time  
- Staff manage tables and tabs  
- Admin monitors financial performance  

---

##  Tech Stack

### Frontend
- React (SPA Architecture)
- Context API for state management
- Custom reusable hooks
- Tailwind CSS
- Axios (centralized `axiosConfig`)
- Protected routes & role-based UI

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- RESTful API structure
- Role-based access control
- Modular route separation

### Architecture Highlights
- Real-time table & order updates
- Optimistic UI updates
- Modular financial reporting endpoints
- Clean separation of concerns
- Scalable domain modeling

---

##  Core Features

### 1️ QR Code Ordering
- Unique QR per table
- Session-based ordering (no login required)
- Real-time order submission
- Automatic table assignment

---

### 2️ Live Table Management
- Table statuses:
  - Available
  - Occupied
  - Reserved
- Active tab tracking
- Guest count tracking
- Real-time updates

---

### 3️ POS System
- Manual order entry
- Live order modification
- Dynamic total calculation
- Payment processing
- Tab closing system

---

### 4️ Financial Dashboard
Admin-only analytics:

- Revenue summary
- Date filtering (`from`, `to`)
- Grouping (daily, weekly, monthly)
- Recent paid transactions
- Pagination support
- Aggregate endpoints


---

### 5️ Authentication & Roles

Roles:
- Admin
- Staff
- Customer (QR session-based)

Features:
- Cookie-based authentication
- Immediate navbar update on auth state change
- Secure logout with cookie removal
- Protected routes

---


---

## 🔄 System Workflow

### Customer
1. Scan QR  
2. Browse menu  
3. Add items  
4. Submit order  
5. View order status  

### Staff
1. View live tables dashboard  
2. Manage active tabs  
3. Process payments  
4. Close tables  

### Admin
1. Monitor revenue  
2. Filter reports  
3. Analyze transactions  

---

##  Design Principles

- Scalable architecture  
- Reusable components  
- Modular backend structure  
- Optimistic UI for smooth UX  
- Centralized API configuration  
- Clear separation between UI & business logic  

---






