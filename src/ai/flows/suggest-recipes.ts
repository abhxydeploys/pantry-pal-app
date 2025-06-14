'use server';

/**
 * @fileOverview AI-powered recipe suggestions based on the items in the pantry.
 *
 * - suggestRecipes - A function that suggests recipes based on pantry items.
 * - SuggestRecipesInput - The input type for the suggestRecipes function.
 * - SuggestRecipesOutput - The return type for the suggestRecipes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRecipesInputSchema = z.object({
  pantryItems: z
    .array(z.string())
    .describe('An array of food items currently in the pantry.'),
});
export type SuggestRecipesInput = z.infer<typeof SuggestRecipesInputSchema>;

const SuggestRecipesOutputSchema = z.object({
  recipes: z.array(
    z.object({
      name: z.string().describe('The name of the recipe.'),
      ingredients: z.array(z.string()).describe('The ingredients required for the recipe.'),
      instructions: z.string().describe('The instructions to prepare the recipe.'),
    })
  ).describe('A list of suggested recipes based on the pantry items.'),
});
export type SuggestRecipesOutput = z.infer<typeof SuggestRecipesOutputSchema>;

export async function suggestRecipes(input: SuggestRecipesInput): Promise<SuggestRecipesOutput> {
  return suggestRecipesFlow(input);
}

const recipeSuggestionPrompt = ai.definePrompt({
  name: 'recipeSuggestionPrompt',
  input: {schema: SuggestRecipesInputSchema},
  output: {schema: SuggestRecipesOutputSchema},
  prompt: `You are a world-class chef specializing in creating recipes based on available ingredients.

  Given the following items in the user's pantry, suggest recipes that utilize these ingredients.
  Only suggest recipes that use ingredients in the pantry.

Pantry Items: {{#each pantryItems}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Recipes:`, // Handlebars syntax
});

const suggestRecipesFlow = ai.defineFlow(
  {
    name: 'suggestRecipesFlow',
    inputSchema: SuggestRecipesInputSchema,
    outputSchema: SuggestRecipesOutputSchema,
  },
  async input => {
    const {output} = await recipeSuggestionPrompt(input);
    return output!;
  }
);
