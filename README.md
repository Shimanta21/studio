# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Connecting to Firebase

To connect the application to your Firebase project, you need to provide your project's credentials.

1.  **Go to the Firebase Console**: Open [https://console.firebase.google.com/](https://console.firebase.google.com/) in your browser.
2.  **Select your Project**: Choose the Firebase project you are using for this app.
3.  **Go to Project Settings**: Click the gear icon (⚙️) next to "Project Overview" in the top-left corner, and then select "Project settings".
4.  **Find Your Web App**: In the "Your apps" section, look for your web app. If you don't have one, click the web icon (`</>`) to create one.
5.  **Copy Configuration**: In your web app's settings, find the "SDK setup and configuration" section and select "Config". You will see a `firebaseConfig` object with several key-value pairs.
6.  **Update `.env` file**: Copy the values from the `firebaseConfig` object and paste them into the `.env` file in your project. The file has already been created for you with the correct variable names.

Example of what to copy from Firebase:
```javascript
const firebaseConfig = {
  apiKey: "AIza....",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:12345..."
};
```

## Initializing Firestore Database

Before your app can store and retrieve data, you must create the Firestore database instance in your Firebase project.

1.  **Go to Firebase Console**: Navigate to your project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
2.  **Open Firestore**: In the left-hand navigation menu, under **Build**, click on **Firestore Database**.
3.  **Create Database**: Click the **Create database** button.
4.  **Start in Test Mode**: You will be prompted to set up security rules. For development, select **Start in test mode**. This will allow your application to read and write to the database without any restrictions. Click **Next**.
5.  **Choose a Location**: Select a Cloud Firestore location. Choose a region that is geographically close to you and your users. Click **Enable**.

Once the database is created, your application will be able to connect to it. The first time you run the app, it will automatically populate the database with sample data.

## Creating a User for Login

Since this is a single-user application without a public sign-up page, you need to create your user credentials directly in the Firebase console.

1.  **Go to Firebase Console**: Navigate to [https://console.firebase.google.com/](https://console.firebase.google.com/) and select your project.
2.  **Open Authentication**: In the left-hand navigation menu, under "Build", click on **Authentication**.
3.  **Go to the Users Tab**: Inside the Authentication section, make sure you are on the **Users** tab.
4.  **Add User**: Click the **Add user** button.
5.  **Enter Credentials**: A dialog box will appear. Enter the **email** and a secure **password** that you will use to log into the application.
6.  **Confirm**: Click **Add user** to create the account.

Once the user is created, you can use these credentials on the application's login page.
