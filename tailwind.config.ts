import type { Config } from "tailwindcss";

/**
 * Palette and tokens lifted directly from the imported "Health Tracker" design
 * so components can use semantic names instead of repeating raw hex values.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-figtree)", "system-ui", "sans-serif"],
      },
      colors: {
        // Calm teal accent system
        accent: {
          DEFAULT: "#14b8a6",
          deep: "#0f766e",
          soft: "#5eead4",
          tint: "#f0fdfa",
          muted: "#5e9e93",
        },
        // Neutral ink + surfaces
        ink: "#1f2937",
        body: "#374151",
        subtle: "#6b7280",
        faint: "#9ca3af",
        ghost: "#b6bcc4",
        hairline: "#c2c7ce",
        line: "#e5e7eb",
        surface: {
          DEFAULT: "#ffffff",
          sunken: "#f9fafb",
          field: "#f3f4f6",
        },
        divider: "#f0f1f3",
      },
      borderRadius: {
        phone: "42px",
        card: "24px",
      },
      boxShadow: {
        phone: "0 18px 50px rgba(31,41,55,.14)",
        card: "0 1px 3px rgba(31,41,55,.05)",
        chip: "0 1px 4px rgba(31,41,55,.07)",
        pop: "0 1px 4px rgba(31,41,55,.18)",
      },
    },
  },
  plugins: [],
};

export default config;
