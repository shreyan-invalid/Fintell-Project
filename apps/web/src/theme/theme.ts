import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#005f73"
    },
    secondary: {
      main: "#bb3e03"
    },
    background: {
      default: "#f8fbfc"
    }
  },
  typography: {
    fontFamily: "'Manrope', 'Segoe UI', sans-serif"
  }
});
