"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, TrendingUp, Minus } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Calculation } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


interface HistoryProps {
  history: Calculation[];
  setHistory: React.Dispatch<React.SetStateAction<Calculation[]>>;
}

export function HistoryComponent({ history, setHistory }: HistoryProps) {

  const clearHistory = () => {
    setHistory([]);
  };

  const deleteItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Calculation History</CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={history.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your saved calculations.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearHistory}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-muted-foreground text-center">No saved calculations yet.</p>
        ) : (
          <Accordion type="multiple" className="w-full">
            {history.map((calc, index) => (
              <AccordionItem value={`item-${index}`} key={calc.id}>
                <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4 items-center">
                        <div className="text-left">
                            <p className="font-semibold">{calc.label}</p>
                            <p className="text-sm text-muted-foreground">
                                {new Date(calc.timestamp).toLocaleString()}
                            </p>
                        </div>
                        {"quotedPrice" in calc.result && (
                             <p className="text-lg font-bold text-accent">{formatCurrency(calc.result.quotedPrice)}</p>
                        )}
                        {"profit" in calc.result && "expenseInterpretation" in calc.result && (
                             <p className="text-lg font-bold text-accent">{formatCurrency(calc.result.profit)}</p>
                        )}
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-4 bg-muted/50 rounded-md">
                    <p className="text-sm italic text-muted-foreground mb-4">{calc.result.summary}</p>
                    <Button variant="outline" size="sm" onClick={() => deleteItem(calc.id)}>
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
