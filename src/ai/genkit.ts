import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})], // Explicitly use the GEMINI_API_KEY from environment
  model: 'googleai/gemini-2.0-flash',
});
