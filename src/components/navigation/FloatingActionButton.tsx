import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TransactionFormV2 } from "@/components/common/TransactionFormV2";

interface FloatingActionButtonProps {
  className?: string;
  onClick?: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  className,
  onClick,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsFormOpen(true);
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        className={cn(
          "fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg",
          "bg-emerald-600 hover:bg-emerald-700 text-white",
          "transition-all duration-200 hover:scale-110 active:scale-95",
          "md:bottom-6 focus:outline-none focus:ring-2 focus:ring-emerald-600/50",
          className
        )}
        size="icon"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Adicionar Transação</span>
      </Button>

      {!onClick && (
        <TransactionFormV2
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          mode="create"
        />
      )}
    </>
  );
};

export default FloatingActionButton;
