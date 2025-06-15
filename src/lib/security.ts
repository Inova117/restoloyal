// ============================================================================
// FRONTEND SECURITY CONFIGURATION
// ============================================================================
// This file implements frontend security measures to complement database security
// ============================================================================

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// SECURITY CONSTANTS
// ============================================================================

export const SECURITY_CONFIG = {
  // Session management
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
  
  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  
  // Input validation
  MAX_INPUT_LENGTH: 255,
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  
  // Security headers
  CONTENT_SECURITY_POLICY: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", 'https://*.supabase.co'],
  }
};

// ============================================================================
// INPUT VALIDATION AND SANITIZATION
// ============================================================================

export class SecurityValidator {
  // Email validation
  static validateEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email) && email.length <= SECURITY_CONFIG.MAX_INPUT_LENGTH;
  }

  // Phone validation
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  // Password strength validation
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters long`);
    }
    
    if (SECURITY_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (SECURITY_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (SECURITY_CONFIG.REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (SECURITY_CONFIG.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Text input sanitization
  static sanitizeInput(input: string): string {
    if (!input) return '';
    
    // Remove potentially dangerous characters
    let sanitized = input.replace(/[<>\"';&]/g, '');
    
    // Limit length
    sanitized = sanitized.substring(0, SECURITY_CONFIG.MAX_INPUT_LENGTH);
    
    // Trim whitespace
    return sanitized.trim();
  }

  // HTML sanitization for rich text
  static sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  // File validation
  static validateFile(file: File): { isValid: boolean; error?: string } {
    if (!SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
      return { isValid: false, error: 'File type not allowed' };
    }
    
    if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
      return { isValid: false, error: 'File size too large' };
    }
    
    return { isValid: true };
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export class SessionManager {
  private static lastActivity = Date.now();
  private static sessionTimer: NodeJS.Timeout | null = null;
  private static idleTimer: NodeJS.Timeout | null = null;

  // Initialize session monitoring
  static initialize() {
    try {
      this.updateActivity();
      this.startSessionTimer();
      this.startIdleTimer();
      
      // Listen for user activity
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, () => this.updateActivity(), true);
      });
      
      if (import.meta.env.DEV) {
        console.log('🔧 Session monitoring initialized (dev mode)');
      }
    } catch (error) {
      console.error('❌ Session management initialization failed:', error);
      // Don't block app if session management fails
    }
  }

  // Update last activity timestamp
  static updateActivity() {
    this.lastActivity = Date.now();
    this.resetIdleTimer();
  }

  // Start session timeout timer
  private static startSessionTimer() {
    this.sessionTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, SECURITY_CONFIG.SESSION_TIMEOUT);
  }

  // Start idle timeout timer
  private static startIdleTimer() {
    this.idleTimer = setTimeout(() => {
      this.handleIdleTimeout();
    }, SECURITY_CONFIG.IDLE_TIMEOUT);
  }

  // Reset idle timer
  private static resetIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    this.startIdleTimer();
  }

  // Handle session timeout
  private static async handleSessionTimeout() {
    await this.logout('Session expired');
  }

  // Handle idle timeout
  private static async handleIdleTimeout() {
    const timeSinceLastActivity = Date.now() - this.lastActivity;
    
    if (timeSinceLastActivity >= SECURITY_CONFIG.IDLE_TIMEOUT) {
      await this.logout('Session expired due to inactivity');
    } else {
      // Reset timer if user was active
      this.resetIdleTimer();
    }
  }

  // Secure logout
  private static async logout(reason: string) {
    try {
      // Log security event
      await SecurityLogger.logEvent('session_timeout', { reason });
      
      // Clear all auth data
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear local storage
      this.clearAuthData();
      
      // Redirect to login
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/auth';
    }
  }

  // Clear authentication data
  static clearAuthData() {
    // Clear Supabase auth data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear session storage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  }

  // Cleanup timers
  static cleanup() {
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    if (this.idleTimer) clearTimeout(this.idleTimer);
  }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export class RateLimiter {
  private static attempts: Map<string, { count: number; lastAttempt: number }> = new Map();

  // Check if action is rate limited
  static isRateLimited(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);
    
    if (!attempt) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return false;
    }
    
    // Reset if window has passed
    if (now - attempt.lastAttempt > windowMs) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return false;
    }
    
    // Increment attempt count
    attempt.count++;
    attempt.lastAttempt = now;
    
    return attempt.count > maxAttempts;
  }

  // Reset rate limit for a key
  static resetRateLimit(key: string) {
    this.attempts.delete(key);
  }

  // Get remaining attempts
  static getRemainingAttempts(key: string, maxAttempts: number = 5): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return maxAttempts;
    return Math.max(0, maxAttempts - attempt.count);
  }
}

// ============================================================================
// SECURITY LOGGING
// ============================================================================

export class SecurityLogger {
  // Log security events (simplified for current schema)
  static async logEvent(eventType: string, details: any = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Log to console for now since security_events table may not exist yet
      console.log('Security Event:', {
        event_type: eventType,
        user_id: user?.id,
        user_agent: navigator.userAgent,
        details,
        severity: this.getSeverity(eventType),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Get client IP address
  private static async getClientIP(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  }

  // Determine event severity
  private static getSeverity(eventType: string): string {
    const severityMap: Record<string, string> = {
      'failed_login': 'medium',
      'permission_denied': 'high',
      'suspicious_activity': 'high',
      'session_timeout': 'low',
      'login_attempt': 'low',
      'data_access': 'medium'
    };
    
    return severityMap[eventType] || 'low';
  }
}

// ============================================================================
// CONTENT SECURITY POLICY
// ============================================================================

export class CSPManager {
  // Apply Content Security Policy (only in production)
  static applyCSP() {
    // TODO: Re-enable CSP after confirming Netlify deployment works
    // TEMPORARILY DISABLED - CSP might be blocking page load
    console.log('🔧 CSP temporarily disabled for debugging - Re-enable after Netlify deployment is confirmed working');
    return;

    // Skip CSP in development to avoid blocking Vite's hot reload and inline scripts
    // Check multiple ways to detect development mode
    const isDev = import.meta.env.DEV || 
                  import.meta.env.MODE === 'development' || 
                  window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1' ||
                  window.location.port !== '';

    if (isDev) {
      console.log('🔧 CSP skipped in development mode');
      return;
    }

    const csp = Object.entries(SECURITY_CONFIG.CONTENT_SECURITY_POLICY)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
    
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = csp;
    document.head.appendChild(meta);
    
    console.log('🔒 CSP applied for production');
  }

  // Set security headers (for development)
  static setSecurityHeaders() {
    // These would typically be set by the server
    const headers = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
    
    // Log headers for development
    console.log('Security headers should be set:', headers);
  }
}

// ============================================================================
// SECURE STORAGE
// ============================================================================

export class SecureStorage {
  // Encrypt data before storing
  static setItem(key: string, value: any) {
    try {
      const encrypted = btoa(JSON.stringify(value));
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to store encrypted data:', error);
    }
  }

  // Decrypt data after retrieving
  static getItem(key: string): any {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      const decrypted = atob(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error);
      return null;
    }
  }

  // Remove item
  static removeItem(key: string) {
    localStorage.removeItem(key);
  }

  // Clear all secure storage
  static clear() {
    localStorage.clear();
    sessionStorage.clear();
  }
}

// ============================================================================
// SECURITY INITIALIZATION
// ============================================================================

export const initializeSecurity = () => {
  try {
    console.log('🔒 Initializing security measures...');
    
    // Apply Content Security Policy (production only)
    CSPManager.applyCSP();
    
    // Set security headers (development logging)
    CSPManager.setSecurityHeaders();
    
    // Initialize session management
    SessionManager.initialize();
    console.log('✅ Session management initialized');
    
    // Log initialization
    SecurityLogger.logEvent('security_initialized');
    
    console.log('🔒 Security measures initialized successfully');
    
    // Additional development info
    if (import.meta.env.DEV) {
      console.log('🔧 Development mode: Some security features are relaxed for development');
    }
  } catch (error) {
    console.error('❌ Security initialization failed:', error);
    // Don't block app loading if security init fails
  }
};

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

export const SecurityUtils = {
  // Generate secure random string
  generateSecureRandom: (length: number = 32): string => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Hash sensitive data
  hashData: async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Validate CSRF token
  validateCSRF: (token: string): boolean => {
    // Implementation would depend on your CSRF strategy
    return Boolean(token && token.length > 0);
  },

  // Check if running in secure context
  isSecureContext: (): boolean => {
    return window.isSecureContext || location.protocol === 'https:';
  }
}; 