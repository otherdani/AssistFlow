# IT Support Status Dashboard & Quick Assist Workflow

## Overview

This is an IT support dashboard application that provides real-time status monitoring and Microsoft Quick Assist workflow management. The system enables IT technicians to update their availability status and guides customers through a structured remote assistance process. It features a split-screen design with a status display sidebar and a main workflow area for managing support sessions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system following Material Design/Fluent principles
- **State Management**: React Query (TanStack Query) for server state, React Context for global UI state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints with JSON responses
- **Session Management**: In-memory storage with interface for future database integration
- **Development**: Hot reload via Vite middleware integration

### Database Schema
- **Users Table**: Authentication with username/password
- **Sessions Table**: Customer support sessions with workflow step tracking
- **Session Fields**: Customer info, language preference, status, security codes, and step completion flags
- **Status Tracking**: Preparing → Ready → In Progress → Completed workflow

### Authentication & Authorization
- **Authentication**: Mock authentication system (admin/password123)
- **Session Storage**: Browser localStorage for auth state persistence
- **Context Provider**: React Context for authentication state management
- **Route Protection**: Admin routes require authentication

### Design System
- **Theme**: Light/dark mode support with system preference detection
- **Color Palette**: Professional blue primary, semantic status colors (green/amber/red)
- **Typography**: Inter font family with consistent weight hierarchy
- **Components**: Reusable UI components with consistent spacing and elevation
- **Responsive**: Mobile-first design with breakpoint-aware layouts

### Workflow Management
- **Multi-Step Process**: 8-step Microsoft Quick Assist workflow with progress tracking
- **Language Support**: English and Hungarian localization
- **Real-Time Updates**: Polling-based session status updates
- **Security Codes**: Random 6-character code generation for Quick Assist sessions

## External Dependencies

### Core Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **react-hook-form**: Form state management and validation
- **zod**: Runtime type validation and schema definition
- **wouter**: Lightweight client-side routing

### Database & ORM
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-kit**: Database migration and schema management tools

### Development Tools
- **vite**: Frontend build tool and development server
- **tsx**: TypeScript execution for Node.js server
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-***: Replit-specific development plugins

### UI & Styling
- **class-variance-authority**: Type-safe CSS class variants
- **tailwind-merge**: Smart Tailwind class merging utility
- **clsx**: Conditional CSS class composition
- **lucide-react**: Icon library with React components

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **nanoid**: URL-safe unique ID generation
- **embla-carousel-react**: Touch-friendly carousel component