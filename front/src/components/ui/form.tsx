import { type InputHTMLAttributes, forwardRef } from "react";
import { Input } from "@/components/ui/input";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  optional?: boolean;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, optional, id, className, ...props }, ref) => {
    const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="flex items-center gap-1 text-sm font-medium">
          {label}
          {optional && <span className="ml-1 text-xs text-muted-foreground">(opcional)</span>}
        </label>
        <Input
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          className={className}
          {...props}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
FormField.displayName = "FormField";

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}

export function FormSelect({ label, error, optional, id, children, className, ...props }: FormSelectProps) {
  const selectId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="flex items-center gap-1 text-sm font-medium">
        {label}
        {optional && <span className="ml-1 text-xs text-muted-foreground">(opcional)</span>}
      </label>
      <select
        id={selectId}
        aria-invalid={Boolean(error)}
        className={`flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary ${className ?? ""}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  optional?: boolean;
}

export function FormTextarea({ label, error, optional, id, className, ...props }: FormTextareaProps) {
  const areaId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={areaId} className="flex items-center gap-1 text-sm font-medium">
        {label}
        {optional && <span className="ml-1 text-xs text-muted-foreground">(opcional)</span>}
      </label>
      <textarea
        id={areaId}
        aria-invalid={Boolean(error)}
        className={`flex min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary ${className ?? ""}`}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
