export type Expense = {
  label: string;
  value: number | undefined;
  type: 'fixed' | 'percentage';
};

export type ProfitFromPriceResult = {
  status: 'success';
  profit: number;
  expenseInterpretation: string;
  summary: string;
};

export type PriceFromProfitResult = {
  status: 'success';
  quotedPrice: number;
  profit: number;
  expenses: number;
  summary: string;
};

export type ActionError = {
  status: 'error';
  error: string;
};

export type ProfitFromPriceActionResponse = ProfitFromPriceResult | ActionError;
export type PriceFromProfitActionResponse = PriceFromProfitResult | ActionError;

export type Calculation = {
    id: string;
    label: string;
    result: ProfitFromPriceResult | PriceFromProfitResult;
    timestamp: string;
};
