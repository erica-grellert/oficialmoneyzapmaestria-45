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
  // Show top 6 most used categories
  const topCategories = categories.slice(0, 6);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {topCategories.map((category) => (
        <Button
          key={category.id}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSelect(category.id)}
          className={cn(
            "h-9 px-3 rounded-full transition-all duration-200",
            "border-slate-200 hover:bg-slate-800 hover:text-white",
            selectedId === category.id &&
              "border-slate-100 bg-slate-800 text-white border-slate-800"
          )}
        >
          <CategoryIcon
            icon={category.icon}
            color={category.color}
            size={16}
            className="mr-1.5"
          />
          <span className="text-xs font-medium">{category.name}</span>
        </Button>
      ))}
    </div>
  );
};
