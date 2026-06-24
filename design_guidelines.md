# Status Dashboard & Quick Assist Workflow Design Guidelines

## Design Approach
**System-Based Approach**: Using a productivity-focused design system (Material Design/Fluent) to ensure professional, enterprise-grade appearance suitable for IT support workflows. This prioritizes functionality and clarity over visual flair.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Light mode: 217 91% 60% (professional blue)
- Dark mode: 217 91% 70% (slightly lighter blue)

**Status Colors:**
- Available: 142 76% 36% (green)
- Away: 45 93% 47% (amber)
- Currently Assisting: 0 84% 60% (red)

**Background & UI:**
- Light mode backgrounds: 210 20% 98%
- Dark mode backgrounds: 222 84% 5%
- Card surfaces: Light +2% lightness, Dark +3% lightness

### B. Typography
- **Primary Font**: Inter (Google Fonts)
- **Headers**: 600 weight, sizes from text-lg to text-3xl
- **Body**: 400 weight, text-sm and text-base
- **Status indicators**: 500 weight, text-sm

### C. Layout System
**Spacing Units**: Tailwind units of 2, 4, 6, and 8
- Card padding: p-6
- Section gaps: gap-8
- Element margins: m-4
- Button padding: px-6 py-2

### D. Component Library

**Dashboard Layout:**
- Split-screen design: Status panel (left 1/3) + Workflow panel (right 2/3)
- Fixed status sidebar with real-time status indicator
- Main content area with tab navigation for different workflows

**Key Components:**
- **Status Card**: Large, prominent card with colored status indicator and last updated timestamp
- **Workflow Checklist**: Progressive disclosure with locked/unlocked steps
- **Admin Panel**: Simple form for status updates (admin-only)
- **Step Cards**: Individual workflow steps with checkbox completion
- **Progress Bar**: Shows overall workflow completion
- **Quick Assist Code Form**: Styled input field with copy-to-clipboard functionality

**Authentication:**
- Clean login form with username/password fields
- Session-based auth with role differentiation (admin/user)

**Navigation:**
- Top navigation bar with logout option
- Tab-based navigation within workflow area
- Breadcrumb trail for multi-step processes

### E. Workflow UX Pattern
**Progressive Workflow:**
- Each step must be completed before next unlocks
- Visual feedback for completed steps (checkmarks, green borders)
- Disabled state for locked future steps
- "Continue" button only appears when current step is complete
- Final step includes confirmation dialog

**Status Management:**
- Real-time status updates visible to all users
- Admin controls clearly separated and protected
- Status history/log for reference
- Quick status change buttons for administrators

## Content Strategy
**Two-Panel Approach:**
1. **Status Panel**: Always visible, shows current availability and Quick Assist code input
2. **Workflow Panel**: Step-by-step instructions with completion tracking

**No Images Required**: This is a utility-focused application that relies on clear typography, status indicators, and form elements rather than imagery.

This design prioritizes clarity, workflow efficiency, and professional appearance suitable for IT support environments while maintaining accessibility and usability across different user roles.