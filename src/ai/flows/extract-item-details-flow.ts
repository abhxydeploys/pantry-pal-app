'use server';
/**
 * @fileOverview An AI flow to extract details like barcode and expiry date from an image of a product.
 *
 * - extractItemDetails - A function that handles the item detail extraction process.
 * - ExtractItemDetailsInput - The input type for the extractItemDetails function.
 * - ExtractItemDetailsOutput - The return type for the extractItemDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractItemDetailsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractItemDetailsInput = z.infer<typeof ExtractItemDetailsInputSchema>;

const ExtractItemDetailsOutputSchema = z.object({
  itemFound: z.boolean().describe('Whether a food item with details was found in the image.'),
  barcode: z.string().optional().describe('The barcode number found on the item.'),
  expiryDate: z.string().optional().describe('The expiry date found on the item, in YYYY-MM-DD format.'),
  productName: z.string().optional().describe('The name of the product identified from the packaging.'),
});
export type ExtractItemDetailsOutput = z.infer<typeof ExtractItemDetailsOutputSchema>;

export async function extractItemDetails(input: ExtractItemDetailsInput): Promise<ExtractItemDetailsOutput> {
  return extractItemDetailsFlow(input);
}

const itemDetailPrompt = ai.definePrompt({
  name: 'itemDetailPrompt',
  input: {schema: ExtractItemDetailsInputSchema},
  output: {schema: ExtractItemDetailsOutputSchema},
  prompt: `You are an expert at analyzing images of grocery products to extract key information.

  Analyze the provided image. Your task is to identify a barcode, an expiry date, and the product's name.

  - If you find a barcode, extract the numerical sequence.
  - If you find an expiry date, parse it and return it in YYYY-MM-DD format.
  - If you can clearly identify the product's name from the label, return it.
  - If the image does not contain a recognizable grocery item, or if no barcode or expiry date is visible, set 'itemFound' to false and leave the other fields empty. Otherwise, set 'itemFound' to true.

  Image: {{media url=photoDataUri}}`,
});

const extractItemDetailsFlow = ai.defineFlow(
  {
    name: 'extractItemDetailsFlow',
    inputSchema: ExtractItemDetailsInputSchema,
    outputSchema: ExtractItemDetailsOutputSchema,
  },
  async input => {
    const {output} = await itemDetailPrompt(input);
    return output!;
  }
);
