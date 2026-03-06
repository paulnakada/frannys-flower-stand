export const theme = {
  colors: {
    primary: '#5A8F5A',
    primaryLight: '#7FB87F',
    primaryDark: '#3D6B3D',
    accent: '#E8A0B4',
    accentDark: '#D4708A',
    accentLight: '#F5D0DC',

    cream: '#FBF7F2',
    white: '#FFFFFF',
    sand: '#F0E8DC',
    taupe: '#C4B8A8',
    warmGray: '#8A7F74',
    charcoal: '#3A3530',

    success: '#5A8F5A',
    error: '#D45B5B',
    warning: '#D4A455',

    border: '#E8DDD0',
    cardBg: '#FFFFFF',
    inputBg: '#F5F0EA',
    overlay: 'rgba(58, 53, 48, 0.5)',
    pendingBadge: '#F0C878',
  },

  typography: {
    fonts: {
      display: 'PlayfairDisplay_700Bold',
      displayItalic: 'PlayfairDisplay_700Bold_Italic',
      displayRegular: 'PlayfairDisplay_400Regular',
      body: 'Lato_400Regular',
      bodyBold: 'Lato_700Bold',
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
  },
};

export type Theme = typeof theme;
