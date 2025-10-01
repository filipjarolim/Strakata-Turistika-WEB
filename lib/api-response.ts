/**
 * Standardized API response utilities
 */

import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  details?: unknown;
}

/**
 * Create successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  message?: string,
  pagination?: ApiResponse<T>['pagination']
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(pagination && { pagination })
  };

  return new NextResponse(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': status === 200 ? 'public, s-maxage=30, stale-while-revalidate=59' : 'no-cache'
    }
  });
}

/**
 * Create error API response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  message?: string,
  details?: unknown
): NextResponse<ApiError> {
  const response: ApiError = {
    success: false,
    error,
    ...(message ? { message } : {}),
    ...(details ? { details } : {})
  };

  return new NextResponse(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Create unauthorized response
 */
export function createUnauthorizedResponse(message: string = "Unauthorized"): NextResponse<ApiError> {
  return createErrorResponse("UNAUTHORIZED", 403, message);
}

/**
 * Create not found response
 */
export function createNotFoundResponse(resource: string = "Resource"): NextResponse<ApiError> {
  return createErrorResponse("NOT_FOUND", 404, `${resource} not found`);
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(errors: string[]): NextResponse<ApiError> {
  return createErrorResponse("VALIDATION_ERROR", 400, "Validation failed", { errors });
}

/**
 * Create bad request response
 */
export function createBadRequestResponse(message: string): NextResponse<ApiError> {
  return createErrorResponse("BAD_REQUEST", 400, message);
}

/**
 * Create internal server error response
 */
export function createInternalErrorResponse(message: string = "Internal server error"): NextResponse<ApiError> {
  return createErrorResponse("INTERNAL_ERROR", 500, message);
}

/**
 * Handle API errors with proper logging and response
 */
export function handleApiError(error: unknown, context: string): NextResponse<ApiError> {
  console.error(`API Error in ${context}:`, error);

  if (error instanceof Error) {
    // Handle known error types
    if (error.message.includes("Unauthorized")) {
      return createUnauthorizedResponse(error.message);
    }
    
    if (error.message.includes("not found")) {
      return createNotFoundResponse();
    }
    
    if (error.message.includes("Validation failed")) {
      return createValidationErrorResponse([error.message]);
    }
    
    if (error.message.includes("required")) {
      return createBadRequestResponse(error.message);
    }

    // Generic error message for known errors
    return createErrorResponse("OPERATION_FAILED", 400, error.message);
  }

  // Unknown error
  return createInternalErrorResponse();
}

/**
 * Extract and validate request body
 */
export async function extractRequestBody<T>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new Error("Invalid JSON in request body");
  }
}

/**
 * Validate required fields
 */
export function validateRequiredFields(data: Record<string, unknown>, requiredFields: string[]): string[] {
  const errors: string[] = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`${field} is required`);
    }
  }
  
  return errors;
}
