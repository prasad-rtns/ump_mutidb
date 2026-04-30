export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'email' | 'url' | 'color';

export interface FieldMeta {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  maxLength?: number;
  default?: unknown;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface EntityMeta {
  label: string;
  pluralLabel: string;
  icon: string;
  apiEndpoint: string;
  idField: string;
  listColumns: string[];
  searchable: boolean;
  fields: FieldMeta[];
  permissions: { create: string[]; update: string[]; delete: string[] };
}

export const MASTER_SCHEMA: Record<string, EntityMeta> = {
  countries: {
    label: 'Country', pluralLabel: 'Countries', icon: 'globe', apiEndpoint: '/api/v1/master/countries', idField: 'id', searchable: true,
    listColumns: ['name', 'code', 'dialCode', 'currency', 'isActive'],
    permissions: { create: ['super_admin', 'admin'], update: ['super_admin', 'admin'], delete: ['super_admin'] },
    fields: [
      { name: 'name',           label: 'Country Name',   type: 'text',    required: true, maxLength: 100 },
      { name: 'code',           label: 'ISO Code (3)',   type: 'text',    required: true, maxLength: 3,  placeholder: 'e.g. IND' },
      { name: 'dialCode',       label: 'Dial Code',      type: 'text',    maxLength: 10,  placeholder: '+91' },
      { name: 'flag',           label: 'Flag Emoji',     type: 'text',    maxLength: 10 },
      { name: 'currency',       label: 'Currency Code',  type: 'text',    maxLength: 10 },
      { name: 'currencySymbol', label: 'Currency Symbol',type: 'text',    maxLength: 10 },
      { name: 'isActive',       label: 'Active',         type: 'boolean', default: true },
    ],
  },
  states: {
    label: 'State', pluralLabel: 'States', icon: 'map', apiEndpoint: '/api/v1/master/states', idField: 'id', searchable: true,
    listColumns: ['name', 'code', 'countryId', 'isActive'],
    permissions: { create: ['super_admin', 'admin'], update: ['super_admin', 'admin'], delete: ['super_admin'] },
    fields: [
      { name: 'name',      label: 'State Name', type: 'text', required: true, maxLength: 100 },
      { name: 'code',      label: 'State Code', type: 'text', required: true, maxLength: 10 },
      { name: 'countryId', label: 'Country',    type: 'select', required: true, placeholder: 'Select country' },
      { name: 'isActive',  label: 'Active',     type: 'boolean', default: true },
    ],
  },
  cities: {
    label: 'City', pluralLabel: 'Cities', icon: 'building', apiEndpoint: '/api/v1/master/cities', idField: 'id', searchable: true,
    listColumns: ['name', 'stateId', 'isActive'],
    permissions: { create: ['super_admin', 'admin'], update: ['super_admin', 'admin'], delete: ['super_admin'] },
    fields: [
      { name: 'name',      label: 'City Name', type: 'text',    required: true, maxLength: 100 },
      { name: 'stateId',   label: 'State',     type: 'select',  required: true, placeholder: 'Select state' },
      { name: 'latitude',  label: 'Latitude',  type: 'number' },
      { name: 'longitude', label: 'Longitude', type: 'number' },
      { name: 'isActive',  label: 'Active',    type: 'boolean', default: true },
    ],
  },
  categories: {
    label: 'Category', pluralLabel: 'Categories', icon: 'tag', apiEndpoint: '/api/v1/master/categories', idField: 'id', searchable: true,
    listColumns: ['name', 'code', 'parentId', 'sortOrder', 'isActive'],
    permissions: { create: ['super_admin', 'admin', 'editor'], update: ['super_admin', 'admin', 'editor'], delete: ['super_admin', 'admin'] },
    fields: [
      { name: 'name',        label: 'Category Name', type: 'text',     required: true, maxLength: 200 },
      { name: 'code',        label: 'Code',          type: 'text',     required: true, maxLength: 50 },
      { name: 'parentId',    label: 'Parent',        type: 'select',   placeholder: 'None (root)' },
      { name: 'description', label: 'Description',   type: 'textarea' },
      { name: 'icon',        label: 'Icon',          type: 'text',     maxLength: 100 },
      { name: 'sortOrder',   label: 'Sort Order',    type: 'number',   default: 0 },
      { name: 'isActive',    label: 'Active',        type: 'boolean',  default: true },
    ],
  },
  tags: {
    label: 'Tag', pluralLabel: 'Tags', icon: 'hash', apiEndpoint: '/api/v1/master/tags', idField: 'id', searchable: false,
    listColumns: ['name', 'slug', 'color', 'isActive'],
    permissions: { create: ['super_admin', 'admin', 'editor'], update: [], delete: ['super_admin', 'admin'] },
    fields: [
      { name: 'name',  label: 'Tag Name', type: 'text',  required: true, maxLength: 100 },
      { name: 'color', label: 'Color',    type: 'color' },
    ],
  },
  'document-types': {
    label: 'Document Type', pluralLabel: 'Document Types', icon: 'file-text', apiEndpoint: '/api/v1/master/document-types', idField: 'id', searchable: false,
    listColumns: ['name', 'code', 'maxSizeMb', 'isRequired', 'isActive'],
    permissions: { create: ['super_admin', 'admin'], update: ['super_admin', 'admin'], delete: ['super_admin'] },
    fields: [
      { name: 'name',        label: 'Name',          type: 'text',     required: true, maxLength: 200 },
      { name: 'code',        label: 'Code',          type: 'text',     required: true, maxLength: 50 },
      { name: 'description', label: 'Description',   type: 'textarea' },
      { name: 'maxSizeMb',   label: 'Max Size (MB)', type: 'number',   default: 10 },
      { name: 'isRequired',  label: 'Required',      type: 'boolean',  default: false },
      { name: 'isActive',    label: 'Active',        type: 'boolean',  default: true },
    ],
  },
  'service-types': {
    label: 'Service Type', pluralLabel: 'Service Types', icon: 'layers', apiEndpoint: '/api/v1/master/service-types', idField: 'id', searchable: false,
    listColumns: ['name', 'code', 'routeLink', 'icon', 'isActive'],
    permissions: { create: ['super_admin', 'admin'], update: ['super_admin', 'admin'], delete: ['super_admin'] },
    fields: [
      { name: 'name',        label: 'Service Name',  type: 'text',     required: true, maxLength: 200 },
      { name: 'code',        label: 'Code',          type: 'text',     required: true, maxLength: 50,  placeholder: 'e.g. USER_REG' },
      { name: 'description', label: 'Description',   type: 'textarea' },
      { name: 'routeLink',   label: 'Route / Link',  type: 'url',      maxLength: 500, placeholder: '/forms/user-registration' },
      { name: 'icon',        label: 'Icon Name',     type: 'text',     maxLength: 100, placeholder: 'person-add' },
      { name: 'isActive',    label: 'Active',        type: 'boolean',  default: true },
    ],
  },
  settings: {
    label: 'Setting', pluralLabel: 'System Settings', icon: 'settings', apiEndpoint: '/api/v1/master/settings', idField: 'key', searchable: false,
    listColumns: ['key', 'value', 'type', 'category', 'isPublic'],
    permissions: { create: ['super_admin'], update: ['super_admin'], delete: ['super_admin'] },
    fields: [
      { name: 'key',         label: 'Key',          type: 'text',    required: true, maxLength: 200 },
      { name: 'value',       label: 'Value',        type: 'textarea' },
      { name: 'type',        label: 'Type',         type: 'select',  default: 'string',
        options: [{ value: 'string', label: 'String' }, { value: 'number', label: 'Number' }, { value: 'boolean', label: 'Boolean' }, { value: 'json', label: 'JSON' }] },
      { name: 'description', label: 'Description',  type: 'textarea' },
      { name: 'category',    label: 'Category',     type: 'text',    default: 'general', maxLength: 100 },
      { name: 'isPublic',    label: 'Public',       type: 'boolean', default: false },
    ],
  },
};
