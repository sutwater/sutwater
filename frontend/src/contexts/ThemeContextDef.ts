import { createContext } from "react";

export type ThemeContextType = {
  dark: boolean;
  toggle: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  dark: false,
  toggle: () => {},
});
