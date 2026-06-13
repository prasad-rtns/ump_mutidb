'use client';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Eye, Loader2, LockKeyhole, Pencil, Plus, Search, SlidersHorizontal, Trash2, Upload, UserRound, X } from 'lucide-react';
import { authApi, apiErrorMessage, documentApi } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { usePaginationSettings } from '@/hooks/use-pagination-settings';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { PaginationControls } from '@/components/pagination/pagination-controls';
import { ColumnHeader, activeFilterCount, applyColumnFilters, applyColumnSort, nextSort, type ColumnFilters, type ColumnSort } from '@/components/data-grid/column-tools';
import { useTranslation } from '@/i18n';
import type { IUser, IDepartment, IRole, IDesignation, ICompanyOrUtility, UserCategory } from '@/types';

interface Props { category: UserCategory; title: string }

type SelectOption = { value: string; label: string };
type UserFormValues = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  roleId: string;
  companyId: string;
  departmentId: string;
  designationId: string;
  status: string;
  avatar: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
};

interface UserFormProps {
  mode: 'create' | 'edit';
  title: string;
  user?: IUser | null;
  selectOptions: Record<string, SelectOption[]>;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}

interface UploadedDocument {
  id: string;
  url: string;
  mimeType: string;
  size: number;
}

const PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PROFILE_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

const CATEGORY_PERMISSIONS: Record<UserCategory, { read: string[]; create: string[]; update: string[]; delete: string[] }> = {
  external: {
    read: ['users:*', 'external-users:*', 'external-users:read'],
    create: ['users:*', 'external-users:*', 'external-users:create'],
    update: ['users:*', 'external-users:*', 'external-users:update'],
    delete: ['users:*', 'external-users:*', 'external-users:delete'],
  },
  internal: {
    read: ['users:*', 'internal-users:*', 'internal-users:read'],
    create: ['users:*', 'internal-users:*', 'internal-users:create'],
    update: ['users:*', 'internal-users:*', 'internal-users:update'],
    delete: ['users:*', 'internal-users:*', 'internal-users:delete'],
  },
  admin: {
    read: ['users:*', 'admin-users:*', 'admin-users:read'],
    create: ['users:*', 'admin-users:*', 'admin-users:create'],
    update: ['users:*', 'admin-users:*', 'admin-users:update'],
    delete: ['users:*', 'admin-users:*', 'admin-users:delete'],
  },
};

function statusVariant(status: string) {
  if (status === 'active') return 'success' as const;
  if (status === 'suspended') return 'destructive' as const;
  return 'secondary' as const;
}

function userName(user: IUser) {
  return `${user.firstName} ${user.lastName}`.trim();
}

function relationName(value: unknown, fallback?: string | null) {
  return typeof value === 'object' && value && 'name' in value ? String((value as { name?: unknown }).name ?? '') : (fallback || '-');
}

function displayAvatarUrl(url?: string | null) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if ((parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') && parsed.pathname.startsWith('/uploads/')) {
      return `/proxy/document-uploads${parsed.pathname.slice('/uploads'.length)}`;
    }
  } catch {
    if (url.startsWith('/uploads/')) return `/proxy/document-uploads${url.slice('/uploads'.length)}`;
  }
  return url;
}

const AVATAR_COLORS = [
  'bg-emerald-700 text-white',
  'bg-violet-600 text-white',
  'bg-sky-600 text-white',
  'bg-amber-600 text-white',
  'bg-indigo-700 text-white',
  'bg-slate-700 text-white',
  'bg-teal-700 text-white',
  'bg-rose-600 text-white',
];

function userInitial(user: IUser) {
  return (user.firstName || user.lastName || user.username || user.email || '?').trim().charAt(0).toUpperCase();
}

function avatarColor(user: IUser) {
  const seed = (user.id || user.username || user.email || userName(user)).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[seed % AVATAR_COLORS.length];
}

