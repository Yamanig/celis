import { Combobox } from "~/components/ui/combobox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export interface CountryItem {
  name: string;
  code: string;
  dialCode: string;
  /** Max national number length (digits after the dial code). */
  digits: number;
}

export const COUNTRIES: CountryItem[] = [
  { name: "Somalia", code: "SO", dialCode: "+252", digits: 9 },
  { name: "Kenya", code: "KE", dialCode: "+254", digits: 9 },
  { name: "Ethiopia", code: "ET", dialCode: "+251", digits: 9 },
  { name: "Djibouti", code: "DJ", dialCode: "+253", digits: 8 },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", digits: 9 },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", digits: 9 },
  { name: "Turkey", code: "TR", dialCode: "+90", digits: 10 },
  { name: "United Kingdom", code: "GB", dialCode: "+44", digits: 10 },
  { name: "United States", code: "US", dialCode: "+1", digits: 10 },
  { name: "Uganda", code: "UG", dialCode: "+256", digits: 9 },
  { name: "Tanzania", code: "TZ", dialCode: "+255", digits: 9 },
  { name: "Egypt", code: "EG", dialCode: "+20", digits: 10 },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

const options = COUNTRIES.map((c) => ({
  value: c.code,
  label: `${c.name} (${c.dialCode})`,
}));

export function PhoneInput({
  country,
  onCountryChange,
  national,
  onNationalChange,
  disabled,
  autoFocus,
}: {
  country: CountryItem;
  onCountryChange: (country: CountryItem) => void;
  national: string;
  onNationalChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="phone-national">Phone number</Label>
      <div className="grid grid-cols-[9rem_1fr] gap-2">
        <Combobox
          value={country.code}
          onValueChange={(code) => {
            const next = COUNTRIES.find((c) => c.code === code);
            if (next) onCountryChange(next);
          }}
          options={options}
          label="Country code"
          searchPlaceholder="Search country…"
          disabled={disabled}
        />
        <Input
          id="phone-national"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder="61 234 5678"
          value={national}
          onChange={(e) => {
            let digits = e.target.value.replace(/\D/g, "");
            digits = digits.replace(/^0+/, "");
            onNationalChange(digits.slice(0, country.digits));
          }}
        />
      </div>
      <p className="text-xs text-celis-ink-tertiary">
        We&apos;ll send a 6-digit code to this number on WhatsApp.
      </p>
    </div>
  );
}
