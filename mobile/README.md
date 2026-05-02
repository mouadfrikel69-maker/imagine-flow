# ImagineFlow — Mobile (Android)

The Android app for ImagineFlow, built with **React Native + Expo**.

It mirrors the existing web experience (Text → Image and Image → Text) with a
mobile-first onboarding flow, **Firebase Auth** (Google + email/password), and
a **two-tier daily quota** (6/day for free users, 20/day for users who paste
their own Pollinations API key). All images and captions are stored on the
user's device — no cloud storage costs.

```
mobile/
├── app/                       # expo-router file-based routes
│   ├── index.tsx              # onboarding 1: browser-mockup hero + 4-sec progress
│   ├── onboarding-2.tsx       # onboarding 2: typing animation + Continue
│   ├── (auth)/
│   │   ├── signin.tsx         # Google + email/password + forgot password
│   │   └── forgot.tsx
│   └── (app)/                 # protected routes (require sign-in)
│       ├── dashboard.tsx      # main: both features + upsell popup
│       ├── text-to-image.tsx
│       └── image-to-text.tsx
├── components/                # GradientBackground, BrowserMockup, TypingText, …
├── lib/                       # firebase, api client, auth context, library
├── assets/images/             # onboarding sample images
├── app.config.ts              # dynamic Expo config (reads EXPO_PUBLIC_* env)
└── .env.example               # what env vars to set
```

## 1. Set up Firebase (one-time, ~10 minutes)

1. Go to <https://console.firebase.google.com> and click **Add project**.
   Name it `imagine-flow` (or whatever). Skip Google Analytics if you want.
2. In **Build → Authentication → Sign-in method**, enable:
   - **Email/Password**
   - **Google** — pick a support email and save.
3. In **Build → Realtime Database → Create database**:
   - Pick a region close to your users (e.g. `europe-west1`,
     `us-central1`).
   - Start in **locked mode**.
   - After it provisions, copy the **database URL** at the top of the
     page — it will look like
     `https://<project>-default-rtdb.firebaseio.com` or
     `https://<project>-default-rtdb.<region>.firebasedatabase.app`. You'll
     paste it as `FIREBASE_DATABASE_URL` on Render.
   - Open the **Rules** tab and paste:
     ```json
     {
       "rules": {
         ".read": false,
         ".write": false
       }
     }
     ```
     The mobile app talks to RTDB via the FastAPI backend (which uses the
     Admin SDK and bypasses these rules), so we deny direct client
     access. Adjust later if you ever go client-direct.

   > **Why Realtime Database, not Firestore?** Since late 2024 Google
   > Cloud requires billing to be enabled to *create* a Firestore
   > database, even on Firebase's free Spark plan. Realtime Database is
   > unaffected and stays fully free on Spark. The data shape this app
   > needs (per-uid profile + per-uid-per-day counter) maps cleanly to
   > RTDB's tree.
4. In **Project settings → General**, scroll to **Your apps**, click the
   web icon (`</>`), register an app called `ImagineFlow`. Copy the
   `firebaseConfig` values — you'll paste them into `.env` below.
5. In **Project settings → Service accounts**, click **Generate new
   private key**. A JSON file downloads. **Don't commit this file.** Open it
   and copy its entire JSON content as a single line — that's your
   `FIREBASE_SERVICE_ACCOUNT_JSON` for the backend.

### Google sign-in client IDs

Firebase auto-creates an OAuth client. Find it in **Project settings → General
→ Web SDK configuration → SDK setup and configuration**, or open the
[Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
page for your project. Copy the **Web client ID** — that's
`EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID`.

For the standalone APK (later), you'll also need an Android client ID with
your app's SHA-1 fingerprint. Skip for now and just use Expo Go.

## 2. Configure the mobile app

```bash
cd mobile
cp .env.example .env
# fill in the values from your Firebase project
```

## 3. Install + run

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your Android phone. The app reloads on
save.

## 4. Build a real APK (when you're ready to ship)

Use [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm i -g eas-cli
eas login
eas build:configure
eas build --profile preview --platform android
```

EAS gives you a downloadable `.apk`. To upload to Google Play, switch to
`--profile production` (which builds an `.aab`) and add a Play Console listing.

## How auth + the two-tier quota fit together

The "logic" the user originally asked about lives in three places:

1. **Mobile app** — `lib/auth.tsx` signs the user in with Firebase, then
   `lib/api.ts` attaches the resulting Firebase ID token to every API call as
   `Authorization: Bearer <token>`.
2. **Backend** — `app/auth.py` verifies that token with the Firebase Admin
   SDK, then loads the user's `user_profiles/{uid}` node from Realtime
   Database. The node carries `auth_method` (one of `google`, `email`,
   `pollinations`) and an encrypted `pollinations_api_key` (for tier-2
   users).
3. **Routing** — `app/routers/v2.py::pick_key()` is the ~3-line core:
   ```python
   def pick_key(user):
       if user.auth_method != "pollinations" or not user.pollinations_api_key:
           return DEV_POLLINATIONS_API_KEY        # 6/day
       return decrypt_key(user.pollinations_api_key)  # 20/day
   ```
   The daily counter (`daily_usage/{uid}/{YYYY-MM-DD}` in Realtime
   Database) blocks the request with HTTP 429 once the user hits their
   tier's limit. Reads/increments use RTDB transactions so concurrent
   requests can't slip past the cap.

## How upgrades work

A user signs up with Google → starts at 6/day → sees an in-app popup +
dashboard upsell card → taps "Get my free key" → grabs a Pollinations key →
pastes it back → backend validates with a real ping to Pollinations → Fernet-
encrypts and stores it → flips `auth_method` to `pollinations` → instantly on
20/day. No re-signup, no re-login.

## License

MIT
