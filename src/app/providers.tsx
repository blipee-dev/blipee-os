'use client';

import { useEffect } from 'react';
import { AuthProvider } from "@/lib/auth/context";
import { initializeModuleSystem } from "@/lib/modules";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AppearanceProvider } from "@/providers/AppearanceProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { clearMalformedSupabaseCookies } from "@/lib/supabase/clear-cookies";

// Default messages for the profile page
const defaultMessages = {
  profile: {
    title: "Profile",
    subtitle: "Manage your personal information and preferences",
    sections: {
      profilePicture: {
        title: "Profile Picture",
        changePhoto: "Change Photo",
        fileHint: "JPG, PNG, or GIF. Max 5MB.",
        uploadError: "File size must be less than 5MB",
        uploadSuccess: "Profile photo updated successfully"
      },
      personalInformation: {
        title: "Personal Information",
        fullName: "Full Name",
        emailAddress: "Email Address",
        phoneNumber: "Phone Number",
        bio: "Bio",
        placeholders: {
          fullName: "John Doe",
          emailAddress: "john@example.com",
          phoneNumber: "+1 (555) 123-4567",
          bio: "Tell us about yourself..."
        }
      },
      quickSettings: {
        title: "Quick Settings",
        notifications: {
          title: "Notifications",
          action: "Manage"
        },
        security: {
          title: "Security",
          action: "Configure"
        },
        appearance: {
          title: "Appearance",
          status: "Dark"
        },
        language: {
          title: "Language",
          status: "English"
        },
        signOut: {
          title: "Sign Out"
        }
      },
      actions: {
        saveChanges: "Save Changes",
        saving: "Saving...",
        saved: "Changes saved successfully"
      }
    },
    "language": {
      "title": "Language & Region",
      "subtitle": "Configure your language, region, and formatting preferences",
      "displayLanguage": "Display Language",
      "fallbackLanguage": "Fallback Language",
      "autoDetectBrowser": "Auto-detect browser language",
      "autoDetectBrowserDescription": "Automatically detect and use browser language preference",
      "rtlSupport": "Right-to-left language support",
      "rtlSupportDescription": "Enable support for RTL languages like Arabic and Hebrew",
      "regionalFormats": "Regional Formats",
      "dateFormat": "Date Format",
      "timeFormat": "Time Format",
      "numberFormat": "Number Format",
      "unitsOfMeasurement": "Units of Measurement",
      "timezoneAndCurrency": "Timezone & Currency",
      "timezone": "Timezone",
      "defaultCurrency": "Default Currency",
      "contentAndTranslation": "Content & Translation",
      "contentLanguagePreference": "Content Language Preference",
      "exportLanguage": "Export Language",
      "autoTranslateContent": "Auto-translate content",
      "autoTranslateContentDescription": "Automatically translate content to your preferred language",
      "sustainabilityStandards": "Sustainability Standards",
      "reportingStandardLanguage": "Reporting Standard Language",
      "reportingStandardDescription": "Choose the language version of sustainability reporting standards",
      "preview": "Preview"
    }
  }
};

function ModuleSystemInitializer() {
  useEffect(() => {
    // Clear any malformed Supabase cookies
    clearMalformedSupabaseCookies();
    
    // Initialize the module system on client-side
    initializeModuleSystem();
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppearanceProvider>
            <SettingsProvider>
              <ModuleSystemInitializer />
              {children}
            </SettingsProvider>
          </AppearanceProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}