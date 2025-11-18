GOS Events App (React + Firebase)

What you have
- Authentication (email/password: sign up, login, reset) using Firebase Authentication
- Firestore for: profiles, events, registrations
- Real-time updates via Firestore onSnapshot
- User dashboard to register/unregister and view enrolled events
- Admin panel to create, edit, delete events (role is determined by profile.role === 'admin')
- Loading and error states on forms
- Tailwind responsive UI
- Firestore security rules (public/firebase.rules)

How to configure Firebase
1) Create a Firebase project at https://console.firebase.google.com
2) Enable Authentication → Email/Password
3) Create a Web app and copy config values. Add these to your frontend .env:
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
4) Firestore → Create database in production mode. Upload rules from public/firebase.rules
5) To make an admin: after registering the user once, set the Firestore document at profiles/{uid} with role: 'admin'. You can do it in the Firebase console.

Environment variables
- Frontend uses Vite envs; create .env file with Firebase config.

Data model
- profiles/{uid}: { uid, name, email, role, createdAt }
- events/{eventId}: { title, description, startAt (Timestamp), location, createdAt, updatedAt }
- registrations/{regId}: { uid, eventId, createdAt }

Notes
- Real-time updates are handled via onSnapshot listeners for events and registrations.
- Admin page is access-controlled via profile role. Non-admins can view a friendly message.
- Validation ensures required fields are present when creating events.
