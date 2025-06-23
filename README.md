# PantryPal: Your Smart Kitchen Assistant

This is a Next.js application called PantryPal, designed to help you manage your kitchen pantry, reduce food waste, and discover new recipes.

## Core Features

- **Pantry Tracking:** Add items you buy and their shelf life.
- **Expiry Alerts:** Get notifications for items that are about to expire.
- **AI-Powered Item Scanner:** Use your camera to scan groceries, and the app's AI will automatically identify the product name and expiry date.
- **Smart Recipe Suggestions:** Get recipe ideas from an AI chef based on the ingredients you currently have in your pantry.

## Local Development Setup

To run this project locally, you'll need to use your own Google AI API key for the recipe and scanning features.

### 1. Create a Local Environment File

The project is configured to read your API key from a local file that is **not** committed to Git. This keeps your key safe.

Create a new file in the root directory of the project named:
`.env.local`

### 2. Add Your API Key

Open the `.env.local` file and add your Gemini API key in the following format:

```
GEMINI_API_KEY="YOUR_API_KEY_HERE"
```

You can get a free API key from [Google AI Studio](https://makersuite.google.com/).

### 3. Running the App

Once the `.env.local` file is saved, you can run the app as usual:
```bash
npm install
npm run dev
```
The application will now use your key for all AI features.

