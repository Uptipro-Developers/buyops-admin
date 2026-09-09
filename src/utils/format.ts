// ══════════════════════════════════════════════════════════════════════════
// FORMAT UTILITIES - Complete Implementation
// BUG_008 (Currency ₦), BUG_014 (Email), BUG_016 (Percentage), BUG_020 (Metrics)
// ══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// CURRENCY FORMATTING - BUG_008 FIX: Use ₦ (Nigerian Naira)
// ═══════════════════════════════════════════════════════════════════════════

type UserSettings = {
  timezone?: string;
  dateFormat?: string;
  currency?: string;
};

const DEFAULT_SETTINGS: Required<UserSettings> = {
  timezone: 'Africa/Lagos',
  dateFormat: 'DD-MM-YYYY',
  currency: 'NGN',
};

const currencyLocaleMap: Record<string, string> = {
  NGN: 'en-NG',
  USD: 'en-US',
  GBP: 'en-GB',
  EUR: 'de-DE',
};

const getStoredUserSettings = (): UserSettings => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('buyops_user');
    if (!raw) return {};
    const user = JSON.parse(raw);
    return {
      timezone: user?.timezone,
      dateFormat: user?.dateFormat,
      currency: user?.currency,
    };
  } catch {
    return {};
  }
};

const resolveSettings = (overrides?: UserSettings) => ({
  ...DEFAULT_SETTINGS,
  ...getStoredUserSettings(),
  ...(overrides || {}),
});

const resolveLocale = (currency: string) =>
  currencyLocaleMap[currency] || 'en-US';

const formatDatePattern = (date: Date, pattern: string, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const lookup: Record<string, string> = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      lookup[part.type] = part.value;
    }
  });

  const day = lookup.day || '00';
  const month = lookup.month || '00';
  const year = lookup.year || '0000';

  switch (pattern) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'DD-MM-YYYY':
    default:
      return `${day}-${month}-${year}`;
  }
};

/**
 * Formats a number as Nigerian Naira currency
 * BUG_008 FIX: Always use ₦ symbol instead of $
 */
export const formatCurrency = (
  amount: number | null | undefined,
  includeDecimals: boolean = true,
  currencyOverride?: string
): string => {
  const { currency } = resolveSettings({ currency: currencyOverride });
  const currencyCode = currency || DEFAULT_SETTINGS.currency;
  const formatter = new Intl.NumberFormat(resolveLocale(currencyCode), {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });
  if (amount === null || amount === undefined || isNaN(amount)) {
    const fallback = formatter.format(0);
    if (currencyCode === 'NGN') {
      return fallback.replace('NGN', '₦').replace(/\s+/g, '').trim();
    }
    return fallback.trim();
  }

  const formatted = formatter.format(amount);

  if (currencyCode === 'NGN') {
    return formatted.replace('NGN', '₦').replace(/\s+/g, '').trim();
  }

  return formatted.trim();
};

/**
 * Formats number with thousand separators
 */
export const formatNumber = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  return new Intl.NumberFormat('en-NG').format(amount);
};

/**
 * Formats currency in compact notation (₦1.5M, ₦500K)
 */
export const formatCompactCurrency = (
  amount: number | null | undefined,
  currencyOverride?: string
): string => {
  const { currency } = resolveSettings({ currency: currencyOverride });
  const currencyCode = currency || DEFAULT_SETTINGS.currency;
  const formatter = new Intl.NumberFormat(resolveLocale(currencyCode), {
    style: 'currency',
    currency: currencyCode,
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  if (amount === null || amount === undefined || isNaN(amount)) {
    const fallback = formatter.format(0);
    if (currencyCode === 'NGN') {
      return fallback.replace('NGN', '₦').replace(/\s+/g, '').trim();
    }
    return fallback.trim();
  }

  const formatted = formatter.format(amount);

  if (currencyCode === 'NGN') {
    return formatted.replace('NGN', '₦').replace(/\s+/g, '').trim();
  }

  return formatted.trim();
};

/**
 * Parses currency string to number
 */
export const parseCurrency = (currencyString: string): number => {
  if (!currencyString) return 0;
  const cleaned = currencyString.replace(/[₦NGN,\s]/g, '');
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
};

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL VALIDATION - BUG_014 FIX
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validates email address
 * BUG_014 FIX: Proper email validation
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Gets email validation error message
 */
export const getEmailValidationError = (email: string): string => {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }
  if (!validateEmail(email)) {
    return 'Please provide a valid email address';
  }
  return '';
};

// ═══════════════════════════════════════════════════════════════════════════
// PHONE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;
  const phoneRegex = /^[+]?[\d\s()-]{10,20}$/;
  return phoneRegex.test(phone.trim());
};

// ═══════════════════════════════════════════════════════════════════════════
// PERCENTAGE FORMATTING - BUG_016 FIX
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Formats percentage value
 * BUG_016 FIX: Properly handle percentage input
 */
