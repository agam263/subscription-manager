# Subscription Management System (SubManager)

An immersive, full-stack web application designed to help users aggregate, analyze, and manage their recurring expenses and subscriptions. By unifying tracking with real-time multi-currency support, intuitive analytics, and a futuristic glassmorphic UI, **SubManager** ensures you never lose track of your digital expenses.

## 🌟 Application Showcase

Below is a detailed walkthrough of the primary pages in the application.

### 1. Landing Page
Welcome to SubManager! The Landing Page features a stunning, animated interface that introduces the platform's capabilities with dynamic, hovering subscription cards and sleek typography.

<img width="1679" height="928" alt="Screenshot 2026-04-08 at 8 27 25 PM" src="https://github.com/user-attachments/assets/e5e7dddc-392d-40f7-870a-50a5321ba67c" />


### 2. Login & Registration Page
Secure access to your dashboard. This page provides a seamless authentication flow for both new user registrations and returning users.

![Login Page Screenshot](INSERT_LOGIN_PAGE_IMAGE_URL_HERE)

### 3. Dashboard
The core of the application. The Dashboard aggregates your spending data into beautiful, interactive charts. It highlights monthly/yearly spending trends, categorizes your expenses, and identifies your most recently paid or upcoming subscriptions.

![Dashboard Screenshot](INSERT_DASHBOARD_IMAGE_URL_HERE)

### 4. Subscription Page
A comprehensive catalog of all your active, trial, or cancelled subscriptions. You can filter, sort, and search your subscriptions, making it easy to manage your financial portfolio.

![Subscription Page Screenshot](INSERT_SUBSCRIPTION_PAGE_IMAGE_URL_HERE)

### 5. Add Subscription Page
An intuitive interface to add new subscriptions. Track your plan details, billing cycle, renewal dates, associated categories, and payment methods.

![Add Subscription Page Screenshot](INSERT_ADD_SUBSCRIPTION_PAGE_IMAGE_URL_HERE)

---

## 🚀 Core Features

- **Subscription Tracking**: Add, edit, and organize active subscriptions alongside their continuous billing cycles.
- **Currency Conversion**: Seamlessly track expenses across different global currencies (e.g., USD, EUR, CNY, GBP).
- **Exchange Rate API Integration**: Automatically fetches real-time exchange rates to provide up-to-date cost estimations without requiring manual input.
- **Dashboard Analytics**: Visualize monthly and yearly spending trends, categorized cost breakdowns, and upcoming renewal timelines through interactive charts.
- **Notifications**: Automated alerts and reminders for upcoming renewals to prevent accidental or unwanted charges.
- **AI Chatbot Assistant**: Specialized chatbot to help answer queries regarding specific subscriptions or provide financial insights.

## 🛠 Tech Stack

This project leverages a modern, decoupled full-stack architecture:
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Zustand (for state management)
- **Backend**: Node.js, Express.js
- **Database**: SQLite (lightweight, zero-configuration SQL database engine for robust local data handling)
- **AI Integration**: Python-based AI agent via REST API

## 💻 Installation Steps

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Python 3.x** (optional, for AI assistant features)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/agam263/subscription-manager.git
   cd subscription-manager
   ```

2. **Install dependencies**
   First, install the frontend dependencies in the root directory:
   ```bash
   npm install
   ```
   Next, install the backend dependencies:
   ```bash
   cd server
   npm install
   ```

3. **Run the Backend**
   Open a terminal window and start the Express server (starts on `http://localhost:3001`):
   ```bash
   cd server
   npm start
   ```

4. **Run the Frontend**
   Open a second terminal window in the project root and start the React Vite server (starts on `http://localhost:5173`):
   ```bash
   npm run dev
   ```
   *Access `http://localhost:5173` in your browser to view the application.*

## 📂 Folder Structure
```text
subscription-manager/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components and system layout
│   ├── pages/              # Primary application views (Dashboard, Settings, etc.)
│   ├── store/              # Client-side state management (Zustand)
│   ├── utils/              # Helper functions, formatters, and API clients
│   └── App.tsx             # Main React application routing and entry point
├── server/                 # Backend Node.js/Express application
│   ├── controllers/        # Request handling logic mapping
│   ├── routes/             # REST API endpoint routing definitions
│   ├── services/           # Core business logic (exchange rate fetching, schedulers)
│   ├── db/                 # SQLite database and migrations
│   └── server.js           # Main Express server configuration and entry point
├── docs/                   # Documentation and architecture references
├── public/                 # Static assets (images, icons)
└── package.json            # Project dependencies and scripts
```

## 🔮 Future Improvements
- **Bank API Synchronization**: Direct integration with financial institutions via Plaid or similar services to auto-sync bank transactions.
- **Automated Email Receipt Parsing**: Implementation of email scanning to automatically discover, categorize, and add new subscriptions from digital receipts.
- **Machine Learning Categorization**: AI-driven predictive insights on subscription usage, highlighting potential waste and unused services.
- **Advanced Exporting**: Capability to export financial data to CSV, PDF, and popular accounting software formats.
