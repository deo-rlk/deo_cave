# Weekly Hours Planner - Project Documentation

A modern React application for managing and visualizing weekly time allocation through an intuitive interface with real-time data synchronization.

## Overview

Weekly Hours Planner is a web application that helps users track and visualize how they allocate their weekly hours across different tasks and activities. The application provides a visual representation of time distribution using interactive charts, allowing users to maintain a balanced schedule and identify areas where time management can be improved.

**Target Audience**: Professionals, students, freelancers, and anyone who wants to better manage their weekly time allocation and maintain work-life balance.

**Problem Solved**: Traditional time tracking methods often lack visual feedback and real-time synchronization. This application solves these issues by providing an intuitive dashboard with real-time updates and cross-device synchronization.

## Tech Stack

### Frontend
- **React 19.1.0** - Modern JavaScript library for building user interfaces
- **React DOM 19.1.0** - React rendering for web browsers
- **React Scripts 5.0.1** - Configuration and scripts for Create React App

### UI/UX Libraries
- **Chart.js 4.5.0** - JavaScript charting library
- **React Chart.js 2 5.3.0** - React wrapper for Chart.js
- **Plotly.js 3.0.1** - Scientific plotting library
- **React Plotly.js 2.6.0** - React wrapper for Plotly.js
- **Lucide React 0.525.0** - Beautiful & consistent icon toolkit
- **Simplebar 6.3.2** - Custom scrollbar library
- **Simplebar React 3.3.2** - React wrapper for Simplebar

### Authentication & Backend
- **Supabase** - Open-source Firebase alternative
- **@supabase/supabase-js 2.50.2** - Supabase JavaScript client
- **@supabase/auth-ui-react 0.4.7** - Pre-built auth components
- **@supabase/auth-ui-shared 0.1.8** - Shared auth utilities

### Testing
- **@testing-library/react 16.3.0** - React testing utilities
- **@testing-library/jest-dom 6.6.3** - Custom Jest matchers
- **@testing-library/user-event 13.5.0** - User event simulation
- **@testing-library/dom 10.4.0** - DOM testing utilities

### Performance
- **Web Vitals 2.1.4** - Web performance metrics

## Application Architecture

### Architecture Pattern
The application follows a **Component-Based Architecture** with **Custom Hooks** for state management and data fetching. It implements a **Service Layer Pattern** for backend communication.

### Folder Structure

```
src/
├── App.js                 # Main application component
├── App.css               # Main application styles
├── index.js              # Application entry point
├── index.css             # Global styles
├── supabaseClient.js     # Supabase client configuration
├── supabaseService.js    # Custom hooks for data management
├── LoginPage.js          # Authentication component
├── LoginPage.css         # Login page styles
├── TaskList.js           # Task display component
├── TaskList.module.css   # Task list styles (CSS modules)
├── AlternativeApp.js     # Alternative app implementation
└── [other files]         # Testing and utility files
```

### Component Communication
- **App.js** serves as the main container and orchestrates all components
- **Custom Hooks** (`useSupabaseAuth`, `useUserSettings`, `useTasks`) manage state and data fetching
- **Supabase Service** handles all backend communication and real-time subscriptions
- **Components** communicate through props and callback functions
- **Real-time updates** are handled through Supabase subscriptions

## Data Management

### Database: PostgreSQL (Supabase)
The application uses **Supabase** as the backend, which provides a PostgreSQL database with real-time capabilities.

### Database Schema

#### `user_settings` Table
```sql
- id: SERIAL PRIMARY KEY
- user_id: UUID NOT NULL UNIQUE (from Supabase auth)
- total_weekly_hours: INTEGER DEFAULT 40
- theme_id: INTEGER DEFAULT 1
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

#### `tasks` Table
```sql
- id: SERIAL PRIMARY KEY
- user_id: UUID NOT NULL (from Supabase auth)
- name: VARCHAR(255) NOT NULL
- duration: DECIMAL(5,2) NOT NULL
- color: VARCHAR(7) DEFAULT '#3b82f6'
- description: TEXT
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### Database Client
- **Supabase Client** (`@supabase/supabase-js`) is used for all database operations
- **No ORM** - Direct SQL queries through Supabase client
- **Real-time subscriptions** for live data updates

