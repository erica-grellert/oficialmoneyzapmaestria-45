import React from "react";
import { Button } from "@/components/ui/button";
import CategoryIcon from "@/components/categories/CategoryIcon";
import { Category } from "@/types/categories";
import { cn } from "@/lib/utils";

interface CategoryChipsProps {
  categories: Category[];
  onSelect: (categoryId: string) => void;
  selectedId?: string;
  className?: string;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  categories,
  onSelect,
  selectedId,
  className,
}) => {
  return (
    <div className={cn("flex flex-wrap gap-2 xs:gap-2.5", className)}>
      {categories.map((category) => (
        <Button
          key={category.id}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSelect(category.id)}
          className={cn(
            "h-9 xs:h-10 px-3 xs:px-4 rounded-full transition-all duration-200 min-h-[36px] touch-manipulation",
            "border-slate-200 hover:bg-slate-800 hover:text-white active:scale-95",
            selectedId === category.id &&
              "border-slate-100 bg-slate-800 text-white border-slate-800"
          )}
        >
          <CategoryIcon
            icon={category.icon}
            color={category.color}
            size={16}
            className="mr-1 xs:mr-1.5 flex-shrink-0"
          />
          <span className="text-xs xs:text-sm font-medium whitespace-nowrap">{category.name}</span>
        </Button>
      ))}
    </div>
  );
};
