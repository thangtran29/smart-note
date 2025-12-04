# Feature: Authentication

## Overview
User authentication system using Supabase Auth for secure signup, login, and logout functionality.

## Tech Stack
- **Auth Provider:** Supabase Auth
- **Framework:** Next.js (App Router)
- **UI:** shadcn/ui + Tailwind CSS

## Requirements

### Functional
- User signup with email/password
- User login with email/password
- User logout
- Protected routes (redirect unauthenticated users)
- Session persistence across browser refresh
- Password reset via email

### Non-Functional
- Secure token storage
- Row-Level Security (RLS) integration
- Server-side session validation

## Database

### profiles table
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## User Stories
1. As a user, I can sign up with email and password
2. As a user, I can log in to access my notes
3. As a user, I can log out securely
4. As a user, I can reset my password if forgotten
5. As a visitor, I am redirected to login when accessing protected pages

## Pages
- `/login` - Login form
- `/signup` - Registration form
- `/forgot-password` - Password reset request
- `/` - Protected dashboard (redirects if not authenticated)

## Acceptance Criteria
- [ ] Signup creates user in Supabase Auth + profiles table
- [ ] Login returns valid session
- [ ] Logout clears session
- [ ] Protected routes redirect to /login
- [ ] Error messages displayed for invalid credentials
