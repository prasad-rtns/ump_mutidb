'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import type { FieldMeta } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';

interface Props {
  fields: FieldMeta[];
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  selectOptions?: Record<string, { value: string; label: string }[]>;
}

export function DynamicForm({ fields, defaultValues = {}, onSubmit, isLoading, submitLabel, onCancel, selectOptions = {} }: Props) {
  const { t } = useTranslation();
  const visibleFields = fields.filter((field) => !field.hidden);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<Record<string, unknown>>({
    defaultValues: Object.fromEntries(visibleFields.map((field) => [field.name, defaultValues[field.name] ?? field.default ?? ''])),
  });
  const selectedSettingType = String(watch('type') ?? '').toLowerCase();

  useEffect(() => {
    reset(Object.fromEntries(visibleFields.map((field) => [field.name, defaultValues[field.name] ?? field.default ?? ''])));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultValues)]);

  function fieldLabel(field: FieldMeta) {
    const translated = t(`labels.${field.name}`);
    return translated === `labels.${field.name}` ? field.label : translated;
  }

  function effectiveFieldType(field: FieldMeta) {
    if (field.name !== 'value' || !visibleFields.some((item) => item.name === 'type')) return field.type;
    if (selectedSettingType === 'boolean') return 'setting-boolean';
    if (selectedSettingType === 'integer' || selectedSettingType === 'number') return 'number';
    if (selectedSettingType === 'url') return 'url';
    if (selectedSettingType === 'json') return 'textarea';
    if (selectedSettingType === 'color') return 'color';
    return selectedSettingType === 'text' || selectedSettingType === 'string' ? 'text' : field.type;
  }

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visibleFields.map((field) => {
          const label = fieldLabel(field);
          const inputType = effectiveFieldType(field);
          return (
            <div key={field.name} className={cn('space-y-1', inputType === 'textarea' ? 'sm:col-span-2' : '')}>
              <Label htmlFor={field.name}>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {inputType === 'textarea' && (
                <textarea
                  id={field.name}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  placeholder={field.placeholder}
                  {...register(field.name, { required: field.required ? t('common.required', { name: label }) : false })}
                />
              )}

              {inputType === 'boolean' && (
                <div className="flex items-center gap-2 h-10">
                  <input type="checkbox" id={field.name} className="h-4 w-4 rounded border-input" {...register(field.name)} />
                  <span className="text-sm text-muted-foreground">{t('common.enable')}</span>
                </div>
              )}

              {inputType === 'setting-boolean' && (
                <select
                  id={field.name}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register(field.name, { required: field.required ? t('common.required', { name: label }) : false })}
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              )}

              {inputType === 'select' && (
                <select
                  id={field.name}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register(field.name, { required: field.required ? t('common.required', { name: label }) : false })}
                >
                  <option value="">{field.placeholder || t('common.select', { name: label })}</option>
                  {(selectOptions[field.name] || field.options || []).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              )}

              {inputType === 'color' && (
                <div className="flex items-center gap-2">
                  <input type="color" id={field.name} className="h-10 w-14 rounded border" {...register(field.name)} />
                  <Input placeholder="#ffffff" {...register(field.name)} className="flex-1" />
                </div>
              )}

              {!['textarea', 'boolean', 'setting-boolean', 'select', 'color'].includes(inputType) && (
                <Input
                  id={field.name}
                  type={inputType === 'number' ? 'number' : inputType === 'email' ? 'email' : inputType === 'url' ? 'url' : 'text'}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  readOnly={field.readOnly}
                  {...register(field.name, {
                    required: field.required ? t('common.required', { name: label }) : false,
                    maxLength: field.maxLength ? { value: field.maxLength, message: t('common.maxChars', { count: field.maxLength }) } : undefined,
                  })}
                />
              )}

              {errors[field.name] && (
                <p className="text-xs text-destructive">{String((errors[field.name] as { message?: string })?.message ?? '')}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 border-t sm:flex-row sm:items-center sm:justify-end">
        {onCancel && <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>{t('common.cancel')}</Button>}
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.saving')}</> : submitLabel ?? t('common.save')}
        </Button>
      </div>
    </form>
  );
}
