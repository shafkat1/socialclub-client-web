/**
 * Frontend Configuration
 * 
 * This file centralizes all configuration for the SocialClub frontend.
 * Points to backend API (NOT Supabase).
 */

// For separated repo setup, use environment variables
// Create a .env file with:
// VITE_SUPABASE_PROJECT_ID=your-project-id
// VITE_SUPABASE_ANON_KEY=your-anon-key

export const config = {
  supabase: {
    // When running in separated frontend repo, these will come from .env
    projectId: import.meta.env?.VITE_SUPABASE_PROJECT_ID || '',
    publicAnonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || '',
    get url() {
      return this.projectId ? `https://${this.projectId}.supabase.co` : '';
    },
  },
  api: {
    // ✅ Backend API base URL (NOT Supabase)
    get baseUrl() {
      // Try environment variable first (for production/staging)
      if (import.meta.env?.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
      }
      
      // In production, default to same-origin /api behind CloudFront
      if (import.meta.env?.PROD) {
        return `${window.location.origin}/api`;
      }
      
      // Development default
      if (import.meta.env?.DEV) {
        return 'http://localhost:3001/api';
      }
      
      // Fallback (should not be used)
      return `${window.location.origin}/api`;
    },
  },
  // Feature flags for development
  features: {
    mockData: import.meta.env?.VITE_USE_MOCK_DATA === 'true',
    debugMode: import.meta.env?.DEV || false,
  },
};

// Type-safe config access
export type AppConfig = typeof config;
