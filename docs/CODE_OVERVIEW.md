
# PantryPal: Code Flow and Architecture Overview

This document provides a detailed, step-by-step explanation of the PantryPal application's code flow. It covers user authentication, core application features, AI-powered interactions, and backend automation.

**Tech Stack:**
- **Frontend:** Next.js (with App Router), React, TypeScript
- **UI:** ShadCN UI, Tailwind CSS, Lucide Icons
- **Backend & Database:** Firebase (Authentication, Firestore, App Hosting)
- **Automation:** Firebase Cloud Functions
- **AI:** Google AI Gemini via Genkit

---

## 1. Authentication Flow (`/auth`)

The authentication process ensures that only registered users can access the pantry features.

**Entry Point & Redirection:**
1.  A user visits the site. The main page (`/`) renders the `PantryManager` component.
2.  `PantryManager.tsx` uses the `useAuth()` hook, which gets the user's status from `AuthContext`.
3.  `AuthContext.tsx` uses Firebase's `onAuthStateChanged` listener to know in real-time if a user is logged in.
4.  If the `useAuth` hook reports that there is no user and the initial check is complete, the `useEffect` in `PantryManager` redirects the user to the `/auth` page using `next/navigation`.

**The Auth Page (`src/app/auth/page.tsx`):**
1.  This page renders the `AuthForm` component (`src/components/auth/AuthForm.tsx`).
2.  `AuthForm` provides UI for both "Login" and "Sign Up" in separate tabs.
3.  It uses `react-hook-form` for managing form state and `zod` for validating user input (e.g., ensuring a valid email format and password length).
4.  **Login/Sign-up Logic:**
    - **Email/Password:** When a user submits the form, handler functions (`handleLogin`, `handleSignup`) call the corresponding Firebase Authentication SDK methods: `signInWithEmailAndPassword` or `createUserWithEmailAndPassword`.
    - **Google Sign-In:** The "Sign in with Google" button triggers `signInWithPopup` to open the standard Google login flow.
    - **Password Reset:** A "Forgot Password" link uses `sendPasswordResetEmail`.
5.  **Successful Authentication:**
    - Upon a successful login or sign-up, the `onAuthStateChanged` listener in `AuthContext` updates the global state with the user's information.
    - The `useEffect` hook in `AuthForm` detects that the `user` object is no longer null and redirects the user back to the main page (`/`).

---

## 2. Main Application: Pantry Management

Once authenticated, the user lands on the main page, which is driven by the `PantryManager` component.

**Core Component (`src/components/pantry/PantryManager.tsx`):**
1.  This is the primary "smart" component that orchestrates the main view.
2.  It manages the application's core state: `pantryItems` (the list of items) and `isLoadingItems` (for showing loading skeletons).
3.  **Data Fetching:** It uses a `useEffect` hook that runs when the `user` object is available. Inside this hook, it calls `getPantryItems()` from the pantry service.
4.  **State Updates:**
    - The fetched items are stored in the `pantryItems` state variable.
    - `PantryManager` passes this state and functions to modify it (`handleAddItem`, `handleRemoveItem`) as props to its child components.

**Data Service (`src/lib/pantry-service.ts`):**
This file acts as the exclusive interface between the React application and the Firestore database.
1.  `getPantryDocRef()`: A crucial helper function that gets the Firestore document reference for the **currently logged-in user**. Each user's pantry is a single document in the `pantries` collection, with the document ID matching the user's UID (e.g., `pantries/{userId}`).
2.  `getPantryItems()`: Fetches the user's document and returns the `items` array stored within it. It also handles converting Firestore Timestamps back into JavaScript `Date` objects.
3.  `addPantryItem()`: Creates a new item object with a unique ID and the current date. It then fetches the existing items, adds the new one to the array, and overwrites the `items` field in the user's document with the updated array.
4.  `removePantryItem()`: Fetches the items, uses `.filter()` to create a new array without the specified item, and overwrites the `items` field with the new, smaller array.

**UI Components:**
- `PantryItemForm.tsx`: Displays the form for adding items. It uses `react-hook-form` and `zod` for validation. When submitted, it calls the `onAddItem` function passed down from `PantryManager`.
- `PantryList.tsx`: Receives the `pantryItems` array. It sorts the items (expired first, then by soonest to expire) and maps over them, rendering a `PantryItemDisplay` for each.
- `PantryItemDisplay.tsx`: A "display" component that shows a single item's name, expiry status, and a "Remove" button. It calculates the color-coded status badge and border based on the item's `addedDate` and `shelfLife`.

