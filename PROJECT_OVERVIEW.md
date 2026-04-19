# Wellify Project Overview

## What This Project Does
Wellify is a wellness web application for individuals and admins.
It helps users assess their well-being, track trends, get recommendations, and book wellness consultations.
Admins can monitor organization-level wellness and manage user data safely.

## Core Goals
- Collect wellness inputs (physical, mental, emotional)
- Calculate wellness scores and trends
- Show personalized recommendations
- Allow consultation booking
- Provide admin tools for user and booking management

## Main User Roles
### 1. User
- Sign in and access wellness features
- Complete assessments
- View dashboard and recommendations
- Book consultation slots
- View profile progress/history

### 2. Admin
- Access all user features
- View all users and filter/search them
- Promote users to co-admin
- Remove admin access (with role safeguards)
- Delete selected user data types (scores/history/bookings)
- Delete full user account
- View removed users history
- View organization booking list and apply filters

## Primary App Flows
### Assessment Flow
1. User completes wellness form
2. App computes Physical, Mental, Emotional, and Overall scores
3. Scores are saved with timestamp
4. Dashboard and recommendations update from latest assessment

### Booking Flow
1. User selects consultant and slot
2. Booking is saved with date/time and metadata
3. User/admin can see booking records

### Admin Management Flow
1. Admin opens users panel
2. Searches/filters users
3. Runs actions (promote, demote, selective data deletion, full account deletion)
4. Important actions are confirmed via centered in-app modal
5. Deleted accounts are tracked in removal history

## Pages/Modules Included
- Login page
- Home page
- Assessment page
- Dashboard page
- Appointment booking page
- Blog page
- Profile page
- Admin users page
- Admin booked slots page
- Shared Navbar and Chatbot components

## Routing Summary
- Public entry: `/login`
- Protected routes: `/`, `/assessment`, `/dashboard`, `/appointment`, `/blog`, `/profile`
- Admin-only routes: `/admin/users`, `/admin/booked-slots`

## Data & Storage Model
The app currently uses browser localStorage (no backend API required for current behavior).

Key storage groups:
- Current session/user state
- User accounts list
- Per-user scores/history/bookings
- Removed users audit history

## Tech Stack
- React (Create React App)
- React Router
- Chart.js + react-chartjs-2
- Custom CSS styling
- LocalStorage persistence

## Security/Architecture Notes
- This is a frontend-first implementation using localStorage
- Great for demos/prototypes and controlled environments
- For production scale, move auth/data to backend services and secure storage

## Run Commands
- `npm start` for development
- `npm run build` for production build
- `npm test` for tests

## Current Outcome
The project is a complete wellness platform prototype with working end-user flows and robust admin operations, including selective data controls and booking visibility across users.
