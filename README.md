# OCR-Based Document Processing System - Frontend

## Overview

This repository contains the frontend application for the OCR-Based Document Processing System.

The application is designed for field operators and reviewers to capture, process, verify, and audit document evidence used in carbon-credit workflows.

The frontend provides:

* Mobile-friendly document capture
* Offline-first document collection
* OCR review workflows
* Search and filtering
* Audit history visualization
* Dashboard and reporting views

For complete project documentation, architecture decisions, assumptions, scaling discussion, API details, and deployment information, please refer to the backend repository.

Backend Repository: https://github.com/shrvn12/ocr_backend

---

## Live Demo

Frontend: https://ocr-frontend-efr1.onrender.com

Backend API: https://ocr-backend-f4ls.onrender.com

---

## Features

### Authentication

* JWT-based authentication
* Role-based navigation
* Protected routes

### Dashboard

* Total documents
* Pending OCR
* Pending Review
* Approved documents
* Rejected documents

### Capture Workflow

* Mobile-friendly image upload
* Offline-aware capture
* Upload queue management
* Automatic synchronization

### OCR Review

* Original document preview
* OCR extracted fields
* Confidence indicators
* Field correction workflow
* Approval and rejection actions

### Search

* Vehicle number search
* Status filtering
* Confidence filtering
* Date range filtering

### Audit History

* View correction history
* View approvals and rejections
* View field-level changes

---

## Offline Support

The frontend is implemented as a Progressive Web App (PWA).

Features include:

* IndexedDB-based local storage
* Offline capture support
* Network connectivity monitoring
* Automatic synchronization after reconnection

Limitations:

* Initial application load requires connectivity.
* First-time login requires connectivity.
* Offline mode is available only after the application has been loaded successfully.

---

## Technology Stack

* Vue 3
* Vite
* Pinia
* Vue Router
* Axios
* IndexedDB
* PWA
* Tailwind CSS

---

## Installation

### Prerequisites

* Node.js 18+
* npm

### Setup

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## Project Structure

```text
src/

├── api/
├── assets/
├── components/
├── composables/
├── router/
├── stores/
├── views/
└── utils/
```

---

## Roles

### Uploader

Access to:

* Capture
* Search

### Reviewer

Access to:

* Dashboard
* Review Queue
* Search

### Admin

Access to:

* Dashboard
* Capture
* Review Queue
* Search

---

## Screenshots

Add screenshots of:

* Login
![alt text](<screenshots/Screenshot 2026-06-07 174444.png>)

* Dashboard
![alt text](<screenshots/Screenshot 2026-06-07 174227.png>)

* Capture Page
![alt text](<screenshots/Screenshot 2026-06-07 174319.png>)

* Review Page
![alt text](<screenshots/Screenshot 2026-06-07 174240.png>)

* Search Page
![alt text](<screenshots/Screenshot 2026-06-07 174313.png>)

* Audit History
![alt text](<screenshots/Screenshot 2026-06-07 174302.png>)

