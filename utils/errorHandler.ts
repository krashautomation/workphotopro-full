/**
 * Error Handler Utility
 * Converts Appwrite and other technical errors into user-friendly messages
 * Prevents technical error details from being shown to users
 */

type AppwriteError = {
  message?: string;
  code?: number;
  type?: string;
  response?: {
    message?: string;
    code?: number;
    type?: string;
  };
  name?: string;
  stack?: string;
};

/**
 * Maps Appwrite error types to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'user_invalid_credentials': 'Invalid email or password. Please check your credentials.',
  'user_not_found': 'No account found with this email. Please sign up first.',
  'user_email_already_exists': 'An account with this email already exists.',
  'user_blocked': 'Your account has been blocked. Please contact support.',
  'user_email_not_confirmed': 'Please verify your email before signing in. Check your inbox for a verification code.',
  'session_already_exists': 'You are already signed in.',
  'session_invalid': 'Your session has expired. Please sign in again.',
  
  // Permission errors
  'general_unauthorized_scope': 'You don\'t have permission to perform this action.',
  'general_access_forbidden': 'Access denied. Please check your permissions.',
  'general_unauthorized': 'You need to sign in to perform this action.',
  
  // Network/Server errors
  'general_server_error': 'Something went wrong. Please try again later.',
  'general_unknown': 'An unexpected error occurred. Please try again.',
  'general_rate_limit_exceeded': 'Too many requests. Please wait a moment and try again.',
  
  // Validation errors
  'general_argument_invalid': 'Invalid information provided. Please check your input.',
  'general_invalid_payload': 'Invalid data provided. Please try again.',
  
  // Storage errors
  'storage_file_not_found': 'File not found.',
  'storage_file_empty': 'File is empty. Please select a valid file.',
  'storage_file_too_large': 'File is too large. Please use a smaller file.',
  'storage_invalid_file_type': 'File type not supported. Please use a different file.',
  
  // Database errors
  'document_not_found': 'Item not found.',
  'document_already_exists': 'This item already exists.',
  'collection_not_found': 'Collection not found.',
  
  // Team/Organization errors
  'team_not_found': 'Team not found.',
  'team_invite_not_found': 'Invitation not found or has expired.',
  'team_invite_already_exists': 'You have already been invited to this team.',
  'membership_not_found': 'Membership not found.',
};

/**
 * Default error messages by HTTP status code
 */
const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Invalid email or password. Please check your credentials.',
  403: 'You don\'t have permission to perform this action.',
  404: 'Item not found.',
  409: 'This item already exists.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Server error. Please try again later.',
  502: 'Service temporarily unavailable. Please try again later.',
  503: 'Service temporarily unavailable. Please try again later.',
};

/**
 * Extracts user-friendly error message from Appwrite error
 */
export function getUserFriendlyError(error: unknown): string {
  // Log technical error details for debugging (but don't show to user)
  logErrorForDebugging(error);
  
  const appwriteError = error as AppwriteError;
  
  // Try to get error type from response or error object
  const errorType = appwriteError?.response?.type || appwriteError?.type || '';
  const errorCode = appwriteError?.code || appwriteError?.response?.code;
  const errorMessage = appwriteError?.message || appwriteError?.response?.message || '';
  
  // Check for specific error type mapping
  if (errorType && ERROR_MESSAGES[errorType]) {
    return ERROR_MESSAGES[errorType];
  }
  
  // Check for HTTP status code mapping
  if (errorCode && DEFAULT_ERROR_MESSAGES[errorCode]) {
    return DEFAULT_ERROR_MESSAGES[errorCode];
  }
  
  // Check if error message contains known patterns
  const lowerMessage = errorMessage.toLowerCase();
  
  if (lowerMessage.includes('invalid credentials') || lowerMessage.includes('invalid email or password')) {
    return ERROR_MESSAGES['user_invalid_credentials'];
  }
  
  if (lowerMessage.includes('user not found') || lowerMessage.includes('account not found')) {
    return ERROR_MESSAGES['user_not_found'];
  }
  
  if (lowerMessage.includes('email already exists') || lowerMessage.includes('already registered')) {
    return ERROR_MESSAGES['user_email_already_exists'];
  }
  
  if (lowerMessage.includes('email not verified') || lowerMessage.includes('verification')) {
    return ERROR_MESSAGES['user_email_not_confirmed'];
  }
  
  if (lowerMessage.includes('permission') || lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden')) {
    return ERROR_MESSAGES['general_unauthorized_scope'];
  }
  
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
    return ERROR_MESSAGES['general_rate_limit_exceeded'];
  }
  
  if (lowerMessage.includes('network') || lowerMessage.includes('connection') || lowerMessage.includes('timeout')) {
    return 'Connection error. Please check your internet connection and try again.';
  }
  
  // Default fallback message
  return 'Something went wrong. Please try again.';
}

/**
 * Logs error details for debugging (only in development or if explicitly enabled)
 * Uses console.warn instead of console.error to reduce noise in error logs
 */
function logErrorForDebugging(error: unknown): void {
  const appwriteError = error as AppwriteError;
  
  // Only log detailed errors in development
  // @ts-ignore - __DEV__ is available in React Native
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // Use console.warn instead of console.error to reduce noise
    // These are expected errors that are handled gracefully
    console.warn('⚠️ [ErrorHandler] Appwrite error handled:', {
      type: appwriteError?.response?.type || appwriteError?.type || 'unknown',
      code: appwriteError?.code || appwriteError?.response?.code || 'unknown',
      message: appwriteError?.response?.message || appwriteError?.message || 'Unknown error',
    });
  }
  // In production, don't log errors to console at all
}

/**
 * Checks if error is an Appwrite error
 */
export function isAppwriteError(error: unknown): boolean {
  const appwriteError = error as AppwriteError;
  return !!(
    appwriteError?.response ||
    appwriteError?.type ||
    appwriteError?.code ||
    (appwriteError?.name && appwriteError.name.includes('Appwrite'))
  );
}

/**
 * Gets error code for analytics/logging purposes
 */
export function getErrorCode(error: unknown): string | number | null {
  const appwriteError = error as AppwriteError;
  return appwriteError?.code || appwriteError?.response?.code || null;
}

/**
 * Gets error type for analytics/logging purposes
 */
export function getErrorType(error: unknown): string | null {
  const appwriteError = error as AppwriteError;
  return appwriteError?.type || appwriteError?.response?.type || null;
}

