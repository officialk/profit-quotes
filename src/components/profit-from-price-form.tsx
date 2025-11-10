"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DollarSign, Loader2, Info, RefreshCw, Tag } from "lucide-react";
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
import { calculateProfitFromPriceAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { ProfitFromPriceResult } from "@/lib/types";

const formSchema = z.object({
  label: z.string().optional(),
  quotedPrice: z.coerce
    .number()
    .positive({ message: "Quoted price must be a positive number." }),
  expenseInput: z.string().min(1, { message: "Expenses are required." }),
});

export default function ProfitFromPriceForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ProfitFromPriceResult | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: "",
      quotedPrice: undefined,
      expenseInput: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setResult(null);
    startTransition(async () => {
      const response = await calculateProfitFromPriceAction(values);
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
        <CardTitle>Calculate Profit from Quoted Price</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        placeholder="e.g., Project A"
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
                Calculate Profit
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
        )}
      </CardContent>
    </Card>
  );
}
