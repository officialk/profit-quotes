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
  expenseInput: z.string().min(1, 'Expenses are required.'),
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
  const { quotedPrice, expenseInput } = validatedFields.data;

  try {
    const aiResult = await interpretExpenseInput({
      expenseInput,
      quotedPrice,
    });

    // The AI flow is designed to return the calculated expense value.
    const profit = quotedPrice - aiResult.expenseValue;

    const summary = `For a quoted price of ${formatCurrency(
      quotedPrice
    )} with expenses of ${formatCurrency(
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
  expenseInput: z.string().min(1, 'Expenses are required.'),
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
  const { targetProfit, expenseInput } = validatedFields.data;

  const expense = parseExpense(expenseInput);

  if (!expense) {
    return {
      status: 'error',
      error:
        'Invalid expense format. Use a number (e.g., 500) or a percentage (e.g., 15%).',
    };
  }

  let quotedPrice = 0;
  let expenseValue = 0;

  if (expense.type === 'fixed') {
    quotedPrice = targetProfit + expense.value;
    expenseValue = expense.value;
  } else {
    if (expense.value >= 100) {
      return {
        status: 'error',
        error:
          'Expense percentage must be less than 100% to calculate a valid quoted price.',
      };
    }
    quotedPrice = targetProfit / (1 - expense.value / 100);
    expenseValue = quotedPrice * (expense.value / 100);
  }

  const summary = `To earn a profit of ${formatCurrency(
    targetProfit
  )} with ${expenseInput} expenses, you should quote ${formatCurrency(
    quotedPrice
  )}.`;

  return {
    status: 'success',
    quotedPrice,
    profit: targetProfit,
    expenses: expenseValue,
    summary,
  };
}
