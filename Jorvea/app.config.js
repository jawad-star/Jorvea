import 'dotenv/config';

export default {
  expo: {
    name: "Jorvea",
    slug: "Jorvea",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "jorvea",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      googleServicesFile: "./GoogleService-Info.plist",
      supportsTablet: true,
      bundleIdentifier: "com.jawadxdev.Jorvea"
    },
    android: {
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.jawadxdev.Jorvea"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "@react-native-google-signin/google-signin",
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      webClientId: process.env.WEB_CLIENT_ID,
      androidClientId: process.env.ANDROID_CLIENT_ID,
      iosClientId: process.env.IOS_CLIENT_ID,
      muxTokenId: process.env.MUX_TOKEN_ID,
      muxTokenSecret: process.env.MUX_TOKEN_SECRET,
    }
  }
};
