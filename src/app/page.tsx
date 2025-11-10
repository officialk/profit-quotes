import { Logo } from '@/components/icons';
import CalculatorComponent from '@/components/calculator';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center justify-center gap-3">
            <Logo className="h-8 w-8 text-primary" />
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              ProfitPro Calculator
            </h1>
          </div>
          <p className="mt-2 text-lg text-muted-foreground">
            Estimate your profit or the price to quote with ease.
          </p>
        </header>
        <CalculatorComponent />
      </div>
    </main>
  );
}
