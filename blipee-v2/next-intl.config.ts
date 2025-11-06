import { locales } from "./src/i18n/locales";

export default {
  // Supported locales
  locales: ["en-US", "es-ES", "pt-PT"],
  // Default locale
  defaultLocale: "en-US",
  // Path to translation messages
  messages: {
    "en-US": () => import("./src/i18n/locales/en-US"),
    "es-ES": () => import("./src/i18n/locales/es-ES"),
    "pt-PT": () => import("./src/i18n/locales/pt-PT"),
  },
};
