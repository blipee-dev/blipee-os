export const premiumTheme = {
  colors: {
    background: {
      primary: "#0A0A0A",
      secondary: "#111111",
      glass: "rgba(255, 255, 255, 0.02)",
      glassBorder: "rgba(255, 255, 255, 0.05)",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#94A3B8",
      tertiary: "#64748B",
    },
    brand: {
      purple: "#8B5CF6",
      blue: "#0EA5E9",
      green: "#10B981",
      orange: "#F59E0B",
      pink: "#EC4899",
      red: "#EF4444",
    },
    gradients: {
      primary: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
      blue: "linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)",
      success: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      coral: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
      brand: "linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%)",
      dark: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    },
    status: {
      success: "#10B981",
      successBg: "rgba(16, 185, 129, 0.1)",
      error: "#EF4444",
      errorBg: "rgba(239, 68, 68, 0.1)",
      warning: "#F59E0B",
      warningBg: "rgba(245, 158, 11, 0.1)",
      info: "#0EA5E9",
      infoBg: "rgba(14, 165, 233, 0.1)",
    },
  },
  borderRadius: {
    xs: "0.375rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    pill: "9999px",
  },
  shadows: {
    sm: "0 2px 8px rgba(0, 0, 0, 0.1)",
    md: "0 4px 16px rgba(0, 0, 0, 0.15)",
    lg: "0 8px 32px rgba(0, 0, 0, 0.2)",
    glow: "0 0 32px rgba(139, 92, 246, 0.25)",
  },
  transitions: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    base: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "500ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
  typography: {
    sizes: {
      displayLarge: {
        size: "3.5rem",
        weight: 700,
        lineHeight: 1.1,
        letterSpacing: "-0.02em",
      },
      displayMedium: {
        size: "2.5rem",
        weight: 700,
        lineHeight: 1.2,
        letterSpacing: "-0.01em",
      },
      h1: {
        size: "2rem",
        weight: 600,
        lineHeight: 1.3,
      },
      h2: {
        size: "1.5rem",
        weight: 600,
        lineHeight: 1.4,
      },
      h3: {
        size: "1.25rem",
        weight: 600,
        lineHeight: 1.5,
      },
      body: {
        size: "1rem",
        weight: 400,
        lineHeight: 1.6,
      },
      small: {
        size: "0.875rem",
        weight: 400,
        lineHeight: 1.5,
      },
    },
  },
  animations: {
    fadeIn: `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `,
    fadeInUp: `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
    slideIn: `
      @keyframes slideIn {
        from {
          transform: translateX(-100%);
        }
        to {
          transform: translateX(0);
        }
      }
    `,
    pulse: `
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    `,
  },
};

export const glassmorphism = {
  background: premiumTheme.colors.background.glass,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${premiumTheme.colors.background.glassBorder}`,
  boxShadow: premiumTheme.shadows.md,
};

export const gradientText = (gradient: string) => ({
  background: gradient,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
});
