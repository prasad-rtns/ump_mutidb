'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import type { FieldMeta } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Props {
  fields: FieldMeta[];
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  /** Lookup options for select fields: { fieldName: [{value, label}] } */
  selectOptions?: Record<string, { value: string; label: string }[]>;
}

export function DynamicForm({ fields, defaultValues = {}, onSubmit, isLoading, submitLabel = 'Save', onCancel, selectOptions = {} }: Props) {
  const visibleFields = fields.filter((f) => !f.hidden);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Record<string, unknown>>({
    defaultValues: Object.fromEntries(visibleFields.map((f) => [f.name, defaultValues[f.name] ?? f.default ?? ''])),
  });

  useEffect(() => {
    reset(Object.fromEntries(visibleFields.map((f) => [f.name, defaultValues[f.name] ?? f.default ?? ''])));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultValues)]);

  return (
    <form onSubmit={handleSubmit((d) => onSubmit(d))} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visibleFields.map((field) => (
          <div key={field.name} className={cn('space-y-1', field.type === 'textarea' ? 'sm:col-span-2' : '')}>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {field.type === 'textarea' && (
              <textarea
                id={field.name}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                placeholder={field.placeholder}
                {...register(field.name, { required: field.required ? `${field.label} is required` : false })}
              />
            )}

            {field.type === 'boolean' && (
              <div className="flex items-center gap-2 h-10">
                <input
                  type="checkbox"
                  id={field.name}
                  className="h-4 w-4 rounded border-input"
                  {...register(field.name)}
                />
                <span className="text-sm text-muted-foreground">Enable</span>
              </div>
            )}

            {field.type === 'select' && (
              <select
                id={field.name}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register(field.name, { required: field.required ? `${field.label} is required` : false })}
              >
                <option value="">{field.placeholder || `Select ${field.label}`}</option>
                {(selectOptions[field.name] || field.options || []).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}

            {field.type === 'color' && (
              <div className="flex items-center gap-2">
                <input type="color" id={field.name} className="h-10 w-14 rounded border" {...register(field.name)} />
                <Input placeholder="#ffffff" {...register(field.name)} className="flex-1" />
              </div>
            )}

            {!['textarea', 'boolean', 'select', 'color'].includes(field.type) && (
              <Input
                id={field.name}
                type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                readOnly={field.readOnly}
                {...register(field.name, {
                  required: field.required ? `${field.label} is required` : false,
                  maxLength: field.maxLength ? { value: field.maxLength, message: `Max ${field.maxLength} chars` } : undefined,
                })}
              />
            )}

            {errors[field.name] && (
              <p className="text-xs text-destructive">{String((errors[field.name] as { message?: string })?.message ?? '')}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : submitLabel}
        </Button>
      </div>
    </form>
  );
}
