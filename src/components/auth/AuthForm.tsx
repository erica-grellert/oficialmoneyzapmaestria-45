import React, { useState } from "react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import CountrySelector from "@/components/common/CountrySelector";
import { countries, Country, formatPhoneNumber } from "@/utils/countryUtils";
import {
  applyPhoneMask,
  getPlaceholderText,
  validatePhoneNumber,
  cleanPhoneNumber,
} from "@/utils/phoneUtils";

interface AuthFormProps {
  onSubmit: (
    email: string,
    password: string,
    name?: string,
    phone?: string,
    countryCode?: string
  ) => void;
  isLogin: boolean;
  isLoading?: boolean;
  submitText?: string;
  showResetPassword?: boolean;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  name: string;
  phone: string;
  email: string;
  password: string;
}

const AuthForm: React.FC<AuthFormProps> = ({
  onSubmit,
  isLogin,
  isLoading = false,
  submitText,
  showResetPassword = false,
}) => {
  const { t } = usePreferences();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Default to Brazil

  // Form schema validation using zod
  const loginSchema = z.object({
    email: z.string().email(t("auth.emailValid")),
    password: z.string().min(6, t("auth.passwordLength")),
  });

  const registerSchema = z.object({
    name: z.string().min(2, t("auth.nameRequired")),
    phone: z.string().optional(),
    email: z.string().email(t("auth.emailValid")),
    password: z.string().min(6, t("auth.passwordLength")),
  });

  // Initialize form with react-hook-form and zod validation
  const form = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
    defaultValues: isLogin
      ? { email: "", password: "" }
      : { name: "", phone: "", email: "", password: "" },
  });

  const handleSubmit = (values: LoginFormData | RegisterFormData) => {
    if (isLogin) {
      const loginValues = values as LoginFormData;
      onSubmit(loginValues.email, loginValues.password);
    } else {
      const registerValues = values as RegisterFormData;
      // Format phone number with country code if provided
      let formattedPhone = registerValues.phone;
      if (registerValues.phone && selectedCountry) {
        formattedPhone = formatPhoneNumber(
          selectedCountry,
          registerValues.phone
        );
      }

      onSubmit(
        registerValues.email,
        registerValues.password,
        registerValues.name,
        formattedPhone,
        selectedCountry.code
      );
    }
  };

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);

    // Update phone field if there's already a value
    const currentPhone = form.getValues("phone") as string;
    if (currentPhone) {
      const formattedPhone = formatPhoneNumber(country, currentPhone);
      form.setValue("phone", formattedPhone);
    }
  };

  const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: { onChange: (value: string) => void }
  ) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits

    // If the value already starts with the country code, remove it to avoid duplication
    if (value.startsWith(selectedCountry.dialCode)) {
      value = value.substring(selectedCountry.dialCode.length);
    }

    // Limit to reasonable length for local number (excluding country code)
    if (value.length > 15) {
      value = value.substring(0, 15);
    }

    // Apply phone mask for display
    const maskedValue = applyPhoneMask(value, selectedCountry.code);
    field.onChange(maskedValue);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="p-6 space-y-4"
      >
        {!isLogin && (
          <>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.name")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        {...field}
                        placeholder={t("auth.namePlaceholder")}
                        className="pl-10"
                        type="text"
                        autoComplete="name"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.phone") || "WhatsApp"}</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <div className="w-32 flex-shrink-0">
                        <CountrySelector
                          selectedCountry={selectedCountry}
                          onCountryChange={handleCountryChange}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          {...field}
                          placeholder={getPlaceholderText(selectedCountry.code)}
                          className="pl-10"
                          type="tel"
                          autoComplete="tel"
                          onChange={(e) => handlePhoneChange(e, field)}
                          maxLength={20}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    {t("auth.phoneFormat") ||
                      `Format: ${getPlaceholderText(selectedCountry.code)} (${
                        selectedCountry.name
                      })`}
                  </p>
                  {field.value && (
                    <>
                      <p className="text-xs text-blue-600 font-medium">
                        Full number: +{selectedCountry.dialCode}
                        {cleanPhoneNumber(field.value)}
                      </p>
                      {validatePhoneNumber(
                        field.value,
                        selectedCountry.code
                      ) ? (
                        <p className="text-xs text-green-600 font-medium">
                          ✅ Valid number for {selectedCountry.name}
                        </p>
                      ) : (
                        <p className="text-xs text-orange-600 font-medium">
                          ⚠️ Check number format
                        </p>
                      )}
                    </>
                  )}
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.email")}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    {...field}
                    placeholder={t("auth.emailPlaceholder")}
                    className="pl-10"
                    type="email"
                    autoComplete="email"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.password")}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    {...field}
                    placeholder={t("auth.passwordPlaceholder")}
                    className="pl-10 pr-10"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isLogin && showResetPassword && (
          <div className="flex justify-end">
            <a
              href="/forgot-password"
              className="text-sm text-primary font-medium hover:underline"
            >
              {t("auth.forgotPassword")}
            </a>
          </div>
        )}

        <Button type="submit" className="w-full mt-6" disabled={isLoading}>
          {submitText || (isLogin ? t("auth.login") : t("auth.signUp"))}
          {isLoading && <span className="ml-2">...</span>}
        </Button>
      </form>
    </Form>
  );
};

export default AuthForm;
