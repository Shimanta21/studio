// This file is machine-generated - edit with caution!

'use server';

/**
 * @fileOverview Generates expiry notifications for medicines and pet foods.
 *
 * - generateExpiryNotification - A function that generates a tailored notification message based on the product type and quantity expiring.
 * - GenerateExpiryNotificationInput - The input type for the generateExpiryNotification function.
 * - GenerateExpiryNotificationOutput - The return type for the generateExpiryNotification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExpiryNotificationInputSchema = z.object({
  productType: z
    .string()
    .describe('The type of product nearing expiration (e.g., medicine, pet food).'),
  productName: z.string().describe('The name of the product nearing expiration.'),
  quantity: z.number().describe('The quantity of the product nearing expiration.'),
  expiryDate: z.string().describe('The expiry date of the product (YYYY-MM-DD).'),
});
export type GenerateExpiryNotificationInput = z.infer<
  typeof GenerateExpiryNotificationInputSchema
>;

const GenerateExpiryNotificationOutputSchema = z.object({
  notificationMessage: z
    .string()
    .describe('A tailored notification message for the expiring product.'),
});
export type GenerateExpiryNotificationOutput = z.infer<
  typeof GenerateExpiryNotificationOutputSchema
>;

export async function generateExpiryNotification(
  input: GenerateExpiryNotificationInput
): Promise<GenerateExpiryNotificationOutput> {
  return generateExpiryNotificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExpiryNotificationPrompt',
  input: {schema: GenerateExpiryNotificationInputSchema},
  output: {schema: GenerateExpiryNotificationOutputSchema},
  prompt: `You are an inventory management assistant. Generate a notification message to inform the user that a product is nearing its expiration date.

Product Type: {{productType}}
Product Name: {{productName}}
Quantity: {{quantity}}
Expiry Date: {{expiryDate}}

Compose a concise and informative notification message.`,
});

const generateExpiryNotificationFlow = ai.defineFlow(
  {
    name: 'generateExpiryNotificationFlow',
    inputSchema: GenerateExpiryNotificationInputSchema,
    outputSchema: GenerateExpiryNotificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
