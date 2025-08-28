import React from "react";
import {
  Circle,
  Home,
  ShoppingBag,
  Car,
  FilmIcon,
  Activity,
  BookOpen,
  FileText,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  PlusCircle,
  Utensils,
  DollarSign,
  CreditCard,
  Coffee,
  Smartphone,
  Scissors,
  Shirt,
  Plane,
  LucideProps,
  BriefcaseMedical,
  CarFront,
  Bike,
  Footprints,
  Music,
  PartyPopper,
  Gamepad2,
  Heart,
  Stethoscope,
  Building2,
  Pill,
  Dumbbell,
  GraduationCap,
  Building,
  Users,
  Zap,
  Droplets,
  Flame,
  Wifi,
  Bed,
  Sparkles,
  ShoppingCart,
  Tv,
  Code,
  Banknote,
  CircleDollarSign,
} from "lucide-react";

interface CategoryIconProps {
  icon: string;
  size?: number;
  color?: string;
  className?: string;
}

// Type for Lucide icon components
type LucideIconComponent = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

// Icon map with all available icons
const iconMap: Record<string, LucideIconComponent> = {
  // Basic icons
  circle: Circle,
  home: Home,
  "shopping-bag": ShoppingBag,
  car: Car,
  "car-front": CarFront,
  film: FilmIcon,
  activity: Activity,
  book: BookOpen,
  "book-open": BookOpen,
  "file-text": FileText,
  "more-horizontal": MoreHorizontal,
  briefcase: Briefcase,
  laptop: Laptop,
  "trending-up": TrendingUp,
  gift: Gift,
  "plus-circle": PlusCircle,
  utensils: Utensils,
  "dollar-sign": DollarSign,
  "credit-card": CreditCard,
  coffee: Coffee,
  smartphone: Smartphone,
  scissors: Scissors,
  shirt: Shirt,
  plane: Plane,
  "briefcase-medical": BriefcaseMedical,

  // Additional icons
  bike: Bike,
  footprints: Footprints,
  music: Music,
  "party-popper": PartyPopper,
  "gamepad-2": Gamepad2,
  heart: Heart,
  stethoscope: Stethoscope,
  "building-2": Building2,
  pill: Pill,
  dumbbell: Dumbbell,
  "graduation-cap": GraduationCap,
  building: Building,
  users: Users,
  zap: Zap,
  droplets: Droplets,
  flame: Flame,
  wifi: Wifi,
  bed: Bed,
  sparkles: Sparkles,
  "shopping-cart": ShoppingCart,
  tv: Tv,
  code: Code,
  banknote: Banknote,
  "circle-dollar-sign": CircleDollarSign,
};

// Common aliases for better icon mapping
const iconAliases: Record<string, string> = {
  // Food & Dining
  food: "utensils",
  restaurant: "utensils",
  meal: "utensils",
  lunch: "utensils",
  dinner: "utensils",
  breakfast: "utensils",
  snack: "utensils",

  // Transportation
  transport: "car",
  bus: "car",
  train: "car",
  metro: "car",
  taxi: "car",
  uber: "car",
  walking: "footprints",

  // Shopping
  shopping: "shopping-bag",
  store: "shopping-bag",
  mall: "shopping-bag",
  market: "shopping-bag",
  clothes: "shirt",
  fashion: "shirt",

  // Entertainment
  entertainment: "film",
  movie: "film",
  cinema: "film",
  theater: "film",
  concert: "music",
  party: "party-popper",
  game: "gamepad-2",

  // Health & Wellness
  health: "heart",
  medical: "stethoscope",
  doctor: "stethoscope",
  hospital: "building-2",
  pharmacy: "pill",
  fitness: "dumbbell",
  gym: "dumbbell",

  // Education
  education: "book-open",
  school: "graduation-cap",
  university: "graduation-cap",
  course: "book-open",
  training: "book-open",

  // Work & Business
  work: "briefcase",
  office: "building",
  business: "briefcase",
  meeting: "users",
  salary: "dollar-sign",
  income: "trending-up",
  profit: "trending-up",

  // Home & Utilities
  rent: "home",
  mortgage: "home",
  utilities: "zap",
  electricity: "zap",
  water: "droplets",
  gas: "flame",
  internet: "wifi",
  phone: "smartphone",

  // Technology
  tech: "laptop",
  computer: "laptop",
  software: "code",
  app: "smartphone",

  // Travel
  travel: "plane",
  vacation: "plane",
  trip: "plane",
  hotel: "bed",
  accommodation: "bed",

  // Personal Care
  beauty: "scissors",
  haircut: "scissors",
  spa: "sparkles",
  cosmetics: "sparkles",

  // Default fallbacks
  other: "circle",
  misc: "circle",
  general: "circle",
};

const CategoryIcon: React.FC<CategoryIconProps> = ({ icon, size = 20, color, className }) => {
  // Convert icon string to PascalCase (e.g., "shopping-bag" -> "ShoppingBag")
  const formatIconName = (iconName: string): string => {
    return iconName
      .split(/[-_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
  };

  // Try to find the icon dynamically
  const getIconComponent = (iconName: string): LucideIconComponent => {
    // First check aliases
    const aliasedIcon = iconAliases[iconName.toLowerCase()];
    if (aliasedIcon) {
      iconName = aliasedIcon;
    }

    // First try the exact name in our icon map
    if (iconMap[iconName]) {
      return iconMap[iconName];
    }

    // Try formatted name (e.g., "shopping-bag" -> "ShoppingBag")
    const formattedName = formatIconName(iconName);
    if (iconMap[formattedName]) {
      return iconMap[formattedName];
    }

    // Try common variations
    const variations = [
      iconName.toLowerCase(),
      iconName.toLowerCase().replace(/[-_\s]/g, ""),
      iconName
        .toLowerCase()
        .replace(/[-_\s]/g, "")
        .replace(/^./, iconName.charAt(0).toUpperCase()),
    ];

    for (const variation of variations) {
      if (iconMap[variation]) {
        return iconMap[variation];
      }
    }

    // Fallback to Circle if no icon found
    return Circle;
  };

  const IconComponent = getIconComponent(icon);

  return <IconComponent className={className || "text-white"} size={size} style={{ color }} />;
};

export default CategoryIcon;
