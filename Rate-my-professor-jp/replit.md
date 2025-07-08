# Japanese Professor Review Platform

## Overview

This is a full-stack web application for rating and reviewing university professors in Japan. The platform allows students to search for professors, view detailed ratings, and submit reviews. The application features a modern React frontend with Express.js backend, using PostgreSQL for data storage and Drizzle ORM for database management.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom Japanese academic theme
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js for anonymous review submission
- **Data Storage**: Persistent storage using @replit/database with JSON file backup
- **Privacy**: No IP tracking, user-agents, or identifying data collection
- **Anonymous Submissions**: All reviews stored with timestamp only
- **Development**: Simple Express server serving static files from public folder
- **Persistence**: Reviews persist across server restarts using Replit's database module

### Database Schema
The application uses three main entities:
- **Universities**: Store university information with name translations
- **Professors**: Store professor details with aggregated ratings
- **Reviews**: Store individual student reviews with ratings

## Key Components

### Data Models
- Universities table with Japanese and English names
- Professors table with department, university relationship, and calculated ratings
- Reviews table with course-specific feedback and multi-dimensional ratings
- Automatic rating aggregation system for professors

### Security Features
- Comprehensive XSS protection with input sanitization functions
- Content Security Policy (CSP) headers to prevent code injection
- Input validation with length limits and suspicious pattern detection
- HTML entity encoding for all user-generated content display
- Attribute sanitization for onclick handlers and dynamic attributes
- Client-side rate limiting system preventing rapid submission abuse
- LocalStorage-based 30-second cooldown between review submissions
- Visual feedback with countdown timers on submit buttons

### API Endpoints
- `POST /submit-review` - Submit anonymous review (university, professor, or add-professor)
- `GET /reviews` - View all submitted reviews (optional endpoint)
- Static file serving from `/public` directory for HTML, CSS, and JavaScript files

### UI Features
- Responsive design with mobile-first approach
- Japanese/English bilingual support
- Star rating components with half-star precision
- Advanced search with university and department filters
- Real-time form validation with Zod schemas
- Toast notifications for user feedback
- Admin dashboard with site statistics and analytics
- Automatic site visit tracking for homepage analytics

## Data Flow

1. **Search Flow**: Users search for professors using the search component, which filters by name, university, and department
2. **Professor Details**: Clicking on a professor shows detailed information including all reviews and aggregated ratings
3. **Review Submission**: Users can submit reviews through a form that validates data and updates professor ratings
4. **Rating Calculation**: The system automatically recalculates professor ratings when new reviews are added

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management
- **@hookform/resolvers**: Form validation integration
- **wouter**: Lightweight routing library

### UI Dependencies
- **@radix-ui/***: Accessible UI primitive components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

### Development Dependencies
- **typescript**: Type safety across the stack
- **vite**: Fast build tool and dev server
- **tsx**: TypeScript execution for server
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- Uses Replit with Node.js 20 and PostgreSQL 16 modules
- Vite dev server with HMR on port 5000
- Automatic database migrations with Drizzle Kit
- Environment variables for database connection

### Production Build
- Vite builds frontend to `dist/public`
- esbuild bundles server code to `dist/index.js`
- Static file serving through Express
- Autoscale deployment target on Replit

### Database Management
- Drizzle Kit for schema migrations
- Connection pooling through Neon serverless driver
- Automatic schema validation and type generation

## Changelog

```
Changelog:
- June 25, 2025. Initial setup
- June 25, 2025. Fixed data inconsistency between React app and HTML/JS files
- June 25, 2025. Updated app name to "楽単ドットコム"
- June 25, 2025. Changed difficulty rating to "楽単度" and strictness to "自由度"
- June 25, 2025. Made review comments optional with "(任意)" labels
- June 25, 2025. Added grade field with "(予想でも可)" option
- June 28, 2025. Moved "Add Professor" button to footer with proper spacing
- June 28, 2025. Implemented comprehensive XSS protection with input sanitization
- June 28, 2025. Added client-side rate limiting system with 30-second cooldown between submissions
- June 28, 2025. Implemented statistics system with admin dashboard, site tracking, and analytics endpoints
- June 28, 2025. Switched to Express-based server.js with JSON file storage for anonymous review submissions
- June 28, 2025. Updated rate limiting system to use separate 30-second timers for each submission type (university, professor, add-professor)
- June 28, 2025. Added SEO improvements: meta description, favicon (SVG and ICO), and structured data (JSON-LD) for better search engine visibility
- June 28, 2025. Implemented persistent storage using @replit/database to prevent data loss on page refresh, reviews now persist across server restarts
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```