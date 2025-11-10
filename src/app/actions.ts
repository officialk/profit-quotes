'use server';

import { z } from 'zod';
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

// --- Common Expense Schema ---
const expenseSchema = z.object({
  label: z.string().min(1, { message: "Expense label is required." }),
  value: z.coerce.number().positive({ message: "Expense value must be positive." }),
  type: z.enum(['fixed', 'percentage'])
});


// --- Profit From Quoted Price ---
const ProfitFromPriceSchema = z.object({
  calculationMode: z.literal('profit-from-price'),
  quotedPrice: z.coerce.number().positive('Quoted price must be positive.'),
  expenses: z.array(expenseSchema).min(1, { message: "At least one expense is required." }),
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
    let totalExpenseValue = 0;
    for (const expense of expenses) {
      if (expense.type === 'fixed') {
        totalExpenseValue += expense.value;
      } else {
        totalExpenseValue += (quotedPrice * expense.value) / 100;
      }
    }
    
    const profit = quotedPrice - totalExpenseValue;

    const interpretedExpense = `Total expenses of ${formatCurrency(
      totalExpenseValue
    )}`;

    const summary = `For a quoted price of ${formatCurrency(
      quotedPrice
    )} with total expenses of ${formatCurrency(
      totalExpenseValue
    )}, your profit will be ${formatCurrency(profit)}.`;

    return {
      status: 'success',
      profit,
      expenseInterpretation: interpretedExpense,
      summary,
    };
  } catch (error) {
    console.error('Calculation Error:', error);
    return {
      status: 'error',
      error:
        'Could not calculate profit. Please check your inputs.',
    };
  }
}

// --- Quoted Price From Target Profit ---
const PriceFromProfitSchema = z.object({
  calculationMode: z.literal('price-from-profit'),
  targetProfit: z.coerce.number().positive('Target profit must be positive.'),
  expenses: z.array(expenseSchema).min(1, { message: "At least one expense is required." }),
  label: z.string().optional(),
});


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

  for (const expense of expenseInputs) {
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

  const expenseSummary = expenseInputs.map(e => `${e.label}: ${e.type === 'fixed' ? formatCurrency(e.value) : `${e.value}%`}`).join(', ');
  const summary = `To earn a profit of ${formatCurrency(
    targetProfit
  )} with expenses for ${expenseSummary}, you should quote ${formatCurrency(
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
