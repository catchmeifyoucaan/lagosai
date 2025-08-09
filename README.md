# Lagos Oracle Ultra

## Deployment notes

- Set Netlify env vars (Vite):
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`

## Firestore security rules (starter)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User root
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // conversations collection: docs keyed by conversationId
      match /conversations/{conversationId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // meta doc storing currentConversationId
      match /meta { allow read, write: if request.auth != null && request.auth.uid == userId; }

      // custom personas merged in a single doc 'all'
      match /customPersonas/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      // Public read-only shared snapshots
      match /shared/{token} {
        allow read: if true; // public readable
        allow write: if request.auth != null; // only signed-in users can create
      }
    }
  }
}
```

## Auth providers
- Google OAuth enabled
- Apple OAuth enabled (ensure Apple provider configured in Firebase console)
- Anonymous sign-in enabled

## Features
- New chat, Library, Search
- Persistent chats (localStorage + Firestore multi-device sync)
- Export/Import library
- Custom personas (local + Firestore sync)
- Onboarding modal
- Header actions: rename/share/delete

## Build

```
npm install
npm run build
```

Then deploy `dist/` or via Netlify UI.
