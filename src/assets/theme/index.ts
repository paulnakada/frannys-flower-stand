export const theme = {
  colors: {
    // Primary palette - botanical fresh
    primary: '#5A8F5A',        // sage green
    primaryLight: '#7FB87F',   // light sage
    primaryDark: '#3D6B3D',    // deep green
    accent: '#E8A0B4',         // soft petal pink
    accentDark: '#D4708A',     // deeper rose
    accentLight: '#F5D0DC',    // blush

    // Neutrals
    cream: '#FBF7F2',          // warm off-white background
    white: '#FFFFFF',
    sand: '#F0E8DC',           // warm sand
    taupe: '#C4B8A8',          // warm grey
    warmGray: '#8A7F74',       // text secondary
    charcoal: '#3A3530',       // text primary

    // Feedback
    success: '#5A8F5A',
    error: '#D45B5B',
    warning: '#D4A455',

    // UI
    border: '#E8DDD0',
    cardBg: '#FFFFFF',
    inputBg: '#F5F0EA',
    overlay: 'rgba(58, 53, 48, 0.5)',
    pendingBadge: '#F0C878',
  },

  typography: {
    fonts: {
      // Use Google Fonts via expo-google-fonts
      display: 'Playfair_Display_700Bold',
      displayItalic: 'Playfair_Display_700Bold_Italic',
      displayRegular: 'Playfair_Display_400Regular',
      body: 'Lato_400Regular',
      bodyMedium: 'Lato_700Bold',
      bodyLight: 'Lato_300Light',
    },
    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      md: 17,
      lg: 20,
      xl: 24,
      xxl: 30,
      xxxl: 38,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  radius: {
    sm: 6,
    md: 12,
    lg: 20,
    xl: 28,
    round: 999,
  },

  shadows: {
    card: {
      shadowColor: '#3A3530',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    button: {
      shadowColor: '#5A8F5A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    modal: {
      shadowColor: '#3A3530',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 10,
    },
  },
};

export type Theme = typeof theme;
