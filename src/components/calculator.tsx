"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DollarSign,
  Loader2,
  RefreshCw,
  Tag,
  TrendingUp,
  Minus,
  PlusCircle,
  X,
  Target,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculatePriceFromProfitAction,
  calculateProfitFromPriceAction,
} from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type {
  PriceFromProfitResult,
  ProfitFromPriceResult,
  Expense,
  Calculation,
} from "@/lib/types";
import { HistoryComponent } from "./history";

const formSchema = z.discriminatedUnion("calculationMode", [
  z.object({
    calculationMode: z.literal("profit-from-price"),
    label: z.string().optional(),
    quotedPrice: z.coerce
      .number()
      .positive({ message: "Quoted price must be a positive number." }),
    expenses: z
      .array(
        z.object({
          label: z.string().min(1, { message: "Expense label is required." }),
          value: z.coerce
            .number()
            .positive({ message: "Expense value must be positive." }),
          type: z.enum(["fixed", "percentage"]),
        })
      )
      .min(1, { message: "At least one expense is required." }),
  }),
  z.object({
    calculationMode: z.literal("price-from-profit"),
    label: z.string().optional(),
    targetProfit: z.coerce
      .number()
      .positive({ message: "Target profit must be a positive number." }),
    expenses: z
      .array(
        z.object({
          label: z.string().min(1, { message: "Expense label is required." }),
          value: z.coerce
            .number()
            .positive({ message: "Expense value must be positive." }),
          type: z.enum(["fixed", "percentage"]),
        })
      )
      .min(1, { message: "At least one expense is required." }),
  }),
]);

type Result = ProfitFromPriceResult | PriceFromProfitResult;

const EXPENSES_STORAGE_KEY = "profitpro-expenses";
const HISTORY_STORAGE_KEY = "profitpro-history";


const getDefaultExpenses = (): Expense[] => {
    if (typeof window === 'undefined') {
        return [{ label: "", value: undefined, type: "fixed" }];
    }
    try {
        const storedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
        if (storedExpenses) {
            const parsed = JSON.parse(storedExpenses);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed.map(p => ({...p, value: p.value || undefined}));
            }
        }
    } catch (error) {
        console.error("Failed to parse expenses from localStorage", error);
    }
    return [{ label: "", value: undefined, type: "fixed" }];
};

