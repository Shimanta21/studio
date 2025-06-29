'use server';

/**
 * @fileOverview Generates a sales notification for a customer.
 *
 * - generateSalesNotification - A function that creates a notification message for a customer's bill.
 * - GenerateSalesNotificationInput - The input type for the generateSalesNotification function.
 * - GenerateSalesNotificationOutput - The return type for the generateSalesNotification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SalesItemSchema = z.object({
  productName: z.string().describe('The name of the product purchased.'),
  quantity: z.number().describe('The quantity of the product purchased.'),
  price: z.number().describe('The price per unit of the product.'),
});

const GenerateSalesNotificationInputSchema = z.object({
  customerName: z.string().describe("The customer's name."),
  items: z
    .array(SalesItemSchema)
    .describe('An array of items included in the sale.'),
  totalAmount: z.number().describe('The total amount of the bill.'),
});
export type GenerateSalesNotificationInput = z.infer<
  typeof GenerateSalesNotificationInputSchema
>;

const GenerateSalesNotificationOutputSchema = z.object({
  notificationMessage: z
    .string()
    .describe('A friendly notification message for the customer summarizing their bill.'),
});
export type GenerateSalesNotificationOutput = z.infer<
  typeof GenerateSalesNotificationOutputSchema
>;

export async function generateSalesNotification(
  input: GenerateSalesNotificationInput
): Promise<GenerateSalesNotificationOutput> {
  return generateSalesNotificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSalesNotificationPrompt',
  input: {schema: GenerateSalesNotificationInputSchema},
  output: {schema: GenerateSalesNotificationOutputSchema},
  prompt: `You are a friendly shop assistant for a veterinary supply store. Generate a concise and friendly notification message for a customer confirming their recent purchase.

- Address the customer by name.
- List each item they purchased with its quantity.
- State the total amount of the bill clearly.
- Keep the tone professional but warm and thank them for their business.

Customer Name: {{customerName}}
Total Bill: ₹{{totalAmount}}
Items Purchased:
{{#each items}}
- {{this.productName}} (Quantity: {{this.quantity}})
{{/each}}
`,
});

const generateSalesNotificationFlow = ai.defineFlow(
  {
    name: 'generateSalesNotificationFlow',
    inputSchema: GenerateSalesNotificationInputSchema,
    outputSchema: GenerateSalesNotificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
