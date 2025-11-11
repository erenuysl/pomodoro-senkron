# Social Focus - Pomodoro Timer & Group Study App

A collaborative Pomodoro timer application with real-time group activity tracking, built with React, Firebase, and Tailwind CSS.

## Features

- 🎯 **Adjustable Pomodoro Timer** - Rotate the timer dial to set duration (5-60 minutes)
- 👥 **Group Study Sessions** - Create or join study groups with invite codes
- 📊 **Real-time Activity Tracking** - See group members' progress in real-time
- 🔔 **Notifications & Alerts** - Sound, vibration, and visual alerts when timer completes
- 📱 **Background Support** - Timer continues running even when app is in background
- 🔒 **Secure Inputs** - XSS and injection protection on all user inputs
- 🌙 **Dark Theme** - Modern, eye-friendly dark interface

## Tech Stack

- **Frontend:** React 19, Tailwind CSS, Framer Motion
- **Backend:** Firebase (Firestore, Realtime Database, Authentication)
- **Build Tool:** Vite
- **PWA Support:** Offline capability with service workers

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd social-focus
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Google Sign-in)
3. Create Firestore Database
4. Create Realtime Database
5. Copy your Firebase configuration

### 4. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com
```

### 5. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 6. Build for production

```bash
npm run build
```

## Security Features

- ✅ Environment variables for sensitive data
- ✅ Input sanitization (XSS protection)
- ✅ SQL injection prevention
- ✅ Maximum length validation
- ✅ Secure Firebase rules (configure in Firebase Console)

## Firebase Security Rules

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /groups/{groupId} {
      allow read: if request.auth != null && 
                     request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                       request.auth.uid in resource.data.members;
      
      match /sessions/{sessionId} {
        allow read: if request.auth != null && 
                       request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
        allow create: if request.auth != null && 
                         request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
      }
    }
  }
}
```

### Realtime Database Rules

```json
{
  "rules": {
    "status": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
