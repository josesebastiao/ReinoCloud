import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
      },
      colors: {
        // AQUI ESTÁ A MUDANÇA 🎨
        // Removemos o verde (emerald).
        // Agora definimos um "Azul Reino" mais moderno e vibrante.
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', 
          600: '#2563eb', // Cor principal dos botões (Royal Blue)
          700: '#1d4ed8', // Hover
          800: '#1e40af', // Cor de textos escura
          900: '#1e3a8a', // Sidebar e fundos escuros
          950: '#172554',
        },
        emerald: colors.emerald,
        amber: colors.amber,
        red: colors.red,
        purple: colors.purple,
        yellow: colors.yellow,
        slate: colors.slate,
        gray: colors.gray,
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;