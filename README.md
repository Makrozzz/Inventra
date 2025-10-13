# Inventra - Full-Stack Asset Management System

A comprehensive full-stack asset management system built with React frontend and Node.js/Express backend for complete asset lifecycle tracking, user management, and enterprise-grade operations.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61DAFB.svg)
![Node](https://img.shields.io/badge/Node-16+-339933.svg)
![Express](https://img.shields.io/badge/Express-4.x-000000.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Inventra is a full-featured asset management system designed for companies that lease equipment to clients and need to track assets, manage projects, and maintain equipment schedules. The system provides a clean, intuitive interface for managing all aspects of your asset lifecycle.

### Key Capabilities
- **Asset Tracking**: Complete inventory management with search, filter, and categorization
- **Project Management**: Client project tracking with support levels and asset assignments
- **Preventive Maintenance**: Bi-annual maintenance scheduling and tracking system
- **Dashboard Analytics**: Real-time insights into assets, customers, and device distribution
- **User Management**: Comprehensive account settings and preferences

## ✨ Features

### 🏠 Dashboard (Default Landing Page)
- **Asset & Customer Statistics**: Real-time counts and metrics
- **Device Analytics Chart**: Visual distribution of devices by customer
- **Recent Assets Overview**: Quick access to latest asset entries
- **Modern UI Cards**: Professional stat cards with icons and hover effects

### 📋 Project Management
- **Project Portfolio View**: Card-based layout displaying all active projects
- **Client Information**: Comprehensive client details and contact management
- **Post-Support Tracking**: Support level management (Basic, Standard, Premium, Extended)
- **Asset Assignment**: Track which assets are deployed to each project
- **Status Management**: Color-coded project status (Active, In Progress, Planning, Completed)
- **Timeline Tracking**: Project start/end dates with duration calculations

### 📦 Asset Management (Previously Inventory)
- **Complete Asset Registry**: All company-owned assets in one location
- **Advanced Search & Filtering**: Multi-criteria filtering by name, category, status, location
- **Import/Export Functionality**: CSV import and export for bulk operations
- **Asset Lifecycle Tracking**: Purchase value, current value, depreciation
- **Location Management**: Track asset locations and movements
- **Category Organization**: Organize assets by type (Electronics, Furniture, etc.)
- **Status Monitoring**: Active, Maintenance, Inactive status tracking

### 🔧 Preventive Maintenance System
- **Bi-Annual Scheduling**: Automatic maintenance scheduling twice yearly
- **Smart Dashboard**: Overview of scheduled, overdue, and completed maintenance
- **Priority Management**: High, Medium, Low priority classification
- **Technician Assignment**: Assign and track maintenance technicians
- **Maintenance Checklists**: Detailed task lists for each maintenance type
- **Timeline Alerts**: Visual warnings for upcoming and overdue maintenance
- **Customer Integration**: Link maintenance to customer assets and contracts

### ⚙️ Account Settings
- **Profile Management**: Personal and company information management
- **Security Center**: Password changes and two-factor authentication
- **Notification Preferences**: Customizable alert settings for maintenance, assets, and system updates
- **Theme Customization**: Light/dark mode, accent colors, and layout preferences
- **User Preferences**: Compact mode, sidebar settings, and display options

## 🏗️ System Architecture

### Frontend Stack
- **React 18.x**: Modern React with functional components and hooks
- **React Router**: Client-side routing for SPA navigation
- **Lucide React**: Modern icon library for consistent UI elements
- **CSS3**: Custom CSS with modern design patterns and responsive layouts

### Component Structure
```
src/
├── components/
│   └── Sidebar.js           # Main navigation sidebar
├── pages/
│   ├── Dashboard.js         # Landing page with analytics
│   ├── Projects.js          # Project management interface
│   ├── Assets.js            # Asset management system
│   ├── PreventiveMaintenance.js  # Maintenance scheduling
│   ├── AccountSettings.js   # User settings and preferences
│   ├── Login.js            # Authentication interface
│   ├── AddAsset.js         # Asset creation form
│   └── EditAsset.js        # Asset modification form
├── App.js                   # Main application component
├── index.js                # Application entry point
└── index.css               # Global styles and theme
```

### Data Management
- **State Management**: React useState and useEffect hooks
- **Mock Data**: Comprehensive sample data for development and testing
- **Local Storage Ready**: Prepared for localStorage integration
- **API Ready**: Structured for easy backend integration

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Makrozzz/Inventra.git
   cd Inventra
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Access the Application**
   - Open your browser to `http://localhost:3000`
   - Login with any credentials (authentication is currently mock)

### Build for Production
```bash
npm run build
```

## 📖 Usage Guide

### Getting Started
1. **Login**: Use any username/password (currently mock authentication)
2. **Dashboard**: Review your asset and customer statistics
3. **Navigation**: Use the sidebar to navigate between different sections

### Managing Assets
1. **View Assets**: Click "Assets" in the sidebar
2. **Add New Asset**: Click "Add New Asset" button
3. **Search & Filter**: Use the search bar and filter dropdowns
4. **Import Data**: Use "Import CSV" for bulk asset uploads
5. **Export Data**: Use "Export CSV" to download asset data

### Project Management
1. **View Projects**: Click "Projects" in the sidebar
2. **Project Details**: Each card shows client info, timeline, and asset count
3. **Status Tracking**: Projects are color-coded by status
4. **Support Levels**: Track post-project support commitments

### Maintenance Scheduling
1. **Access Maintenance**: Click "Preventive Maintenance" in sidebar
2. **View Dashboard**: See scheduled, overdue, and completed maintenance
3. **Priority Management**: High priority items are highlighted
4. **Technician Tracking**: See assigned technicians and estimated duration
5. **Checklist Management**: Review maintenance task lists

### User Settings
1. **Profile Settings**: Update personal and company information
2. **Security**: Change passwords and enable two-factor authentication
3. **Notifications**: Customize email and system notifications
4. **Appearance**: Adjust theme, colors, and layout preferences

## 📁 Project Structure

```
inventra/
├── public/
│   ├── index.html          # Main HTML template
│   └── logo.png           # Application logo
├── src/
│   ├── components/
│   │   ├── Navbar.js      # Legacy navbar (replaced by Sidebar)
│   │   └── Sidebar.js     # Main navigation sidebar
│   ├── pages/
│   │   ├── Dashboard.js         # Analytics dashboard
│   │   ├── Projects.js          # Project management
│   │   ├── Assets.js           # Asset management (renamed from Inventory)
│   │   ├── PreventiveMaintenance.js  # Maintenance system
│   │   ├── AccountSettings.js   # User preferences
│   │   ├── Login.js            # Authentication
│   │   ├── AddAsset.js         # Asset creation
│   │   └── EditAsset.js        # Asset editing
│   ├── App.js             # Main application component
│   ├── index.js          # Application entry point
│   └── index.css         # Global styles and responsive design
├── package.json          # Project dependencies and scripts
└── README.md            # This file
```

## 🔄 Recent Changes

### Major Redesign (September 2024)

#### 🎨 **UI/UX Overhaul**
- **Sidebar Navigation**: Replaced top navbar with professional left sidebar
- **Modern Design Language**: Implemented card-based layouts with shadows and hover effects
- **Responsive Design**: Added mobile-responsive breakpoints and layouts
- **Color Scheme Update**: Professional blue gradient theme with improved contrast
- **Typography**: Enhanced font hierarchy and spacing

#### 🏗️ **Architecture Changes**
- **Component Restructure**: Reorganized from navbar-based to sidebar-based navigation
- **Page Layout**: Implemented new `app-layout` with `main-content` structure
- **Routing Update**: Added new routes for projects, maintenance, and settings
- **State Management**: Centralized asset state in App.js with proper prop drilling

#### 📊 **New Features Added**

**Dashboard Enhancements:**
- Real-time statistics cards with icons
- Customer device distribution chart
- Recent assets table with improved styling
- Quick action buttons

**Project Management System:**
- Complete project lifecycle tracking
- Client relationship management
- Post-support level tracking
- Status-based color coding
- Asset assignment to projects

**Enhanced Asset Management:**
- Renamed from "Inventory" to "Assets" for clarity
- Advanced search with multiple filter criteria
- CSV import/export functionality
- Asset depreciation tracking
- Location-based organization
- Category management system

**Preventive Maintenance System:**
- Bi-annual maintenance scheduling
- Priority-based task management
- Technician assignment system
- Maintenance checklist management
- Timeline tracking with alerts
- Customer integration

**Account Settings:**
- Tabbed interface (Profile, Security, Notifications, Appearance)
- Password management with visibility toggles
- Two-factor authentication options
- Notification preference center
- Theme customization options

#### 🔧 **Technical Improvements**
- **Performance**: Optimized rendering with proper React patterns
- **Accessibility**: Added proper ARIA labels and keyboard navigation
- **Code Organization**: Separated concerns with dedicated page components
- **CSS Architecture**: Modular CSS with component-specific styles
- **Error Handling**: Improved error states and user feedback
- **Data Structure**: Enhanced mock data with realistic relationships

#### 📱 **Responsive Design**
- **Mobile-First**: Responsive breakpoints for all screen sizes
- **Sidebar Collapse**: Mobile-friendly navigation patterns
- **Grid Layouts**: Flexible grid systems for different content types
- **Touch-Friendly**: Improved button sizes and touch targets

### Authentication System
- **Mock Authentication**: Simple login system for development
- **Session Management**: Basic session handling
- **Protected Routes**: Route protection for authenticated users

### Data Management
- **Mock Data Enhancement**: Comprehensive sample data across all modules
- **State Management**: React hooks for local state management
- **Data Relationships**: Proper linking between assets, projects, and maintenance

## 🚦 Development Status

### ✅ Completed Features
- [x] Responsive sidebar navigation
- [x] Dashboard with analytics
- [x] Complete asset management system
- [x] Project management interface
- [x] Preventive maintenance scheduling
- [x] User account settings
- [x] Modern UI/UX design
- [x] Mock authentication system
- [x] CSV import/export functionality
- [x] Search and filtering systems

### 🔄 In Development
- [ ] Backend API integration
- [ ] Real user authentication
- [ ] Database connection
- [ ] Real-time notifications
- [ ] Advanced reporting features

### 🎯 Future Enhancements
- [ ] Role-based access control
- [ ] Advanced analytics and reporting
- [ ] Mobile application
- [ ] Integration with external systems
- [ ] Automated maintenance scheduling
- [ ] Barcode/QR code scanning
- [ ] Document management system
- [ ] Audit trail and logging

## 🤝 Contributing

We welcome contributions to improve Inventra! Please follow these steps:

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/AmazingFeature`
3. **Commit Changes**: `git commit -m 'Add some AmazingFeature'`
4. **Push to Branch**: `git push origin feature/AmazingFeature`
5. **Open Pull Request**

### Development Guidelines
- Follow React best practices and hooks patterns
- Maintain responsive design principles
- Add proper error handling and user feedback
- Update documentation for new features
- Test across different browsers and devices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 📞 Support

For support and questions:
- **Repository Issues**: [GitHub Issues](https://github.com/Makrozzz/Inventra/issues)
- **Documentation**: This README and inline code comments
- **Developer**: Contact repository maintainer

---

**Built with ❤️ using React.js**

*Inventra - Simplifying Asset Management for Modern Businesses*