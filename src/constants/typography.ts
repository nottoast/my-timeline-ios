/**
 * Typography Constants
 * 
 * Centralized typography definitions for the entire app.
 * Change fonts here to update them throughout the application.
 * 
 * HOW TO USE A CUSTOM FONT:
 * 1. Add your font files (.ttf or .otf) to the /assets/fonts/ directory
 * 2. Update FONTS.title (or other properties) with your font name
 * 3. Example: Change FONTS.title to 'YourCustomFont' or 'Pacifico-Regular'
 * 4. For custom fonts, you may need to load them in app/_layout.tsx using expo-font
 * 
 * EXAMPLES:
 * - For Google Fonts like Pacifico: FONTS.title = 'Pacifico-Regular'
 * - For system fonts on iOS: FONTS.title = 'American Typewriter' or 'Snell Roundhand'
 * - For keeping system font: FONTS.title = 'System'
 */

export const FONTS = {
  // Main font families
  regular: 'System',
  bold: 'System',
  
  // Special fonts
  title: 'DMSerifText-Regular', // ← Used ONLY for "YourTrips" branding (login page + header)
  
  // Weight variants (if using custom fonts)
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  huge: 32,
};

export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
};
