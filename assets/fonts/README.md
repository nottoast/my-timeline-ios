# Custom Fonts

This directory is for storing custom font files.

## How to Add a Custom Font

1. **Add your font files here**
   - Place your `.ttf` or `.otf` font files in this directory
   - Example: `Pacifico-Regular.ttf`, `Lobster-Regular.ttf`, etc.

2. **Update typography constants**
   - Open `/src/constants/typography.ts`
   - Change the `FONTS.title` property to match your font filename (without extension)
   - Example: `FONTS.title = 'Pacifico-Regular'`

3. **Load the font in your app**
   - Open `/app/_layout.tsx`
   - Import expo-font if not already imported
   - Load your font using `useFonts` hook
   - Example:
   ```typescript
   import { useFonts } from 'expo-font';
   
   const [fontsLoaded] = useFonts({
     'Pacifico-Regular': require('../assets/fonts/Pacifico-Regular.ttf'),
   });
   ```

4. **That's it!** Your app will now use the custom font for the "YourTrips" title.

## Popular Font Sources

- **Google Fonts**: https://fonts.google.com/
- **Font Squirrel**: https://www.fontsquirrel.com/
- **DaFont**: https://www.dafont.com/

## Examples of Nice Cursive/Script Fonts

- Pacifico (playful and rounded)
- Lobster (bold and decorative)
- Dancing Script (elegant handwriting)
- Great Vibes (formal script)
- Caveat (casual handwritten)
- Satisfy (cursive and flowing)

Just download the font, place it here, and update the constants file!
