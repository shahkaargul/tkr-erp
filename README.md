# TKR ERP System 🚀

A modern, fast, and lightweight Point of Sale (POS) and Enterprise Resource Planning (ERP) application built specifically for TKR. This system seamlessly integrates with Google Sheets as a backend, allowing for easy data accessibility, while providing a blazing-fast React frontend for daily operations.

## ✨ Features

- **🛒 Point of Sale (POS)**: Fast and intuitive checkout process. Add items to cart, calculate totals, handle taxes, and process orders instantly.
- **📦 Inventory Management**: Track stock levels, purchase prices, and selling margins. Includes **Bulk CSV Import/Export** to easily update thousands of items at once.
- **👥 Employee Management**: Manage staff, track daily attendance, and calculate salaries.
- **📊 Analytics & Dashboard**: View sales trends, monitor low-stock items, and analyze business performance with interactive charts.
- **⚙️ Settings**: Configure global application settings, including tax rates and backend integrations.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first, responsive design.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) for fast, unopinionated global state, plus React Context.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth micro-interactions and transitions.
- **Charts**: [Recharts](https://recharts.org/) for rendering beautiful analytics dashboards.
- **Icons**: [Lucide React](https://lucide.dev/) for crisp, consistent UI icons.
- **CSV Processing**: [PapaParse](https://www.papaparse.com/) for reliable, in-browser CSV bulk imports and exports.

### Backend & Infrastructure
- **Database**: Google Sheets via Google Apps Script (Custom Fetch setup).
- **Authentication**: Firebase (Integrated for secure access control).

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v16 or higher) installed on your machine.

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd tkr
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the local URL provided by Vite (usually `http://localhost:5173`).

## 📁 Project Structure

```
src/
├── components/      # Reusable UI components (Modals, Spinners, Layouts)
├── config/          # Configuration files (Firebase, Sheets API setup)
├── context/         # React Context providers (DataContext, ToastContext)
├── pages/           # Application views (POS, Inventory, Dashboard, Employees)
├── services/        # API calls and business logic (sheetsApi)
├── store/           # Zustand global state (cart management)
├── utils/           # Helper functions (currency formatting, date formatting)
└── index.css        # Global Tailwind CSS imports
```

## 📝 Usage Guide

### Bulk Importing Inventory
1. Go to the **Inventory** tab.
2. Click **Export CSV** to get a template with your current stock.
3. Open the CSV in Excel or Google Sheets.
4. Add new items (leave `id` blank) or update existing ones (keep the `id` intact).
5. Click **Import CSV** and select your file. The system will sequentially update your database.

### Configuring Google Sheets Backend
The app relies on a Google Apps Script deployment URL. 
- Ensure your Google Sheet is set up with the correct tabs: `Products`, `Orders`, `Employees`, and `Settings`.
- Paste your deployment URL into the app's configuration to link the database.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 

## 📄 License

This project is proprietary and built for TKR operations.
