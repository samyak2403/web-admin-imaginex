# ImagineX Web Admin Panel

A web-based admin panel for managing ImagineX app content and monitoring students.

## Features

- **Dashboard Overview**: View total students, lessons, assessments, and average progress
- **Student Management**: View all students, search, edit profiles, view progress
- **Lessons Management**: Add, edit, delete lessons and VR scenarios
- **Assessments Management**: Create and manage assessment levels
- **Notifications**: Send notifications to all or specific students

## Setup

1. **Configure Firebase**
   
   Edit `js/config.js` and replace with your Firebase project configuration:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

2. **Add Admin Emails**
   
   In `js/config.js`, add authorized admin emails:
   ```javascript
   const ADMIN_EMAILS = [
       'admin@imaginex.com',
       'your-email@example.com'
   ];
   ```

3. **Create Admin User in Firebase**
   
   Go to Firebase Console > Authentication > Users and create a user with one of the admin emails.

4. **Run the Admin Panel**
   
   Option 1: Open `index.html` directly in browser (may have CORS issues)
   
   Option 2: Use a local server:
   ```bash
   # Using Python
   python -m http.server 8080
   
   # Using Node.js
   npx serve
   ```
   
   Then open `http://localhost:8080` in your browser.

## Firestore Collections Used

- `users` - Student/user data
- `lessons` - Lessons and VR scenarios
- `assessments` - Assessment levels
- `notifications` - Push notifications
- `student_progress` - Student progress tracking

## Security

Make sure your Firestore rules allow admin access. Example rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

For production, implement proper role-based access control.
