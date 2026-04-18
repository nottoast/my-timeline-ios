# App Icons and Favicons

This directory contains all icon and favicon assets for the YourTrips app.

## ✅ Currently Configured Files

All required files are now in place and configured!

### Web Favicons
- ✅ **favicon.ico** - Main favicon for browsers
- ✅ **favicon-16x16.png** - Small favicon
- ✅ **favicon-32x32.png** - Standard favicon
- ✅ **apple-touch-icon.png** - iOS home screen icon
- ✅ **android-chrome-192x192.png** - Android PWA icon (small)
- ✅ **android-chrome-512x512.png** - Android PWA icon (large)
- ✅ **site.webmanifest** - Web app manifest

### App Icons
- ✅ **icon.png** - Main app icon (currently using 512x512 version)
- ✅ **android-icon-foreground.png** - Android adaptive icon foreground
- ✅ **android-icon-background.png** - Android adaptive icon background
- ✅ **android-icon-monochrome.png** - Android 13+ themed icon
- ✅ **splash-icon.png** - Splash screen logo

## 🎨 Recommended Future Improvements

The Android adaptive icons (foreground, background, monochrome) are currently using the same image.
For best results, create separate versions:

### Android Adaptive Icons
- **Size**: 1024x1024 pixels each
- **Format**: PNG
- **Foreground**: Should be centered with padding (icon should fit in safe zone of ~432x432px)
- **Background**: Solid color or pattern
- **Monochrome**: Single-color version for Android 13+ themes

## Required Files (as configured in app.json)

### Web
- **favicon.png** - Web browser favicon (typically 32x32 or 48x48 pixels)

### iOS & Android
- **icon.png** - Main app icon (1024x1024 pixels recommended)
  - Used for iOS app icon
  - Expo will automatically generate all required sizes

### Android Specific
- **android-icon-foreground.png** - Foreground layer for adaptive icon (1024x1024 pixels)
- **android-icon-background.png** - Background layer for adaptive icon (1024x1024 pixels)
- **android-icon-monochrome.png** - Monochrome icon for Android 13+ themed icons (1024x1024 pixels)

### Splash Screen
- **splash-icon.png** - Logo/icon shown on splash screen while app loads

## File Specifications

### App Icon (icon.png)
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Purpose**: Main app icon for iOS and Android

### Favicon (favicon.png)
- **Size**: 48x48 pixels (or 32x32)
- **Format**: PNG
- **Purpose**: Browser tab icon for web version

### Android Adaptive Icons
- **Size**: 1024x1024 pixels each
- **Format**: PNG
- **Foreground**: Should be centered with padding (icon should fit in safe zone of ~432x432px)
- **Background**: Solid color or pattern
- **Monochrome**: Single-color version for Android 13+ themes

### Splash Icon (splash-icon.png)
- **Size**: Flexible, but 200-400px width recommended
- **Format**: PNG with transparency
- **Purpose**: Centered logo shown during app launch

## Quick Setup

1. Place your files in this directory with the exact names above
2. The app.json file is already configured to use them
3. Run `npx expo prebuild --clean` to regenerate native projects with new icons
4. For web, the favicon will be used automatically

## Design Tips

- Keep icons simple and recognizable at small sizes
- Use high contrast colors
- Avoid small details that won't be visible
- Test on both light and dark backgrounds
- Consider using a tool like https://www.figma.com or https://www.canva.com for design
- Or use an icon generator like https://easyappicon.com/ or https://appicon.co/

## Current Configuration

See `app.json` at the root of the project for the current icon configuration.
