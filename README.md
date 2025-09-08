# YCCC Clever SIS Management System

A web application for managing users and classes in Clever SIS for York County Community College.

## Features

- Secure authentication
- Add/remove users
- Manage classes and enrollments
- SFTP integration with Clever
- Real-time sync status

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (see `.env.example`)
4. Run the application: `npm start`

## Environment Variables

Create a `.env` file with the following:

```
CLEVER_CLIENT_ID=your_clever_client_id
CLEVER_CLIENT_SECRET=your_clever_client_secret
SFTP_HOST=sftp.clever.com
SFTP_USERNAME=resolute-student-6562
SFTP_PASSWORD=your_sftp_password
SFTP_PORT=22
SESSION_SECRET=your_session_secret
PORT=3000
```

## API Endpoints

- `POST /auth/login` - Authenticate user
- `GET /api/users` - List all users
- `POST /api/users` - Add new user
- `DELETE /api/users/:id` - Remove user
- `GET /api/classes` - List all classes
- `POST /api/classes` - Add new class
- `DELETE /api/classes/:id` - Remove class
- `POST /api/sync` - Trigger sync with Clever

## File Structure

```
├── public/          # Static files
├── src/
│   ├── routes/      # Express routes
│   ├── services/    # Business logic
│   ├── models/      # Data models
│   └── utils/       # Utility functions
├── views/           # HTML templates
└── package.json
```