import {
  parsePhoneNumber,
  isValidPhoneNumber,
  CountryCode,
} from "google-libphonenumber";

export interface PhoneMaskConfig {
  mask: string;
  placeholder: string;
  format: (value: string) => string;
  validate: (value: string, countryCode: string) => boolean;
}

export const getPhoneMaskConfig = (countryCode: string): PhoneMaskConfig => {
  switch (countryCode) {
    case "BR":
      return {
        mask: "(00) 00000-0000",
        placeholder: "(11) 98765-4321",
        format: (value: string) => {
          const numbers = value.replace(/\D/g, "");
          if (numbers.length <= 2) {
            return numbers.length ? `(${numbers}` : "";
          } else if (numbers.length <= 7) {
            return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
          } else {
            return `(${numbers.slice(0, 2)}) ${numbers.slice(
              2,
              7
            )}-${numbers.slice(7, 11)}`;
          }
        },
        validate: (value: string, countryCode: string) => {
          try {
            const phoneNumber = parsePhoneNumber(
              value,
              countryCode as CountryCode
            );
            return phoneNumber ? isValidPhoneNumber(phoneNumber) : false;
          } catch {
            return false;
          }
        },
      };

    case "US":
    case "CA":
      return {
        mask: "(000) 000-0000",
        placeholder: "(555) 123-4567",
        format: (value: string) => {
          const numbers = value.replace(/\D/g, "");
          if (numbers.length <= 3) {
            return numbers.length ? `(${numbers}` : "";
          } else if (numbers.length <= 6) {
            return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
          } else {
            return `(${numbers.slice(0, 3)}) ${numbers.slice(
              3,
              6
            )}-${numbers.slice(6, 10)}`;
          }
        },
        validate: (value: string, countryCode: string) => {
          try {
            const phoneNumber = parsePhoneNumber(
              value,
              countryCode as CountryCode
            );
            return phoneNumber ? isValidPhoneNumber(phoneNumber) : false;
          } catch {
            return false;
          }
        },
      };

    case "GB":
      return {
        mask: "00000 000000",
        placeholder: "07123 456789",
        format: (value: string) => {
          const numbers = value.replace(/\D/g, "");
          if (numbers.length <= 5) {
            return numbers;
          } else {
            return `${numbers.slice(0, 5)} ${numbers.slice(5, 11)}`;
          }
        },
        validate: (value: string, countryCode: string) => {
          try {
            const phoneNumber = parsePhoneNumber(
              value,
              countryCode as CountryCode
            );
            return phoneNumber ? isValidPhoneNumber(phoneNumber) : false;
          } catch {
            return false;
          }
        },
      };

    case "AU":
      return {
        mask: "0000 000 000",
        placeholder: "0456 789 123",
        format: (value: string) => {
          const numbers = value.replace(/\D/g, "");
          if (numbers.length <= 4) {
            return numbers;
          } else if (numbers.length <= 7) {
            return `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
          } else {
            return `${numbers.slice(0, 4)} ${numbers.slice(
              4,
              7
            )} ${numbers.slice(7, 10)}`;
          }
        },
        validate: (value: string, countryCode: string) => {
          try {
            const phoneNumber = parsePhoneNumber(
              value,
              countryCode as CountryCode
            );
            return phoneNumber ? isValidPhoneNumber(phoneNumber) : false;
          } catch {
            return false;
          }
        },
      };

    case "DE":
      return {
        mask: "0000 0000000",
        placeholder: "0152 9876543",
        format: (value: string) => {
          const numbers = value.replace(/\D/g, "");
          if (numbers.length <= 4) {
            return numbers;
          } else {
            return `${numbers.slice(0, 4)} ${numbers.slice(4, 11)}`;
          }
        },
        validate: (value: string, countryCode: string) => {
          try {
            const phoneNumber = parsePhoneNumber(
              value,
              countryCode as CountryCode
            );
            return phoneNumber ? isValidPhoneNumber(phoneNumber) : false;
          } catch {
            return false;
          }
        },
      };

    case "FR":
      return {
        mask: "00 00 00 00 00",
        placeholder: "06 98 76 54 32",
        format: (value: string) => {
          const numbers = value.replace(/\D/g, "");
          const groups = [];
          for (let i = 0; i < numbers.length; i += 2) {
            groups.push(numbers.slice(i, i + 2));
          }
          return groups.join(" ");
        },
        validate: (value: string, countryCode: string) => {
          try {
            const phoneNumber = parsePhoneNumber(
              value,
              countryCode as CountryCode
            );
            return phoneNumber ? isValidPhoneNumber(phoneNumber) : false;
          } catch {
            return false;
          }
        },
      };

    case "IN":
      return {
        mask: "00000 00000",
        placeholder: "98765 43210",
        format: (value: string) => {
          const numbers = value.replace(/\D/g, "");
          if (numbers.length <= 5) {
            return numbers;
          } else {
            return `${numbers.slice(0, 5)} ${numbers.slice(5, 10)}`;
          }
        },
        validate: (value: string, countryCode: string) => {
          try {
            const phoneNumber = parsePhoneNumber(
              value,
              countryCode as CountryCode
            );
            return phoneNumber ? isValidPhoneNumber(phoneNumber) : false;
          } catch {
            return false;
          }
        },
      };

    case "MX":
      return {
        mask: "00 0000 0000",
        placeholder: "55 9876 5432",
        format: (value: string) => {
          const numbers = value.replace(/\D/g, "");
          if (numbers.length <= 2) {
            return numbers;
          } else if (numbers.length <= 6) {
            return `${numbers.slice(0, 2)} ${numbers.slice(2)}`;
          } else {
            return `${numbers.slice(0, 2)} ${numbers.slice(
              2,
              6
            )} ${numbers.slice(6, 10)}`;
          }
        },
        validate: (value: string, countryCode: string) => {
          try {
            const phoneNumber = parsePhoneNumber(
              value,
              countryCode as CountryCode
            );
            return phoneNumber ? isValidPhoneNumber(phoneNumber) : false;
          } catch {
            return false;
          }
        },
      };

    case "AR":
      return {
        mask: "00 0000-0000",
        placeholder: "11 9876-5432",
        format: (value: string) => {
          const numbers = value.replace(/\D/g, "");
          if (numbers.length <= 2) {
            return numbers;
          } else if (numbers.length <= 6) {
            return `${numbers.slice(0, 2)} ${numbers.slice(2)}`;
          } else {
            return `${numbers.slice(0, 2)} ${numbers.slice(
              2,
              6
            )}-${numbers.slice(6, 10)}`;
          }
        },
        validate: (value: string, countryCode: string) => {
          try {
            const phoneNumber = parsePhoneNumber(
              value,
              countryCode as CountryCode
            );
            return phoneNumber ? isValidPhoneNumber(phoneNumber) : false;
          } catch {
            return false;
          }
        },
      };

    default:
      return {
        mask: "000 000 0000",
        placeholder: "987 654 3210",
        format: (value: string) => {
          const numbers = value.replace(/\D/g, "");
          if (numbers.length <= 3) {
            return numbers;
          } else if (numbers.length <= 6) {
            return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
          } else {
            return `${numbers.slice(0, 3)} ${numbers.slice(
              3,
              6
            )} ${numbers.slice(6, 10)}`;
          }
        },
        validate: (value: string, countryCode: string) => {
          try {
            const phoneNumber = parsePhoneNumber(
              value,
              countryCode as CountryCode
            );
            return phoneNumber ? isValidPhoneNumber(phoneNumber) : false;
          } catch {
            return false;
          }
        },
      };
  }
};

export const formatPhoneNumberWithMask = (
  value: string,
  countryCode: string
): string => {
  const config = getPhoneMaskConfig(countryCode);
  return config.format(value);
};

export const validatePhoneNumber = (
  value: string,
  countryCode: string
): boolean => {
  const config = getPhoneMaskConfig(countryCode);
  return config.validate(value, countryCode);
};

export const getPlaceholderText = (countryCode: string): string => {
  const config = getPhoneMaskConfig(countryCode);
  return config.placeholder;
};

export const cleanPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, "");
};

export const applyPhoneMask = (value: string, countryCode: string): string => {
  const cleanValue = cleanPhoneNumber(value);
  return formatPhoneNumberWithMask(cleanValue, countryCode);
};