export const formatPercentage = (
  value: string | number,
  decimals: number = 2
): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  const bounded = Math.max(0, Math.min(100, num));
  return bounded.toFixed(decimals);
};

/**
 * Parses percentage input (handles "5%", "5.5", "5.5%")
 */
export const parsePercentage = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[%\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, Math.min(100, num));
};

// ═══════════════════════════════════════════════════════════════════════════
// DATE FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

export const formatDate = (
  date: Date | string | null | undefined,
  dateFormatOverride?: string,
  timezoneOverride?: string
): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const { dateFormat, timezone } = resolveSettings({
    dateFormat: dateFormatOverride,
    timezone: timezoneOverride,
  });

  return formatDatePattern(d, dateFormat, timezone);
};

export const formatDateTime = (
  date: Date | string | null | undefined,
  dateFormatOverride?: string,
  timezoneOverride?: string
): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const { dateFormat, timezone } = resolveSettings({
    dateFormat: dateFormatOverride,
    timezone: timezoneOverride,
  });
  const datePart = formatDatePattern(d, dateFormat, timezone);
  const timePart = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);

  return `${datePart} ${timePart}`;
};

export const formatRelativeTime = (
  date: Date | string,
  dateFormatOverride?: string,
  timezoneOverride?: string
): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDate(d, dateFormatOverride, timezoneOverride);
};

// ═══════════════════════════════════════════════════════════════════════════
// METRIC CHANGE FORMATTING - BUG_020 FIX
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculates and formats metric change percentage
 * BUG_020 FIX: Add metric change indicators like "+12.5% from last month"
 */
export const formatMetricChange = (
  current: number,
  previous: number
): {
  percentage: number;
  isPositive: boolean;
  display: string;
  color: 'green' | 'red' | 'gray';
} => {
  if (previous === 0) {
    return {
      percentage: current > 0 ? 100 : 0,
      isPositive: current > 0,
      display: current > 0 ? '+100%' : '0%',
      color: current > 0 ? 'green' : 'gray',
    };
  }

  const change = ((current - previous) / previous) * 100;
  const isPositive = change >= 0;

  return {
    percentage: Math.abs(change),
    isPositive,
    display: `${isPositive ? '+' : '-'}${Math.abs(change).toFixed(1)}%`,
    color: isPositive ? 'green' : 'red',
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// NUMBER UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export const formatNumberWithSuffix = (num: number): string => {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// ═══════════════════════════════════════════════════════════════════════════
// STRING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export const truncate = (str: string, length: number): string => {
  if (!str || str.length <= length) return str;
  return `${str.substring(0, length)}...`;
};

export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const validateRequired = (value: any, fieldName: string): string => {
  return isEmpty(value) ? `${fieldName} is required` : '';
};

export const validateMinLength = (
  value: string,
  minLength: number,
  fieldName: string
): string => {
  if (!value || value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return '';
};

export const validateMaxLength = (
  value: string,
  maxLength: number,
  fieldName: string
): string => {
  if (value && value.length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters`;
  }
  return '';
};

export const validateRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string
): string => {
  if (value < min || value > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return '';
};

// ═══════════════════════════════════════════════════════════════════════════
// COLOR HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  const colorMap: Record<string, string> = {
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800',
    'suspended': 'bg-red-100 text-red-800',
    'published': 'bg-green-100 text-green-800',
    'draft': 'bg-gray-100 text-gray-800',
    'sold': 'bg-blue-100 text-blue-800',
    'paid': 'bg-green-100 text-green-800',
    'partial': 'bg-yellow-100 text-yellow-800',
    'overdue': 'bg-red-100 text-red-800',
    'new': 'bg-blue-100 text-blue-800',
    'contacted': 'bg-purple-100 text-purple-800',
    'qualified': 'bg-green-100 text-green-800',
    'won': 'bg-green-100 text-green-800',
    'lost': 'bg-red-100 text-red-800',
  };
  return colorMap[statusLower] || 'bg-gray-100 text-gray-800';
};

export const getRiskColor = (riskLevel: string): string => {
  const riskLower = riskLevel.toLowerCase();
  const riskMap: Record<string, string> = {
    'low': 'bg-green-100 text-green-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'high': 'bg-red-100 text-red-800',
  };
  return riskMap[riskLower] || 'bg-gray-100 text-gray-800';
};

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default {
  formatCurrency,
  formatNumber,
  formatCompactCurrency,
  parseCurrency,
  validateEmail,
  getEmailValidationError,
  validatePhone,
  formatPercentage,
  parsePercentage,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatMetricChange,
  formatNumberWithSuffix,
  formatFileSize,
  truncate,
  capitalize,
  toTitleCase,
  isEmpty,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateRange,
  getStatusColor,
  getRiskColor,
};