---

## 3. AI-Powered Features

PantryPal uses Genkit to integrate with the Gemini AI model for two key features.

### A. AI Item Scanner

1.  **Trigger:** The user clicks the "Scan Item with AI" button in `PantryItemForm`, which opens the `BarcodeScannerModal`.
2.  **Image Capture (`BarcodeScannerModal.tsx`):**
    - The modal requests camera access using `navigator.mediaDevices.getUserMedia`.
    - The user can either capture a photo from the live video stream or upload an image file.
    - The captured/uploaded image is converted into a **Base64 encoded Data URI**.
3.  **Server Action (`src/app/actions.ts`):**
    - The modal calls `extractItemDetailsAction(photoDataUri)`. Server Actions are Next.js's way to securely call server-side code from the client without creating a separate API endpoint.
4.  **Genkit Flow (`src/ai/flows/extract-item-details-flow.ts`):**
    - The action calls `extractItemDetails`, which in turn executes the Genkit flow.
    - The prompt (`itemDetailPrompt`) is sent to the Gemini model. The prompt instructs the AI to analyze the image (`{{media url=photoDataUri}}`) and extract the product name, barcode, and expiry date.
    - The `output` of the prompt is configured with a Zod schema (`ExtractItemDetailsOutputSchema`), forcing the AI to return a structured JSON object.
5.  **Result:** The structured JSON is sent back to the client. The `onScanComplete` callback in the modal receives this data and uses `form.setValue()` to automatically populate the "Item Name" and "Shelf Life" fields in the main form.

### B. AI Recipe Suggestions

1.  **Trigger:** The user clicks the "Suggest Recipes" button in `RecipeSuggestions.tsx`.
2.  **Data Preparation:** The component gathers the names of all items currently in the pantry into an array of strings.
3.  **Server Action (`src/app/actions.ts`):**
    - The `suggestRecipesAction` is called with the array of pantry item names.
4.  **Genkit Flow (`src/ai/flows/suggest-recipes.ts`):**
    - The action calls the `suggestRecipes` Genkit flow.
    - The prompt (`recipeSuggestionPrompt`) uses a **Handlebars template** (`{{#each pantryItems}}...{{/each}}`) to dynamically insert the list of ingredients into the text sent to the AI.
    - The prompt asks the AI to act as a chef and create recipes, returning the result in a structured JSON format defined by `SuggestRecipesOutputSchema`.
5.  **Result:** The list of recipe objects is returned to the `RecipeSuggestions` component, which then renders them in a user-friendly accordion view.

---

## 4. Backend Automation: Daily Expiry Alerts

This is a critical background process that runs without any user interaction.

1.  **File Location:** `pantrypalcodebase/src/index.ts`. This directory contains code for a Firebase Cloud Function.
2.  **Trigger:** The function `dailyExpiryCheck` is defined with `onSchedule`. The configuration `schedule: "every day 08:00"` and `timeZone: "Asia/Singapore"` tells Google Cloud to automatically run this function once a day at the specified time.
3.  **Execution Flow:**
    - The function queries the entire `pantries` collection in Firestore.
    - It iterates through each user's document.
    - For each item in a user's pantry, it calculates the remaining days until expiry.
    - It creates a new list containing only the items that expire in 3 days or less.
    - If this list is not empty, it fetches the user's email from Firebase Authentication using their UID.
    - It constructs a nicely formatted HTML email string.
    - **Magic Step:** It adds a new document to a collection named `mail`. This document contains the `to` address and the `html` content. The **Trigger Email Firebase Extension** is configured to monitor this `mail` collection. When it detects a new document, it automatically sends an email with the specified content and then deletes the document.

---

## 5. Deployment & Configuration

- **`firebase.json`:** The master config file for Firebase. It tells the Firebase CLI which services to deploy, including App Hosting and Functions. It points to the `pantrypalcodebase` directory for the function source code.
- **`apphosting.yaml`:** This configures the Cloud Run instance that powers the Next.js backend. It's where we set environment variables and secrets, like the `GEMINI_API_KEY`.
- **`next.config.js`:** Standard Next.js configuration for the application.
