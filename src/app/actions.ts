'use server';

import { suggestRecipes as genAISuggestRecipes, type SuggestRecipesInput, type SuggestRecipesOutput } from '@/ai/flows/suggest-recipes';

export async function suggestRecipesAction(pantryItems: string[]): Promise<SuggestRecipesOutput | { error: string }> {
  if (!pantryItems || pantryItems.length === 0) {
    return { error: "Your pantry is empty. Please add some items to get recipe suggestions." };
  }
  try {
    const input: SuggestRecipesInput = { pantryItems };
    const result = await genAISuggestRecipes(input);
    if (!result || !result.recipes) {
        return { error: "AI could not generate recipes at this moment. Please try again."};
    }
    return result;
  } catch (e: any) {
    console.error("Error suggesting recipes via AI flow:", e);
    // It's good practice to not expose raw error messages to the client.
    let errorMessage = "An unexpected error occurred while generating recipes.";
    if (e.message) {
      // You might want to sanitize this or map to user-friendly messages
      errorMessage = `Failed to generate recipes: ${e.message.substring(0,100)}`; 
    }
    return { error: errorMessage };
  }
}
