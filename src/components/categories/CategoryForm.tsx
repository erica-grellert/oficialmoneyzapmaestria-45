import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Category } from "@/types/categories";
import { usePreferences } from "@/contexts/PreferencesContext";
import ColorPicker from "./ColorPicker";
import IconSelector from "./IconSelector";
import { Card } from "@/components/ui/card";
import { Palette, Tag, Type } from "lucide-react";

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Category | null;
  onSave: (category: Omit<Category, "id"> | Category) => void;
  categoryType?: "income" | "expense";
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  open,
  onOpenChange,
  initialData,
  onSave,
  categoryType = "expense",
}) => {
  const { t } = usePreferences();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Omit<Category, "type"> & { id?: string }>({
    defaultValues: initialData || {
      name: "",
      color: "#607D8B",
      icon: "circle",
    },
  });

  const selectedColor = watch("color");
  const selectedIcon = watch("icon");

  // Initialize form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setValue("name", initialData.name);
      setValue("color", initialData.color);
      setValue("icon", initialData.icon);
      if (initialData.id) {
        setValue("id", initialData.id);
      }
    } else {
      // Reset form when initialData is null (for new categories)
      setValue("name", "");
      setValue("color", "#607D8B");
      setValue("icon", "circle");
    }
  }, [initialData, setValue]);

  const handleColorChange = (color: string) => {
    setValue("color", color);
  };

  const handleIconChange = (icon: string) => {
    setValue("icon", icon);
  };

  const onSubmit = (data: Omit<Category, "type"> & { id?: string }) => {
    console.log("Form submitted with data:", data);
    console.log("Category type being used:", categoryType);

    if (initialData) {
      onSave({
        ...data,
        id: initialData.id,
        type: initialData.type,
        isDefault: initialData.isDefault,
      });
    } else {
      onSave({
        name: data.name,
        color: data.color,
        icon: data.icon,
        type: categoryType,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="bg-background p-6 border-b">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            {initialData ? t("categories.edit") : t("categories.add")}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Category Type Indicator */}
            <Card className="p-4 bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    categoryType === "expense"
                      ? "bg-red-500/20 text-red-600"
                      : "bg-emerald-500/20 text-emerald-600"
                  }`}
                >
                  {categoryType === "expense" ? (
                    <span className="text-sm font-semibold">D</span>
                  ) : (
                    <span className="text-sm font-semibold">R</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Tipo de Categoria
                  </p>
                  <p className="text-sm text-slate-500">
                    {categoryType === "expense" ? "Despesa" : "Receita"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Name Field */}
            <div className="space-y-3">
              <Label
                htmlFor="name"
                className="flex items-center gap-2 text-sm font-medium text-slate-700"
              >
                <Type className="h-4 w-4" />
                Nome da Categoria
              </Label>
              <Input
                id="name"
                {...register("name", { required: true })}
                className={`h-11 rounded-lg border-slate-200 focus:ring-2 focus:ring-primary/20 ${
                  errors.name ? "border-red-300 focus:ring-red-200" : ""
                }`}
                placeholder="Ex: Alimentação, Transporte, Salário..."
              />
              {errors.name && (
                <p className="text-sm text-red-600">
                  O nome da categoria é obrigatório
                </p>
              )}
            </div>

            {/* Color and Icon Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Color Picker */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Palette className="h-4 w-4" />
                  Cor
                </Label>
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <ColorPicker
                    selectedColor={selectedColor}
                    onSelectColor={handleColorChange}
                  />
                </div>
              </div>

              {/* Icon Selector */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Tag className="h-4 w-4" />
                  Ícone
                </Label>
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <IconSelector
                    selectedIcon={selectedIcon}
                    onSelectIcon={handleIconChange}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">
                Prévia
              </Label>
              <Card className="p-4 border border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: selectedColor }}
                  >
                    <IconSelector
                      selectedIcon={selectedIcon}
                      onSelectIcon={() => {}}
                      previewMode={true}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {watch("name") || "Nome da Categoria"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {categoryType === "expense" ? "Despesa" : "Receita"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </form>
        </div>

        <DialogFooter className="bg-slate-50 p-6 border-t border-slate-200">
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 shadow-lg"
            >
              {initialData ? "Atualizar" : "Criar"} Categoria
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;
