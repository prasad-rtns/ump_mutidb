export interface Country { id: string; name: string; code: string; dialCode: string | null; flag: string | null; currency: string | null; currencySymbol: string | null; isActive: boolean; createdAt: Date; updatedAt: Date; }
export interface State   { id: string; name: string; code: string; countryId: string; isActive: boolean; createdAt: Date; updatedAt: Date; }
export interface City    { id: string; name: string; stateId: string; latitude: string | null; longitude: string | null; isActive: boolean; createdAt: Date; updatedAt: Date; }
export interface Category{ id: string; name: string; code: string; parentId: string | null; description: string | null; icon: string | null; sortOrder: number; isActive: boolean; metadata: Record<string,unknown> | null; createdAt: Date; updatedAt: Date; }
export interface Tag     { id: string; name: string; slug: string; color: string | null; isActive: boolean; createdAt: Date; updatedAt: Date; }
export interface DocumentType { id: string; name: string; code: string; description: string | null; allowedMimeTypes: string[]; maxSizeMb: number; isRequired: boolean; isActive: boolean; createdAt: Date; updatedAt: Date; }
export interface SystemSetting{ id: string; key: string; value: string | null; type: string; description: string | null; isPublic: boolean; category: string; createdAt: Date; updatedAt: Date; }
export interface NotificationTemplate { id: string; name: string; code: string; type: string; subject: string | null; body: string; variables: string[]; isActive: boolean; createdAt: Date; updatedAt: Date; }

// ─── DTO types ────────────────────────────────────────────────────────────────
export interface CreateCountryDTO  { name: string; code: string; dialCode?: string; flag?: string; currency?: string; currencySymbol?: string; }
export interface CreateStateDTO    { name: string; code: string; countryId: string; }
export interface CreateCityDTO     { name: string; stateId: string; latitude?: string; longitude?: string; }
export interface CreateCategoryDTO { name: string; code: string; parentId?: string; description?: string; icon?: string; sortOrder?: number; metadata?: Record<string,unknown>; }
export interface CreateTagDTO      { name: string; color?: string; }
export interface CreateDocumentTypeDTO { name: string; code: string; description?: string; allowedMimeTypes?: string[]; maxSizeMb?: number; isRequired?: boolean; }
export interface UpsertSettingDTO  { key: string; value?: string; type?: string; description?: string; isPublic?: boolean; category?: string; }

// Generic update = partial of create
export type UpdateCountryDTO  = Partial<CreateCountryDTO>  & { isActive?: boolean };
export type UpdateCategoryDTO = Partial<CreateCategoryDTO> & { isActive?: boolean };

export interface ServiceType  { id: string; name: string; code: string; description: string | null; routeLink: string | null; icon: string | null; isActive: boolean; createdAt: Date; updatedAt: Date; }

export interface CreateServiceTypeDTO { name: string; code: string; description?: string; routeLink?: string; icon?: string; }
export type UpdateServiceTypeDTO = Partial<CreateServiceTypeDTO> & { isActive?: boolean };

export interface EntityFilter { search?: string; isActive?: boolean; [key: string]: unknown; }
