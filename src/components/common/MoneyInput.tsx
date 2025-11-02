import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MoneyInputProps {
  value?: number;
  onChange: (value: number) => void;
  className?: string;
  error?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  className,
  error,
}) => {
  const [displayValue, setDisplayValue] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isUserTyping && value && value > 0) {
      setDisplayValue(formatCurrency(value));
    }
  }, [value, isUserTyping]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const parseCurrency = (value: string): number => {
    const cleanValue = value.replace(/[^\d,]/g, "").replace(",", ".");
    return parseFloat(cleanValue) || 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;

    // Allow only numbers, commas, and dots
    const sanitized = inputValue.replace(/[^\d,]/g, "");

    setIsUserTyping(true);
    setDisplayValue(sanitized);

    const numericValue = parseCurrency(sanitized);
    onChange(numericValue);

    // Restore cursor position after state update
    setTimeout(() => {
      if (inputRef.current) {
        const newPosition = Math.min(cursorPosition, sanitized.length);
        inputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const handleBlur = () => {
    setIsUserTyping(false);
    if (value && value > 0) {
      setDisplayValue(formatCurrency(value));
    }
  };

  const handleFocus = () => {
    setIsUserTyping(true);
  };

  return (
    <div className="relative">
      <div className="absolute left-3 xs:left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium text-base xs:text-lg pointer-events-none">
        R$
      </div>
      <Input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder="0,00"
        className={cn(
          "pl-10 xs:pl-12 pr-4 h-12 xs:h-14 text-xl xs:text-2xl font-semibold text-slate-900 dark:text-slate-100",
          "border-slate-200 dark:border-slate-700 rounded-xl xs:rounded-2xl",
          "focus:border-slate-900 dark:focus:border-slate-100 focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-slate-100/20",
          "min-h-[44px] touch-manipulation",
          error &&
            "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400",
          className
        )}
        maxLength={15}
        autoFocus
      />
      {error && (
        <p className="text-xs xs:text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
};
