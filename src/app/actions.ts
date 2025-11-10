'use server';

import { z } from 'zod';
import { interpretExpenseInput } from '@/ai/flows/interpret-expense-input';
import type {
  PriceFromProfitActionResponse,
  ProfitFromPriceActionResponse,
} from '@/lib/types';

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

// --- Profit From Quoted Price ---

const ProfitFromPriceSchema = z.object({
  quotedPrice: z.number().positive('Quoted price must be positive.'),
  expenses: z.array(z.object({ value: z.string().min(1, 'Expense cannot be empty.') })),
  label: z.string().optional(),
});

export async function calculateProfitFromPriceAction(
  input: z.infer<typeof ProfitFromPriceSchema>
): Promise<ProfitFromPriceActionResponse> {
  const validatedFields = ProfitFromPriceSchema.safeParse(input);
  if (!validatedFields.success) {
    return {
      status: 'error',
      error:
        'Invalid input: ' +
        Object.values(validatedFields.error.flatten().fieldErrors).join(', '),
    };
  }
  const { quotedPrice, expenses } = validatedFields.data;

  try {
    const expenseStrings = expenses.map(e => e.value);
    const aiResult = await interpretExpenseInput({
      expenseInput: expenseStrings.join(', '), // Join for the AI
      quotedPrice,
    });

    // The AI flow is designed to return the calculated expense value.
    const profit = quotedPrice - aiResult.expenseValue;

    const summary = `For a quoted price of ${formatCurrency(
      quotedPrice
    )} with total expenses of ${formatCurrency(
      aiResult.expenseValue
    )}, your profit will be ${formatCurrency(profit)}.`;

    return {
      status: 'success',
      profit,
      expenseInterpretation: aiResult.interpretedExpense,
      summary,
    };
  } catch (error) {
    console.error('AI Error:', error);
    return {
      status: 'error',
      error:
        'Could not interpret expenses. Please try a different format (e.g., "500" or "15%").',
    };
  }
}

// --- Quoted Price From Target Profit ---

const PriceFromProfitSchema = z.object({
  targetProfit: z.number().positive('Target profit must be positive.'),
  expenses: z.array(z.object({ value: z.string().min(1, 'Expense cannot be empty.') })),
  label: z.string().optional(),
});

// Manual expense parser for Mode 2
const parseExpense = (expenseInput: string) => {
  const trimmed = expenseInput.trim();
  if (trimmed.endsWith('%')) {
    const value = parseFloat(trimmed.slice(0, -1));
    if (isNaN(value)) return null;
    return { type: 'percentage', value };
  }
  const value = parseFloat(trimmed);
  if (isNaN(value)) return null;
  return { type: 'fixed', value };
};

export async function calculatePriceFromProfitAction(
  input: z.infer<typeof PriceFromProfitSchema>
): Promise<PriceFromProfitActionResponse> {
  const validatedFields = PriceFromProfitSchema.safeParse(input);
  if (!validatedFields.success) {
    return {
      status: 'error',
      error:
        'Invalid input: ' +
        Object.values(validatedFields.error.flatten().fieldErrors).join(', '),
    };
  }
  const { targetProfit, expenses: expenseInputs } = validatedFields.data;

  let totalFixedExpenses = 0;
  let totalPercentage = 0;

  for (const expenseInput of expenseInputs) {
    const expense = parseExpense(expenseInput.value);
    if (!expense) {
      return {
        status: 'error',
        error:
          `Invalid expense format: "${expenseInput.value}". Use a number (e.g., 500) or a percentage (e.g., 15%).`,
      };
    }
    if (expense.type === 'fixed') {
      totalFixedExpenses += expense.value;
    } else {
      totalPercentage += expense.value;
    }
  }

  if (totalPercentage >= 100) {
    return {
      status: 'error',
      error:
        'Total expense percentage must be less than 100% to calculate a valid quoted price.',
    };
  }

  const quotedPrice = (targetProfit + totalFixedExpenses) / (1 - totalPercentage / 100);
  const totalExpenseValue = totalFixedExpenses + (quotedPrice * (totalPercentage / 100));

  const expenseSummary = expenseInputs.map(e => e.value).join(', ');
  const summary = `To earn a profit of ${formatCurrency(
    targetProfit
  )} with ${expenseSummary} expenses, you should quote ${formatCurrency(
    quotedPrice
  )}.`;

  return {
    status: 'success',
    quotedPrice,
    profit: targetProfit,
    expenses: totalExpenseValue,
    summary,
  };
}
