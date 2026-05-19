# Dubai Culture POC

`dc_poc` is an Expo React Native proof of concept for a Dubai Culture-style app. It runs as:

- A web app through Expo or Docker
- A mobile app through Expo Go, Android emulator, or iOS simulator

The app currently uses local mock data from `src/data/mock.ts`. It does not require the platform backend services to start.

## What It Includes

- Home screen with quick links, hero content, featured events, attractions, and news
- Attractions browsing by museums, libraries, heritage sites, and cultural centres
- What's On screens for events and open calls
- Discover/gallery content
- More menu with login, about, e-services, contact, and legal screens
- Local-only sign-in state using AsyncStorage

## Run With Docker

From the repository root:

```powershell
cd C:\Users\Prasad.N\WorkSpace\NodeJsReact\user-mgmt-platform\ump
docker compose up --build dc_poc
```

Open the app:

```text
http://localhost:8083
```

To run it in the background:

```powershell
docker compose up -d --build dc_poc
```

To stop it:

```powershell
docker compose stop dc_poc
```

To rebuild only this app after code changes:

```powershell
docker compose build dc_poc
docker compose up -d dc_poc
```

## Build And Run The Docker Image Manually

From this folder:

```powershell
cd C:\Users\Prasad.N\WorkSpace\NodeJsReact\user-mgmt-platform\ump\dc_poc
docker build -t dubaiculture-poc .
docker run --rm -p 8083:80 dubaiculture-poc
```

Open:

```text
http://localhost:8083
```

## Run Without Docker - Web

Install dependencies:

```powershell
cd C:\Users\Prasad.N\WorkSpace\NodeJsReact\user-mgmt-platform\ump\dc_poc
npm install
```

Start the Expo web dev server:

```powershell
npm run web
```

Expo will print the local web URL in the terminal. If you need port `8083` specifically for local web development:

```powershell
npx expo start --web --port 8083
```

Then open:

```text
http://localhost:8083
```

## Run Without Docker - Mobile

Install dependencies:

```powershell
cd C:\Users\Prasad.N\WorkSpace\NodeJsReact\user-mgmt-platform\ump\dc_poc
npm install
```

Start Expo:

```powershell
npm start
```

Options:

- Scan the QR code with Expo Go on a physical Android or iOS device.
- Press `a` in the Expo terminal to open Android, if an Android emulator is running.
- Press `i` in the Expo terminal to open iOS, if running on macOS with an iOS simulator.

You can also start Android directly:

```powershell
npm run android
```

Or iOS directly on macOS:

```powershell
npm run ios
```

## Notes

- Docker serves the exported web build through Nginx.
- Mobile builds are not produced by Docker. For APK/AAB or iOS IPA builds, add Expo EAS configuration and use EAS Build.
- The app uses remote Unsplash image URLs, so images require network access.