### Data Relationships
- Each user has one `user_settings` record (1:1 relationship)
- Each user can have multiple `tasks` (1:many relationship)
- All data is isolated per user through Row Level Security (RLS)

## Security

### Authentication
- **Google OAuth** integration for secure authentication
- **Supabase Auth** handles all authentication flows
- **JWT tokens** for session management
- **Automatic session persistence** across browser sessions

### Authorization
- **Row Level Security (RLS)** enabled on all tables
- **User-specific data access** - users can only access their own data
- **Policy-based access control** for all CRUD operations

### Security Measures
- **SQL Injection Prevention**: Parameterized queries through Supabase client
- **XSS Prevention**: React's built-in XSS protection
- **CSRF Protection**: Supabase handles CSRF protection
- **Input Validation**: Client-side and server-side validation

### Secrets Management
- **Environment Variables**: All sensitive data stored in `.env` file
- **Supabase Keys**: URL and anonymous key managed through environment variables
- **No hardcoded secrets** in the codebase

## Integrations and APIs

### External APIs
- **Google OAuth API**: For user authentication
- **Supabase API**: For database operations and real-time subscriptions

### Application API Endpoints
The application uses Supabase's auto-generated REST API:

#### Authentication Endpoints
- `POST /auth/v1/token` - Google OAuth token exchange
- `POST /auth/v1/logout` - User logout

#### Database Endpoints (via Supabase Client)
- `GET /rest/v1/user_settings` - Fetch user settings
- `POST /rest/v1/user_settings` - Create/update user settings
- `GET /rest/v1/tasks` - Fetch user tasks
- `POST /rest/v1/tasks` - Create new task
- `PUT /rest/v1/tasks` - Update existing task
- `DELETE /rest/v1/tasks` - Delete task

#### Real-time Subscriptions
- `websocket` - Real-time task updates

## Local Setup and Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Git** for version control
- **Supabase account** for backend services

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd projeto.horas.semanais
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase project**
   - Create a new project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key from Settings > API

4. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Set up database**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the contents of `supabase-setup.sql`

6. **Configure Google OAuth**
   - Follow the instructions in `GOOGLE_SETUP.md`
   - Set up Google OAuth credentials in Google Cloud Console
   - Configure OAuth in Supabase dashboard

7. **Start the development server**
   ```bash
   npm start
   ```

8. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Sign in with Google
   - Start managing your weekly hours!

### Available Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (irreversible)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Development overrides
REACT_APP_DEBUG=true
```

### Environment Variable Descriptions

- `REACT_APP_SUPABASE_URL`: Your Supabase project URL (found in Settings > API)
- `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anonymous key (found in Settings > API)
- `REACT_APP_DEBUG`: Enable debug logging (optional, defaults to false)

## Features

### Core Features
- ✅ **Google OAuth Authentication** - Secure login with Google accounts
- ✅ **Real-time Data Sync** - Changes sync across all devices instantly
- ✅ **Interactive Charts** - Visual representation of time allocation
- ✅ **Theme Customization** - Multiple color themes available
- ✅ **Responsive Design** - Works on desktop and mobile devices
- ✅ **Task Management** - Add, edit, and delete tasks with custom colors
- ✅ **Weekly Hours Tracking** - Set and track total weekly hours
- ✅ **Visual Time Distribution** - Doughnut chart showing time allocation

### Advanced Features
- ✅ **Row Level Security** - Data isolation per user
- ✅ **Automatic User Setup** - User settings created on first login
- ✅ **Real-time Updates** - Live data synchronization
- ✅ **Cross-device Sync** - Data accessible from any device
- ✅ **Modern UI/UX** - Beautiful, intuitive interface
- ✅ **Performance Optimized** - Fast loading and smooth interactions

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Ensure your Google OAuth redirect URI matches your app URL
   - For development: `http://localhost:3000`

2. **Database connection errors**
   - Verify Supabase URL and anon key in `.env`
   - Ensure database tables are created using `supabase-setup.sql`

3. **Authentication issues**
   - Check Google OAuth configuration in Supabase
   - Verify Google Cloud Console settings

4. **Real-time updates not working**
   - Check browser console for WebSocket errors
   - Verify Supabase real-time is enabled

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are set correctly
4. Check that the database tables and policies are created properly
5. Review the `GOOGLE_SETUP.md` file for OAuth configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 