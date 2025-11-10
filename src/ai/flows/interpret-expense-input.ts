'use server';

/**
 * @fileOverview A flow that interprets a list of expense inputs, determining whether each is a fixed amount or a percentage and calculating the total.
 *
 * - interpretExpenseInput - A function that handles the expense input interpretation.
 * - InterpretExpenseInputInput - The input type for the interpretExpenseInput function.
 * - InterpretExpenseInputOutput - The return type for the interpretExpenseInput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterpretExpenseInputInputSchema = z.object({
  expenseInput: z
    .string()
    .describe('A comma-separated string of expense inputs, where each can be a fixed amount or a percentage (e.g., "500, 15%, 25.50").'),
  quotedPrice: z.number().describe('The quoted price.'),
});
export type InterpretExpenseInputInput = z.infer<typeof InterpretExpenseInputInputSchema>;

const InterpretExpenseInputOutputSchema = z.object({
  expenseValue: z.number().describe('The total numerical value of all combined expenses.'),
  interpretedExpense: z
    .string()
    .describe('A summary of the total interpreted expense.'),
});
export type InterpretExpenseInputOutput = z.infer<typeof InterpretExpenseInputOutputSchema>;

export async function interpretExpenseInput(
  input: InterpretExpenseInputInput
): Promise<InterpretExpenseInputOutput> {
  return interpretExpenseInputFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interpretExpenseInputPrompt',
  input: {schema: InterpretExpenseInputInputSchema},
  output: {schema: InterpretExpenseInputOutputSchema},
  prompt: `You are an expert financial assistant. Your job is to calculate the total value of a list of expenses. The expense input will be a comma-separated string, where each item can be a fixed amount or a percentage of the quoted price (e.g., "500, 15%, 25.50").

You must parse each item in the list.
- If an item is a percentage, calculate its value based on the quotedPrice.
- If an item is a fixed amount, use its numerical value.
- Sum up all calculated values to get the total expenseValue.
- For the interpretedExpense, provide a human-readable summary of the total expenses (e.g., "Total expenses of $675.50").

Expense Input: {{{expenseInput}}}
Quoted Price: {{{quotedPrice}}}

Respond in a JSON format.
`,
});

const interpretExpenseInputFlow = ai.defineFlow(
  {
    name: 'interpretExpenseInputFlow',
    inputSchema: InterpretExpenseInputInputSchema,
    outputSchema: InterpretExpenseInputOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