function formatLastLogin(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} min ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} hours ago`;
  if (diffMs < day * 30) return `${Math.floor(diffMs / day)} days ago`;
  return date.toLocaleDateString();
}

function initialFormValues(user?: IUser | null): UserFormValues {
  return {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    username: user?.username ?? '',
    email: user?.email ?? '',
    password: '',
    phone: user?.phone ?? '',
    roleId: user?.roleId ?? '',
    companyId: user?.companyId ?? '',
    departmentId: user?.departmentId ?? '',
    designationId: user?.designationId ?? '',
    status: user?.status ?? 'active',
    avatar: user?.avatar ?? '',
    isEmailVerified: user?.isEmailVerified ?? false,
    twoFactorEnabled: user?.twoFactorEnabled ?? false,
  };
}

async function hasValidImageSignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === 'image/jpeg') return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === 'image/png') {
    return bytes.length > 8
      && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  }
  if (file.type === 'image/webp') {
    return bytes.length > 12
      && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  }
  return false;
}

async function validateProfilePhoto(file: File): Promise<string | null> {
  if (!PROFILE_PHOTO_TYPES.includes(file.type)) return 'type';
  if (file.size > PROFILE_PHOTO_MAX_BYTES) return 'size';
  if (!(await hasValidImageSignature(file))) return 'signature';
  return null;
}

async function uploadProfilePhoto(file: File, entityId?: string): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('name', file.name);
  if (entityId) form.append('entityId', entityId);
  const response = await documentApi.post('/documents/upload/profile-photo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const doc = response.data?.data as UploadedDocument | undefined;
  if (!doc?.url) throw new Error('uploadMissingUrl');
  return doc.url;
}

function UserAvatar({ user, size = 'md' }: { user: IUser; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-20 w-20' : size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  const textClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-base';
  const avatarUrl = displayAvatarUrl(user.avatar);
  return (
    <div className={`${sizeClass} shrink-0 overflow-hidden rounded-lg border bg-muted`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={userName(user)} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div className={`flex h-full w-full items-center justify-center font-bold uppercase ${textClass} ${avatarColor(user)}`}>
          {userInitial(user)}
        </div>
      )}
    </div>
  );
}

function AuthBadges({ user }: { user: IUser }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="outline" className="gap-1 rounded-md">
        <LockKeyhole className="h-3 w-3" /> Password
      </Badge>
      <Badge variant={user.isEmailVerified ? 'secondary' : 'warning'} className="rounded-md">
        {user.isEmailVerified ? 'Verified' : 'Unverified'}
      </Badge>
    </div>
  );
}

function MfaStatus({ user }: { user: IUser }) {
  if (user.twoFactorEnabled) {
    return <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700"><Check className="h-3.5 w-3.5" /> Enabled</span>;
  }
  return <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /> No MFA</span>;
}

function UserForm({ mode, title, user, selectOptions, isLoading, onCancel, onSubmit }: UserFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<UserFormValues>(() => initialFormValues(user));
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(displayAvatarUrl(values.avatar));
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    if (!photoFile) {
      setPreviewUrl(displayAvatarUrl(values.avatar));
      return;
    }
    const objectUrl = URL.createObjectURL(photoFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile, values.avatar]);

  function setField(name: keyof UserFormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleFileChange(file?: File) {
    setFileError('');
    if (!file) {
      setPhotoFile(null);
      return;
    }
    const error = await validateProfilePhoto(file);
    const translatedError = error === 'type' ? t('users.imageTypeError') : error === 'size' ? t('users.imageSizeError') : error === 'signature' ? t('users.imageSignatureError') : error;
    if (error) {
      setFileError(translatedError || '');
      setPhotoFile(null);
      return;
    }
    setPhotoFile(file);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFileError('');

    let avatar = values.avatar.trim();
    try {
      if (photoFile) avatar = await uploadProfilePhoto(photoFile, user?.id);
    } catch (error) {
      const message = error instanceof Error && error.message === 'uploadMissingUrl'
        ? t('users.uploadMissingUrl')
        : apiErrorMessage(error);
      setFileError(message);
      return;
    }

    const phone = values.phone.trim();
    const payload: Record<string, unknown> = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone: phone || null,
      avatar: avatar || null,
      roleId: values.roleId,
      companyId: values.companyId || null,
      departmentId: values.departmentId,
      designationId: values.designationId,
      isEmailVerified: values.isEmailVerified,
      twoFactorEnabled: values.twoFactorEnabled,
    };

    if (mode === 'create') {
      payload.username = values.username.trim();
      payload.email = values.email.trim();
      payload.password = values.password;
    } else {
      payload.status = values.status;
    }

    await onSubmit(payload);
  }

  return (
    <form className="rounded-lg border bg-card p-4" onSubmit={submit}>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">{mode === 'create' ? t('users.newUser', { type: title }) : t('users.editUser', { name: user ? userName(user) : '' })}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t('users.photoHelp')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 overflow-hidden rounded-full border bg-muted">
            {previewUrl ? (
              <img src={previewUrl} alt={t('users.profilePreview')} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground"><UserRound className="h-7 w-7" /></div>
            )}
          </div>
          <div>
            <Label htmlFor="avatarFile" className="inline-flex h-9 cursor-pointer items-center rounded-md border px-3 text-sm font-medium">
              <Upload className="me-2 h-4 w-4" /> {t('users.photo')}
            </Label>
            <input id="avatarFile" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => handleFileChange(event.target.files?.[0])} />
          </div>
        </div>
      </div>

      {fileError && <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{fileError}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('auth.firstName')} required><Input value={values.firstName} onChange={(e) => setField('firstName', e.target.value)} required maxLength={100} /></Field>
        <Field label={t('auth.lastName')} required><Input value={values.lastName} onChange={(e) => setField('lastName', e.target.value)} required maxLength={100} /></Field>
        <Field label={t('auth.username')} required>
          <Input value={values.username} onChange={(e) => setField('username', e.target.value)} required={mode === 'create'} readOnly={mode === 'edit'} maxLength={50} />
        </Field>
        <Field label={t('auth.email')} required>
          <Input type="email" value={values.email} onChange={(e) => setField('email', e.target.value)} required={mode === 'create'} readOnly={mode === 'edit'} />
        </Field>
        {mode === 'create' && <Field label={t('auth.password')} required><Input type="password" value={values.password} onChange={(e) => setField('password', e.target.value)} required /></Field>}
        <Field label={t('auth.phone')}><Input value={values.phone} onChange={(e) => setField('phone', e.target.value)} /></Field>
        <Field label={t('auth.role')} required><Select value={values.roleId} options={selectOptions.roleId} placeholder={t('auth.selectRole')} onChange={(value) => setField('roleId', value)} required /></Field>
        <Field label={t('users.companyUtility')}><Select value={values.companyId} options={selectOptions.companyId} placeholder={t('common.select', { name: t('users.companyUtility') })} onChange={(value) => setField('companyId', value)} /></Field>
        <Field label={t('auth.department')} required><Select value={values.departmentId} options={selectOptions.departmentId} placeholder={t('auth.selectDepartment')} onChange={(value) => setField('departmentId', value)} required /></Field>
        <Field label={t('auth.designation')} required><Select value={values.designationId} options={selectOptions.designationId} placeholder={t('auth.selectDesignation')} onChange={(value) => setField('designationId', value)} required /></Field>
        <div className="space-y-3 rounded-md border bg-muted/20 p-3 sm:col-span-2">
          <div>
            <p className="text-sm font-semibold">Access settings</p>
            <p className="text-xs text-muted-foreground">Configure login verification and multi-factor access for this user.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              label="Email verified"
              description="Mark the user's email as verified."
              checked={values.isEmailVerified}
              onChange={(checked) => setField('isEmailVerified', checked)}
            />
            <ToggleField
              label="MFA enabled"
              description="Show this account as protected by MFA."
              checked={values.twoFactorEnabled}
              onChange={(checked) => setField('twoFactorEnabled', checked)}
            />
          </div>
        </div>
        {mode === 'edit' && (
          <Field label={t('users.status')} required>
            <Select
              value={values.status}
              options={[{ value: 'active', label: t('users.active') }, { value: 'inactive', label: t('users.inactive') }, { value: 'suspended', label: t('users.suspended') }]}
              placeholder={t('common.select', { name: t('users.status') })}
              onChange={(value) => setField('status', value)}
              required
            />
          </Field>
        )}
      </div>

      <div className="mt-4 flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
          {isLoading ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{t('common.saving')}</> : mode === 'create' ? t('users.createUser') : t('users.updateUser')}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>
        {label}
        {required && <span className="ms-1 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function ToggleField({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-md border bg-background px-3 py-2 transition-colors hover:bg-muted/40">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-input"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

function Select({
  value,
  options,
  placeholder,
  required,
  onChange,
}: {
  value: string;
  options?: SelectOption[];
  placeholder: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      value={value}
      required={required}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {(options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

function UserDetails({ user, onClose }: { user: IUser; onClose: () => void }) {
  const { t } = useTranslation();
  const empty = t('common.dash');
  const formatDateTime = (value?: string | null) => value ? new Date(value).toLocaleString() : empty;
  const sections = [
    {
      title: 'Identity',
      rows: [
        ['User ID', user.id],
        ['First Name', user.firstName || empty],
        ['Middle Name', user.middleName || empty],
        ['Last Name', user.lastName || empty],
        [t('auth.username'), `@${user.username}`],
        [t('auth.email'), user.email],
        [t('auth.phone'), user.phone || empty],
        ['Avatar URL', user.avatar || empty],
      ],
    },
    {
      title: 'Organization',
      rows: [
        [t('auth.role'), relationName(user.role, user.roleId)],
        [t('users.companyUtility'), relationName(user.company, user.companyId)],
        [t('auth.department'), relationName(user.department, user.departmentId)],
        [t('auth.designation'), relationName(user.designation, user.designationId)],
        [t('dashboard.category'), user.userCategory],
        [t('users.status'), user.status],
      ],
    },
    {
      title: 'Access',
      rows: [
        ['Email Verified', user.isEmailVerified ? 'Yes' : 'No'],
        ['MFA Enabled', user.twoFactorEnabled ? 'Yes' : 'No'],
        ['Failed Login Attempts', String(user.failedLoginAttempts ?? 0)],
        ['Locked Until', formatDateTime(user.lockUntil)],
        ['Last Login', user.lastLoginAt ? `${formatLastLogin(user.lastLoginAt)} (${formatDateTime(user.lastLoginAt)})` : empty],
        ['Last Login IP', user.lastLoginIp || empty],
      ],
    },
    {
      title: 'Record',
      rows: [
        [t('users.created'), formatDateTime(user.createdAt)],
        ['Created By', user.createdBy || empty],
        [t('users.updated'), formatDateTime(user.updatedAt)],
        ['Updated By', user.updatedBy || empty],
      ],
    },
    {
      title: 'Reference IDs',
      rows: [
        ['Role ID', user.roleId || empty],
        ['Company / Utility ID', user.companyId || empty],
        ['Department ID', user.departmentId || empty],
        ['Designation ID', user.designationId || empty],
      ],
    },
  ];

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar user={user} size="lg" />
          <div className="min-w-0">
            <h3 className="break-words text-lg font-semibold">{userName(user)}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
              <Badge variant="outline" className="capitalize">{user.userCategory}</Badge>
            </div>
          </div>
        </div>
        <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label={t('users.closeDetails')}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h4 className="text-sm font-semibold">{section.title}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {section.rows.map(([label, value]) => (
                <div key={`${section.title}-${label}`} className="rounded-md border bg-background px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-1 break-words text-sm">{value}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function UserTable({ category, title }: Props) {
  const qc = useQueryClient();
  const { canAny } = useAuth();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<IUser | null>(null);
  const [viewUser, setViewUser] = useState<IUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});
  const [columnSort, setColumnSort] = useState<ColumnSort>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const { rowsPerPage } = usePaginationSettings();
  const permissionSet = CATEGORY_PERMISSIONS[category];

  const canRead = canAny(permissionSet.read);
  const canCreate = canAny(permissionSet.create);
  const canUpdate = canAny(permissionSet.update);
  const canDelete = canAny(permissionSet.delete);

  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  const { data: roles } = useQuery<IRole[]>({ queryKey: ['roles'], queryFn: async () => (await authApi.get('/auth/master/roles')).data.data });
  const { data: companies } = useQuery<ICompanyOrUtility[]>({ queryKey: ['companies'], queryFn: async () => (await authApi.get('/auth/master/companies')).data.data });
  const { data: departments } = useQuery<IDepartment[]>({ queryKey: ['departments'], queryFn: async () => (await authApi.get('/auth/master/departments')).data.data });
  const { data: designations } = useQuery<IDesignation[]>({ queryKey: ['designations'], queryFn: async () => (await authApi.get('/auth/master/designations')).data.data });

  const { data, isLoading } = useQuery({
    queryKey: ['users', category, page, search, rowsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(rowsPerPage), userCategory: category });
      if (search) params.set('search', search);
      const { data } = await authApi.get(`/users?${params}`);
      const payload = data.data;
      if (Array.isArray(payload)) {
        const start = (page - 1) * rowsPerPage;
        return { users: payload.slice(start, start + rowsPerPage) as IUser[], total: payload.length };
      }
      return { users: (payload.data ?? []) as IUser[], total: payload.total ?? 0 };
    },
    enabled: canRead,
  });

  const createMut = useMutation({ mutationFn: (body: Record<string, unknown>) => authApi.post('/users', { ...body, userCategory: category }) });
  const updateMut = useMutation({ mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => authApi.put(`/users/${id}`, body) });
  const deleteMut = useMutation({ mutationFn: (id: string) => authApi.delete(`/users/${id}`) });
  const statusMut = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => authApi.patch(`/users/${id}/status`, { status }) });

  function invalidate() { qc.invalidateQueries({ queryKey: ['users', category] }); }

  async function onCreate(values: Record<string, unknown>) {
    setSaving(true);
    try {
      await createMut.mutateAsync(values);
      invalidate();
      toast({ title: t('users.userCreated') });
      setShowCreate(false);
    } catch (e) {
      toast({ title: t('common.error'), description: apiErrorMessage(e), variant: 'destructive' });
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function onUpdate(values: Record<string, unknown>) {
    if (!editUser) return;
    setSaving(true);
    try {
      await updateMut.mutateAsync({ id: editUser.id, body: values });
      invalidate();
      toast({ title: t('users.userUpdated') });
      setEditUser(null);
    } catch (e) {
      toast({ title: t('common.error'), description: apiErrorMessage(e), variant: 'destructive' });
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm(t('users.deleteConfirm'))) return;
    try {
      await deleteMut.mutateAsync(id);
      invalidate();
      toast({ title: t('users.userDeleted') });
      if (viewUser?.id === id) setViewUser(null);
    } catch (e) {
      toast({ title: t('common.error'), description: apiErrorMessage(e), variant: 'destructive' });
    }
  }

  async function onToggleStatus(u: IUser) {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    try {
      await statusMut.mutateAsync({ id: u.id, status: newStatus });
      invalidate();
    } catch (e) {
      toast({ title: t('common.error'), description: apiErrorMessage(e), variant: 'destructive' });
    }
  }

  const selectOptions = {
    roleId: roles?.map((r) => ({ value: r.id, label: r.name })) ?? [],
    companyId: companies?.map((c) => ({ value: c.id, label: `${c.name} (${c.type})` })) ?? [],
    departmentId: departments?.map((d) => ({ value: d.id, label: d.name })) ?? [],
    designationId: designations?.map((d) => ({ value: d.id, label: d.name })) ?? [],
  };
  const users = data?.users ?? [];
  const userColumns = useMemo(() => [
    { key: 'user', label: 'User', value: (user: IUser) => `${userName(user)} ${user.email} @${user.username}` },
    { key: 'status', label: t('users.status'), value: (user: IUser) => user.status },
    { key: 'role', label: 'Roles', value: (user: IUser) => relationName(user.role, user.roleId) },
    { key: 'orgUnit', label: 'Org Unit', value: (user: IUser) => relationName(user.department, user.departmentId) },
    { key: 'auth', label: 'Auth', value: (user: IUser) => `Password ${user.isEmailVerified ? 'Verified' : 'Unverified'}` },
    { key: 'mfa', label: 'MFA', value: (user: IUser) => user.twoFactorEnabled ? 'Enabled' : 'No MFA' },
    { key: 'lastLogin', label: 'Last Login', value: (user: IUser) => formatLastLogin(user.lastLoginAt) },
  ], [t]);
  const filteredUsers = useMemo(() => {
    const filtered = applyColumnFilters(users, columnFilters, (user, key) => userColumns.find((column) => column.key === key)?.value(user) ?? '');
    return applyColumnSort(filtered, columnSort, (user, key) => userColumns.find((column) => column.key === key)?.value(user) ?? '');
  }, [columnFilters, columnSort, userColumns, users]);
  const usesClientPaging = users.length > rowsPerPage && data?.total === users.length;
  const renderedUsers = useMemo(() => {
    if (!usesClientPaging) return filteredUsers;
    const start = (page - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage, usesClientPaging]);
  const paginationTotal = usesClientPaging ? filteredUsers.length : data?.total ?? 0;
  const filterCount = activeFilterCount(columnFilters);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(paginationTotal / rowsPerPage));
    if (page > maxPage) setPage(maxPage);
  }, [page, paginationTotal, rowsPerPage]);

  useEffect(() => {
    if (!showCreate && !editUser) return;
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [editUser, showCreate]);

  if (!canRead) {
    return <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">{t('users.notAllowed', { type: title.toLowerCase() })}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="ps-8" placeholder={t('common.searchWithName', { name: t('users.users') })} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {filterCount > 0 && (
            <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => setColumnFilters({})}>
              <X className="me-1 h-4 w-4" /> Clear {filterCount} filter{filterCount === 1 ? '' : 's'}
            </Button>
          )}
          {canCreate && (
            <Button size="sm" className="w-full sm:w-auto" onClick={() => { setShowCreate(true); setEditUser(null); setViewUser(null); }}>
              <Plus className="me-1 h-4 w-4" /> {t('users.addUser')}
            </Button>
          )}
        </div>
      </div>

      {showCreate && (
        <div ref={formRef} className="scroll-mt-20 rounded-lg ring-2 ring-primary/10">
          <UserForm mode="create" title={title} selectOptions={selectOptions} isLoading={saving} onSubmit={onCreate} onCancel={() => setShowCreate(false)} />
        </div>
      )}

      {editUser && (
        <div ref={formRef} className="scroll-mt-20 rounded-lg ring-2 ring-primary/10">
          <UserForm mode="edit" title={title} user={editUser} selectOptions={selectOptions} isLoading={saving} onSubmit={onUpdate} onCancel={() => setEditUser(null)} />
        </div>
      )}

      {viewUser && <UserDetails user={viewUser} onClose={() => setViewUser(null)} />}

      <div className="hidden overflow-hidden rounded-lg border bg-card shadow-sm md:block">
        <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span>{title}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} loaded users
          </span>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {userColumns.map((column) => (
                <th key={column.key} className="align-top px-4 py-3 text-start font-medium text-muted-foreground">
                  <ColumnHeader
                    label={column.label}
                    filterValue={columnFilters[column.key] ?? ''}
                    sortDirection={columnSort?.key === column.key ? columnSort.direction : undefined}
                    onFilterChange={(value) => setColumnFilters((current) => ({ ...current, [column.key]: value }))}
                    onSort={() => setColumnSort((current) => nextSort(current, column.key))}
                  />
                </th>
              ))}
              <th className="px-4 py-3 text-end font-medium text-muted-foreground">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
            )}
            {!isLoading && users.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">{t('users.noUsers')}</td></tr>
            )}
            {!isLoading && users.length > 0 && filteredUsers.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No users match the active filters</td></tr>
            )}
            {!isLoading && renderedUsers.map((u) => (
              <tr key={u.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={u} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium leading-tight">{userName(u)}</p>
                      <p className="break-all text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(u.status)} className={canUpdate ? 'cursor-pointer' : ''} onClick={() => canUpdate && onToggleStatus(u)}>
                    {u.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 capitalize">
                  <Badge variant="secondary" className="rounded-md">{relationName(u.role, u.roleId)}</Badge>
                </td>
                <td className="px-4 py-3">{relationName(u.department, u.departmentId)}</td>
                <td className="px-4 py-3"><AuthBadges user={u} /></td>
                <td className="px-4 py-3"><MfaStatus user={u} /></td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{formatLastLogin(u.lastLoginAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setViewUser(u); setShowCreate(false); setEditUser(null); }}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {canUpdate && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditUser(u); setShowCreate(false); setViewUser(null); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(u.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {isLoading && <div className="rounded-md border bg-card py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>}
        {!isLoading && filteredUsers.length === 0 && <div className="rounded-md border bg-card px-4 py-8 text-center text-sm text-muted-foreground">{t('users.noUsers')}</div>}
        {!isLoading && renderedUsers.map((u) => (
          <div key={u.id} className="rounded-md border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <UserAvatar user={u} />
                <div className="min-w-0">
                  <p className="break-words font-medium">{userName(u)}</p>
                  <p className="break-all text-sm text-muted-foreground">{u.email}</p>
                </div>
              </div>
              <Badge variant={statusVariant(u.status)} className={canUpdate ? 'cursor-pointer shrink-0' : 'shrink-0'} onClick={() => canUpdate && onToggleStatus(u)}>
                {u.status}
              </Badge>
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <DetailRow label={t('auth.username')} value={`@${u.username}`} />
              <DetailRow label={t('auth.role')} value={relationName(u.role, u.roleId)} />
              <DetailRow label="Org Unit" value={relationName(u.department, u.departmentId)} />
              <DetailRow label="Auth" value={`Password, ${u.isEmailVerified ? 'Verified' : 'Unverified'}`} />
              <DetailRow label="MFA" value={u.twoFactorEnabled ? 'Enabled' : 'No MFA'} />
              <DetailRow label="Last Login" value={formatLastLogin(u.lastLoginAt)} />
            </div>

            <div className="mt-4 flex gap-2 border-t pt-3">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setViewUser(u); setShowCreate(false); setEditUser(null); }}>
                <Eye className="me-2 h-3.5 w-3.5" /> {t('common.view')}
              </Button>
              {canUpdate && (
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditUser(u); setShowCreate(false); setViewUser(null); }}>
                  <Pencil className="me-2 h-3.5 w-3.5" /> {t('common.edit')}
                </Button>
              )}
              {canDelete && (
                <Button size="sm" variant="outline" className="flex-1 text-destructive hover:text-destructive" onClick={() => onDelete(u.id)}>
                  <Trash2 className="me-2 h-3.5 w-3.5" /> {t('common.delete')}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <PaginationControls page={page} pageSize={rowsPerPage} total={paginationTotal} onPageChange={setPage} itemLabel={t('users.users')} />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{value}</span>
    </div>
  );
}
