// Type-safe translation definitions for blipee OS
export interface Messages {
  navigation: {
    features: string;
    industries: string;
    aiTechnology: string;
    about: string;
    signIn: string;
    signOut: string;
    dashboard: string;
    menu: string;
    toggleTheme: string;
    toggleLanguage: string;
  };
  hero: {
    title: string;
    subtitle: string;
    tagline: string;
    headline1: string;
    headline2: string;
    description: string;
    mainDescription: string;
    cta: {
      getStarted: string;
      startSetup: string;
      seeInAction: string;
      learnMore: string;
      requestDemo: string;
      watchDemo: string;
    };
    badges: {
      aiPowered: string;
      realTime: string;
      enterprise: string;
      secure: string;
    };
  };
  profile: {
    title: string;
    subtitle: string;
    sections: {
      profilePicture: {
        title: string;
        changePhoto: string;
        fileHint: string;
        uploadError: string;
        uploadSuccess: string;
      };
      personalInformation: {
        title: string;
        fullName: string;
        emailAddress: string;
        phoneNumber: string;
        bio: string;
        placeholders: {
          fullName: string;
          emailAddress: string;
          phoneNumber: string;
          bio: string;
        };
      };
      quickSettings: {
        title: string;
        notifications: {
          title: string;
          action: string;
        };
        security: {
          title: string;
          action: string;
        };
        appearance: {
          title: string;
          status: string;
        };
        language: {
          title: string;
          status: string;
        };
        signOut: {
          title: string;
        };
      };
      actions: {
        saveChanges: string;
        saving: string;
        saved: string;
      };
    };
    language: {
      title: string;
      subtitle: string;
      displayLanguage: string;
      fallbackLanguage: string;
      autoDetectBrowser: string;
      autoDetectBrowserDescription: string;
      rtlSupport: string;
      rtlSupportDescription: string;
      regionalFormats: string;
      dateFormat: string;
      timeFormat: string;
      numberFormat: string;
      unitsOfMeasurement: string;
      timezoneAndCurrency: string;
      timezone: string;
      defaultCurrency: string;
      contentAndTranslation: string;
      contentLanguagePreference: string;
      exportLanguage: string;
      autoTranslateContent: string;
      autoTranslateContentDescription: string;
      sustainabilityStandards: string;
      reportingStandardLanguage: string;
      reportingStandardDescription: string;
      preview: string;
    };
  };
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    continue: string;
    confirm: string;
    yes: string;
    no: string;
    retry: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  errors: {
    generic: string;
    network: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    validation: string;
    server: string;
  };
  auth: {
    signIn: {
      title: string;
      subtitle: string;
      email: string;
      password: string;
      rememberMe: string;
      forgotPassword: string;
      signInButton: string;
      noAccount: string;
      createAccount: string;
    };
    signUp: {
      title: string;
      subtitle: string;
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      confirmPassword: string;
      agreeToTerms: string;
      signUpButton: string;
      haveAccount: string;
    };
  };
}

// Utility type for nested keys
export type TranslationKey = keyof Messages | `${keyof Messages}.${string}`;

// Rich formatting types
export interface FormatOptions {
  dateTime?: {
    format?: 'short' | 'long' | 'relative';
    timeZone?: string;
  };
  number?: {
    format?: 'currency' | 'percent' | 'precise';
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  };
  list?: {
    type?: 'conjunction' | 'disjunction';
  };
}

// Interpolation values for dynamic content
export interface TranslationValues {
  [key: string]: string | number | Date | React.ReactNode;
}

declare global {
  // Use type re-export pattern recommended by NextIntl for better type safety
  interface IntlMessages extends Messages {}
}