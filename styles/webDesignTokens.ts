/**
 * Web Design Tokens - Experimental
 * 
 * Extracted from globals-web.css for testing in React Native.
 * These tokens are available for gradual adoption without affecting
 * the current design system.
 * 
 * Usage:
 *   import { webColors } from '@/styles/webDesignTokens';
 *   // Use webColors.primary instead of colors.primary for testing
 */

// Helper function to convert HSL to hex
// HSL format: hsl(hue, saturation%, lightness%)
function hslToHex(hsl: string): string {
  // Extract HSL values
  const match = hsl.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/);
  if (!match) return hsl; // Return original if not HSL format
  
  const h = parseFloat(match[1]) / 360;
  const s = parseFloat(match[2]) / 100;
  const l = parseFloat(match[3]) / 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (0 <= h && h < 1/6) {
    r = c; g = x; b = 0;
  } else if (1/6 <= h && h < 2/6) {
    r = x; g = c; b = 0;
  } else if (2/6 <= h && h < 3/6) {
    r = 0; g = c; b = x;
  } else if (3/6 <= h && h < 4/6) {
    r = 0; g = x; b = c;
  } else if (4/6 <= h && h < 5/6) {
    r = x; g = 0; b = c;
  } else if (5/6 <= h && h < 1) {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Web Design Color Palette
 * Converted from CSS variables in globals-web.css
 */
export const webColors = {
  // Base colors
  background: hslToHex('hsl(0, 0%, 4%)'),        // #0a0a0a
  foreground: hslToHex('hsl(0, 0%, 98%)'),        // #fafafa
  card: hslToHex('hsl(0, 0%, 8%)'),              // #141414
  cardForeground: hslToHex('hsl(0, 0%, 98%)'),   // #fafafa
  
  // Primary colors (lime/yellow-green)
  primary: hslToHex('hsl(84, 100%, 59%)'),        // #c6f309 (bright lime)
  primaryForeground: hslToHex('hsl(0, 0%, 9%)'), // #171717 (dark text on primary)
  
  // Secondary colors
  secondary: hslToHex('hsl(0, 0%, 20%)'),        // #333333
  secondaryForeground: hslToHex('hsl(0, 0%, 98%)'), // #fafafa
  
  // Muted colors
  muted: hslToHex('hsl(0, 0%, 15%)'),            // #262626
  mutedForeground: hslToHex('hsl(0, 0%, 64%)'),  // #a3a3a3
  
  // Accent colors (cyan)
  accent: hslToHex('hsl(182, 100%, 59%)'),       // #28f7f8 (bright cyan)
  accentForeground: hslToHex('hsl(0, 0%, 9%)'), // #171717
  
  // Destructive/Error
  destructive: hslToHex('hsl(356.3033, 90.5579%, 54.3137%)'), // #e63946 (red)
  destructiveForeground: hslToHex('hsl(0, 0%, 100%)'),        // #ffffff
  
  // Border and input
  border: hslToHex('hsl(0, 0%, 20%)'),           // #333333
  input: hslToHex('hsl(0, 0%, 15%)'),           // #262626
  ring: hslToHex('hsl(84, 100%, 59%)'),         // #c6f309 (same as primary)
  
  // Chart colors
  chart1: hslToHex('hsl(84, 100%, 59%)'),        // #c6f309 (lime)
  chart2: hslToHex('hsl(182, 100%, 59%)'),      // #28f7f8 (cyan)
  chart3: hslToHex('hsl(42.0290, 92.8251%, 56.2745%)'), // #f4a261 (orange)
  chart4: hslToHex('hsl(147.1429, 78.5047%, 41.9608%)'), // #2a9d8f (teal)
  chart5: hslToHex('hsl(341.4894, 75.2000%, 50.9804%)'), // #e76f51 (coral)
  
  // Sidebar colors
  sidebar: hslToHex('hsl(0, 0%, 8%)'),          // #141414
  sidebarForeground: hslToHex('hsl(0, 0%, 98%)'), // #fafafa
  sidebarPrimary: hslToHex('hsl(84, 100%, 59%)'), // #c6f309
  sidebarPrimaryForeground: hslToHex('hsl(0, 0%, 9%)'), // #171717
  sidebarAccent: hslToHex('hsl(0, 0%, 15%)'),   // #262626
  sidebarAccentForeground: hslToHex('hsl(84, 100%, 59%)'), // #c6f309
  sidebarBorder: hslToHex('hsl(0, 0%, 20%)'),  // #333333
  sidebarRing: hslToHex('hsl(84, 100%, 59%)'), // #c6f309
  
  // Special colors from CSS
  limeSolid: '#d0f300',                         // From --lime-solid
  cyanAccent: hslToHex('hsl(182, 100%, 59%)'),  // #28f7f8
} as const;

/**
 * Gradient colors (for use with expo-linear-gradient)
 * From --gradient-primary: linear-gradient(135deg, #c6f309 0%, #28f7f8 100%)
 */
export const webGradients = {
  primary: {
    colors: ['#c6f309', '#28f7f8'], // lime to cyan
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  text: {
    colors: ['#c6f309', '#28f7f8'], // same as primary
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

/**
 * Design tokens (spacing, radius, etc.)
 */
export const webDesignTokens = {
  radius: 12, // --radius: 12px
  // You can add more tokens here as needed
} as const;

/**
 * Typography (font families from CSS)
 * Note: React Native has limited font support, these are suggestions
 */
export const webTypography = {
  sans: 'System', // 'Inter' - use system font or load Inter
  serif: 'System', // 'Georgia' - use system serif
  mono: 'Courier', // 'Menlo' - use Courier or load Menlo
} as const;

/**
 * Shadow/Glow effects (converted from CSS box-shadow)
 * For use with React Native shadowColor, shadowOffset, shadowOpacity, shadowRadius
 */
export const webEffects = {
  glow: {
    shadowColor: '#c6f309', // lime color
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5, // Android
  },
  glowHover: {
    shadowColor: '#c6f309',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

/**
 * Example: How to use these tokens
 * 
 * // In a component:
 * import { webColors, webGradients } from '@/styles/webDesignTokens';
 * import { LinearGradient } from 'expo-linear-gradient';
 * 
 * // Use web colors
 * <View style={{ backgroundColor: webColors.primary }}>
 *   <Text style={{ color: webColors.primaryForeground }}>Hello</Text>
 * </View>
 * 
 * // Use gradient
 * <LinearGradient
 *   colors={webGradients.primary.colors}
 *   start={webGradients.primary.start}
 *   end={webGradients.primary.end}
 * >
 *   <Text>Gradient Button</Text>
 * </LinearGradient>
 */

