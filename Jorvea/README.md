# Jorvea - React Native/Expo App 🚀

A modern React Native application built with Expo Router, Firebase Authentication, and TypeScript.

## ✨ Features

- 🔐 Firebase Authentication (Email/Password + Google OAuth)
- 📱 Cross-platform (iOS & Android)
- 🎯 Type-safe with TypeScript
- 🗂️ Organized project structure
- 🔄 Expo Router for navigation
- 🎨 Clean UI components

## 🏗️ Project Structure

```
Jorvea/
├── app/                     # Expo Router pages
├── src/                     # Source code
│   ├── components/          # Reusable components
│   ├── screens/            # Screen components
│   ├── services/           # Business logic & APIs
│   ├── hooks/              # Custom React hooks
│   ├── config/             # App configuration
│   ├── utils/              # Utility functions
│   ├── constants/          # App constants
│   └── types/              # TypeScript types
├── assets/                 # Images, fonts, etc.
└── android/               # Android native code
```

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed documentation.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Set up environment variables
   
   Create a `.env` file in the project root:
   ```
   WEB_CLIENT_ID=your_google_client_id_here
   ```

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
