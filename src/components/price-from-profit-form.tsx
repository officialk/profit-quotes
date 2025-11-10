"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DollarSign,
  Loader2,
  Info,
  RefreshCw,
  Tag,
  TrendingUp,
  Minus,
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
import { calculatePriceFromProfitAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { PriceFromProfitResult } from "@/lib/types";

const formSchema = z.object({
  label: z.string().optional(),
  targetProfit: z.coerce
    .number()
    .positive({ message: "Target profit must be a positive number." }),
  expenseInput: z.string().min(1, { message: "Expenses are required." }),
});

export default function PriceFromProfitForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<PriceFromProfitResult | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: "",
      targetProfit: undefined,
      expenseInput: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setResult(null);
    startTransition(async () => {
      const response = await calculatePriceFromProfitAction(values);
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

  function handleReset() {
    form.reset();
    setResult(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculate Quoted Price from Target Profit</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="targetProfit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Profit</FormLabel>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              <FormField
                control={form.control}
                name="expenseInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expenses</FormLabel>
                    <div className="relative">
                      <Info className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="500 or 15%"
                          className="pl-9"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Label (Optional)</FormLabel>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                      <Input
                        placeholder="e.g., Target Job"
                        className="pl-9"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col-reverse justify-between gap-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Reset
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Calculate Price
              </Button>
            </div>
          </form>
        </Form>

        {isPending && (
          <div className="mt-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Calculating...</p>
          </div>
        )}

        {result && !isPending && (
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
                      {result.expenses.toLocaleString("en-US", {
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
        )}
      </CardContent>
    </Card>
  );
}
