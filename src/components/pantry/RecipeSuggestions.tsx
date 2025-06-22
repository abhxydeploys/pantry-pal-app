'use client';

import { useState } from 'react';
import { suggestRecipesAction } from '@/app/actions';
import type { SuggestRecipesOutput } from '@/ai/flows/suggest-recipes';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, ChefHat, AlertCircle, Sparkles, ShoppingBasket, ExternalLink } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface RecipeSuggestionsProps {
  pantryItemNames: string[];
}

export default function RecipeSuggestions({ pantryItemNames }: RecipeSuggestionsProps) {
  const [recipes, setRecipes] = useState<SuggestRecipesOutput['recipes'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSuggestRecipes = async () => {
    setIsLoading(true);
    setError(null);
    setRecipes(null);

    if (pantryItemNames.length === 0) {
      setError("Your pantry is empty. Add some items to get recipe suggestions.");
      setIsLoading(false);
      toast({
        title: "Pantry Empty",
        description: "Add items to your pantry to get recipe suggestions.",
        variant: "destructive",
      });
      return;
    }

    const result = await suggestRecipesAction(pantryItemNames);

    if ('error' in result) {
      setError(result.error);
      toast({
        title: "Error Generating Recipes",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.recipes && result.recipes.length > 0) {
      setRecipes(result.recipes);
    } else {
      setError("No recipes could be generated with the current pantry items. Try adding more diverse ingredients.");
      toast({
        title: "No Recipes Found",
        description: "Try adding more ingredients to your pantry.",
        variant: "default",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleSuggestRecipes} disabled={isLoading || pantryItemNames.length === 0} className="w-full">
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ChefHat className="mr-2 h-4 w-4" />
        )}
        {isLoading ? 'Generating Recipes...' : 'Suggest Recipes'}
      </Button>

      {error && !isLoading && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {recipes && recipes.length > 0 && (
        <div className="mt-6">
          <h3 className="text-2xl font-semibold mb-4 font-headline flex items-center whitespace-nowrap">
            <Sparkles className="h-6 w-6 mr-2 text-accent" />
            Suggested Recipes
          </h3>
          <Accordion type="single" collapsible className="w-full">
            {recipes.map((recipe, index) => (
              <AccordionItem value={`item-${index}`} key={index} className="bg-card rounded-md mb-2 shadow-sm">
                <AccordionTrigger className="hover:no-underline px-4 py-3 text-lg font-medium">
                  {recipe.name}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-md mb-1 flex items-center">
                      <ShoppingBasket className="h-4 w-4 mr-2 text-primary"/>
                      Ingredients:
                    </h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                      {recipe.ingredients.map((ingredient, i) => (
                        <li key={i}>{ingredient}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-md mb-1">Instructions:</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{recipe.instructions}</p>
                  </div>
                   <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary hover:text-accent"
                    onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(recipe.name + " recipe")}`, "_blank")}
                    aria-label={`Search for ${recipe.name} recipe on Google`}
                    >
                    Find full recipe online <ExternalLink className="ml-1.5 h-3 w-3" />
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
      {recipes && recipes.length === 0 && !isLoading && !error && (
         <Card>
          <CardContent className="p-4">
            <CardDescription className="text-center text-muted-foreground">
              No specific recipes found with your current items. Broaden your ingredients or try again!
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
