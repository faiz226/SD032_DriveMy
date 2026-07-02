# DriveMy – PWA Driving Study Companion

DriveMy is a modern, bilingual (English/Bahasa Malaysia), offline-capable Progressive Web Application (PWA) designed to help Malaysian learner drivers prepare for their JPJ KPP1 theory exam and practical driving test. 

It features an interactive KPP1 mock exam simulator, visual road signs directory, Islamic ethics & defensive driving scenarios (based on Maqasid al-Shariah), color vision deficiency diagnostic test, and a gamified driving simulator.

---

## 🚀 Tech Stack

* **Frontend Framework**: React 18 with TypeScript & Vite 6 (Rolldown bundler)
* **Styling**: Tailwind CSS & Shadcn UI components
* **Routing**: React Router DOM (Lazy-Loaded Pages)
* **State Management**: Zustand (Persisted client state)
* **Data Fetching & Cache**: TanStack Query (React Query)
* **Database & Auth**: Supabase (PostgreSQL, REST, Row Level Security)
* **Game Engine**: Phaser 3 (Driving simulator game)
* **Offline & PWA Capability**: Vite PWA Plugin, Workbox Service Worker, and IndexedDB (`idb-keyval` for offline synchronization)
* **PDF Utility**: jsPDF + jspdf-autotable

---

## 🛠️ Project Setup & Installation

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **npm** installed on your system.

### 2. Clone & Install Dependencies
```bash
git clone <repository-url>
cd DriveMy/1
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Open `.env.local` and configure your Supabase credentials:
* `VITE_SUPABASE_URL`: Your Supabase API endpoint.
* `VITE_SUPABASE_ANON_KEY`: Your project's client-side anon key.
* `SUPABASE_SERVICE_ROLE_KEY`: Required only for running the database seeding and image uploading scripts (never expose this in the browser).

### 4. Database Setup & Seeding
To populate the question bank and upload road sign assets into Supabase:
1. Ensure you have created a public Storage Bucket named `kpp-images` in your Supabase dashboard with a public-read policy.
2. Run the seeding command to insert KPP1 mock questions into PostgreSQL:
   ```bash
   npm run db:seed
   ```
3. Place sign image assets in `scripts/images/` and upload them to Supabase Storage:
   ```bash
   npm run db:upload-images
   ```

### 5. Running Locally
Run the development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🤹 Skill List Used

* **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
* **State Management**: Zustand, TanStack Query
* **Backend as a Service (BaaS)**: Supabase (Auth, PostgreSQL, Storage, RLS)
* **Progressive Web App**: Vite PWA, Workbox, IndexedDB
* **Game Development**: Phaser 3 (2D physics and rendering)
* **Utilities**: PDF generation (jsPDF)

---

## 🎯 Features Implemented

* **Bilingual Translation Engine**: Real-time toggling between English (EN) and Bahasa Malaysia (BM).
* **Defensive Driving & Safety Ethics**: Scenario quizzes highlighting Maqasid al-Shariah values and ethical trade-offs using a custom situational awareness dashboard.
* **Color Vision Ishihara Diagnostic**: Web-based plate tests calculating Deuteranopia, Protanopia, or Tritanopia deficiency types.
* **Offline-First Synchronization**: Automatically caches API responses and uses an IndexedDB write-queue to sync local results back to Supabase once online connectivity resumes.
* **Gamified Driving Simulator**: Interactive 2D driving simulation built with Phaser 3 to practice basic driving controls.
* **Lighthouse Optimized**: Module preloading is disabled for lazy routes to keep the main bundle extremely lightweight, resulting in optimal FCP/LCP load speeds.