const getInitialHistory = (): Calculation[] => {
    if (typeof window === "undefined") {
        return [];
    }
    try {
        const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (storedHistory) {
            const parsed = JSON.parse(storedHistory);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Failed to parse history from localStorage", error);
    }
    return [];
};


export default function CalculatorComponent() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Calculation[]>(getInitialHistory);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      calculationMode: "profit-from-price",
      label: "",
      expenses: getDefaultExpenses(),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "expenses",
  });
  
  const calculationMode = useWatch({
    control: form.control,
    name: "calculationMode",
  });
  
  const watchedLabel = useWatch({ control: form.control, name: "label" });

  const expenses = useWatch({
    control: form.control,
    name: 'expenses'
  })

  const watchedQuotedPrice = useWatch({
    control: form.control,
    // @ts-ignore
    name: 'quotedPrice'
  });

  useEffect(() => {
    try {
        localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
        console.error("Failed to save expenses to localStorage", error);
    }
  }, [expenses]);
  
  useEffect(() => {
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
        console.error("Failed to save history to localStorage", error);
    }
  }, [history]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    setResult(null);
    startTransition(async () => {
      const response =
        values.calculationMode === "profit-from-price"
          ? await calculateProfitFromPriceAction(values)
          : await calculatePriceFromProfitAction(values);

      if (response.status === "error") {
        toast({
          variant: "destructive",
          title: "Calculation Error",
          description: response.error,
        });
        setResult(null);
      } else {
        setResult(response);
      }
    });
  }

  function handleSaveToHistory() {
    if (!result || result.status === 'error') {
      toast({
        variant: "destructive",
        title: "Nothing to save",
        description: "Please perform a successful calculation first.",
      });
      return;
    }

    const newHistoryItem: Calculation = {
      id: new Date().toISOString(),
      label: watchedLabel || 'Untitled Calculation',
      result,
      timestamp: new Date().toISOString(),
    };

    setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
    toast({
        title: "Saved to History",
        description: `Calculation "${newHistoryItem.label}" has been saved.`,
    });
  }

  function handleReset() {
    form.reset({
      calculationMode: "profit-from-price",
      label: "",
      expenses: [{ label: "", value: undefined, type: "fixed" }],
    });
    // @ts-ignore
    form.setValue("quotedPrice", undefined);
    // @ts-ignore
    form.setValue("targetProfit", undefined);
    setResult(null);
  }

  const renderResult = () => {
    if (!result) return null;

    if (result.status === "success" && "profit" in result && "expenseInterpretation" in result) {
      // ProfitFromPriceResult
      return (
        <div className="animate-in fade-in-50 duration-500 mt-8 rounded-lg border bg-card p-6">
            <h3 className="text-center text-lg font-medium">
              Calculation Result
            </h3>
            <div className="mt-4 flex flex-col items-center justify-center gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Expected Profit</p>
                <p className="text-4xl font-bold text-accent">
                  {result.profit.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {result.expenseInterpretation}
              </p>
            </div>
            <p className="mt-6 text-center text-sm italic text-muted-foreground">
              {result.summary}
            </p>
          </div>
      );
    }
    
    if (result.status === "success" && "quotedPrice" in result) {
      // PriceFromProfitResult
      return (
         <div className="animate-in fade-in-50 duration-500 mt-8 rounded-lg border bg-card p-6">
            <h3 className="text-center text-lg font-medium">
              Calculation Result
            </h3>
            <div className="mt-4 flex flex-col items-center justify-center gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  Suggested Quoted Price
                </p>
                <p className="text-4xl font-bold text-accent">
                  {result.quotedPrice.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Profit</p>
                    <p className="font-semibold">
                      {result.profit.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Minus className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Expenses</p>
                    <p className="font-semibold">
                      {(result as PriceFromProfitResult).expenses.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-6 text-center text-sm italic text-muted-foreground">
              {result.summary}
            </p>
          </div>
      );
    }

    return null;
  }

  const getCalculatedExpenseValue = (expense: Expense) => {
    if (expense.type === 'fixed' || !expense.value) {
      return expense.value;
    }
    if (calculationMode === 'profit-from-price' && watchedQuotedPrice > 0) {
      return (watchedQuotedPrice * expense.value) / 100;
    }
    return undefined; // Cannot calculate for price-from-profit mode without the final quote
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profit Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="calculationMode"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Calculation Mode</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value);
                          setResult(null); // Reset result when mode changes
                        }}
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                             <div className="flex items-center rounded-md border border-muted p-4 hover:border-accent has-[[data-state=checked]]:border-accent">
                              <RadioGroupItem value="profit-from-price" id="profit-from-price" className="mr-2"/>
                              <FormLabel htmlFor="profit-from-price" className="font-normal text-base">
                                Calculate Profit from Quoted Price
                              </FormLabel>
                            </div>
                          </FormControl>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <div className="flex items-center rounded-md border border-muted p-4 hover:border-accent has-[[data-state=checked]]:border-accent">
                              <RadioGroupItem value="price-from-profit" id="price-from-profit" className="mr-2"/>
                               <FormLabel htmlFor="price-from-profit" className="font-normal text-base">
                                Calculate Price from Target Profit
                              </FormLabel>
                            </div>
                          </FormControl>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                {calculationMode === "profit-from-price" && (
                  <FormField
                    control={form.control}
                    name="quotedPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quoted Price</FormLabel>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1000"
                              className="pl-9"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {calculationMode === "price-from-profit" && (
                  <FormField
                    control={form.control}
                    name="targetProfit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Profit</FormLabel>
                        <div className="relative">
                          <Target className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="850"
                              className="pl-9"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="space-y-4">
                  <FormLabel>Expenses</FormLabel>
                  {fields.map((item, index) => {
                    const calculatedValue = getCalculatedExpenseValue(expenses[index]);
                    return (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px_120px_auto] gap-2 p-3 border rounded-md relative"
                    >
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 absolute -top-3 -right-3 bg-card"
                          onClick={() => remove(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <FormField
                        control={form.control}
                        name={`expenses.${index}.label`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Label</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Labor" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`expenses.${index}.value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Value</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g., 250"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`expenses.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="fixed">$</SelectItem>
                                <SelectItem value="percentage">%</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormItem>
                        <FormLabel className="text-xs">Calculated ($)</FormLabel>
                        <FormControl>
                            <Input 
                                type="text"
                                readOnly
                                value={calculatedValue !== undefined ? calculatedValue.toFixed(2) : ''}
                                placeholder={calculationMode === 'profit-from-price' ? '0.00' : 'N/A'}
                                className="bg-muted"
                                tabIndex={-1}
                            />
                        </FormControl>
                       </FormItem>
                    </div>
                  )})}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      append({ label: "", value: undefined, type: "fixed" })
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </div>
              </div>

              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name (Optional)</FormLabel>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="e.g., Q3 Marketing Campaign"
                          className="pl-9"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Reset
                  </Button>
                <div className="flex flex-col-reverse gap-4 sm:flex-row sm:w-auto w-full">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSaveToHistory}
                    disabled={!result || result.status === 'error'}
                    className="w-full sm:w-auto"
                  >
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full sm:w-auto"
                  >
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Calculate
                  </Button>
                </div>
              </div>
            </form>
          </Form>

          {isPending && (
            <div className="mt-6 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Calculating...</p>
            </div>
          )}

          {!isPending && renderResult()}
        </CardContent>
      </Card>
      
      {history.length > 0 && (
        <div className="mt-8">
            <HistoryComponent history={history} setHistory={setHistory} />
        </div>
      )}
    </>
  );
}
