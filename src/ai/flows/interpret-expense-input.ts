'use server';

/**
 * @fileOverview A flow that interprets the expense input, determining whether it's a fixed amount or a percentage.
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
    .describe('The expense input string, which can be a fixed amount or a percentage (e.g., "500" or "15%").'),
  quotedPrice: z.number().describe('The quoted price.'),
});
export type InterpretExpenseInputInput = z.infer<typeof InterpretExpenseInputInputSchema>;

const InterpretExpenseInputOutputSchema = z.object({
  expenseType: z.enum(['fixed', 'percentage']).describe('The type of expense input: "fixed" or "percentage".'),
  expenseValue: z.number().describe('The numerical value of the expense.'),
  interpretedExpense: z
    .string()
    .describe('The interpretation of the expense, including the total value and type.'),
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
  prompt: `You are an expert financial assistant. Your job is to determine the type and value of an expense input.  The expense input will be a string, which can be a fixed amount or a percentage of the quoted price (e.g., \"500\" or \"15%\").  You must determine whether it is a fixed amount or a percentage.  If it is a percentage, calculate the expense value as a percentage of the quotedPrice.

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
