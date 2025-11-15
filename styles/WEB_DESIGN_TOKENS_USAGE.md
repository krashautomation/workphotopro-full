# Web Design Tokens - Usage Guide

This file contains design tokens extracted from `globals-web.css` for testing in React Native.

## Quick Start

```typescript
import { webColors, webGradients, webEffects } from '@/styles/webDesignTokens';
```

## Testing Approach

### Option 1: Import and Use Directly (Recommended for Testing)

```typescript
import { webColors } from '@/styles/webDesignTokens';

// In your component
<View style={{ backgroundColor: webColors.primary }}>
  <Text style={{ color: webColors.primaryForeground }}>Test Button</Text>
</View>
```

### Option 2: Create a Test Component

Create a separate component file to test the web design tokens:

```typescript
// components/TestWebDesign.tsx
import { View, Text, StyleSheet } from 'react-native';
import { webColors, webGradients } from '@/styles/webDesignTokens';
import { LinearGradient } from 'expo-linear-gradient';

export function TestWebDesign() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Web Design Token Test</Text>
      
      {/* Test primary color */}
      <View style={[styles.card, { backgroundColor: webColors.primary }]}>
        <Text style={[styles.text, { color: webColors.primaryForeground }]}>
          Primary Color
        </Text>
      </View>
      
      {/* Test gradient */}
      <LinearGradient
        colors={webGradients.primary.colors}
        start={webGradients.primary.start}
        end={webGradients.primary.end}
        style={styles.gradientButton}
      >
        <Text style={styles.gradientText}>Gradient Button</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  card: { padding: 16, borderRadius: 12, marginBottom: 12 },
  text: { fontSize: 16 },
  gradientButton: { padding: 16, borderRadius: 12, marginBottom: 12 },
  gradientText: { color: '#000', fontSize: 16, fontWeight: '600' },
});
```

### Option 3: Gradually Replace Current Colors

You can create a conditional export in `globalStyles.ts`:

```typescript
// In globalStyles.ts
import { webColors } from './webDesignTokens';

// Option A: Use web colors directly
export const colors = webColors;

// Option B: Merge with current colors
export const colors = {
  ...webColors,
  // Keep some current colors
  blue: "#31f7eb", // Your custom blue
};

// Option C: Create an alias for easy switching
const USE_WEB_DESIGN = false; // Toggle this to switch
export const colors = USE_WEB_DESIGN ? webColors : currentColors;
```

## Available Tokens

### Colors
- `webColors.primary` - Bright lime (#c6f309)
- `webColors.accent` - Bright cyan (#28f7f8)
- `webColors.background` - Dark background (#0a0a0a)
- `webColors.foreground` - Light text (#fafafa)
- `webColors.card` - Card background (#141414)
- And many more... (see `webDesignTokens.ts`)

### Gradients
- `webGradients.primary` - Lime to cyan gradient
- `webGradients.text` - Same gradient for text

### Effects
- `webEffects.glow` - Glow shadow effect
- `webEffects.glowHover` - Stronger glow
- `webEffects.cardHover` - Card hover shadow

## Example: Testing in Create Job Button

```typescript
// In app/(jobs)/index.tsx
import { webColors } from '@/styles/webDesignTokens';

// Test with web design primary color
<TouchableOpacity 
  style={[
    globalStyles.secondaryButton, 
    { borderColor: webColors.primary } // Test web design color
  ]}
>
  <Text style={[globalStyles.buttonText, { color: webColors.primary }]}>
    Create Job
  </Text>
</TouchableOpacity>
```

## Notes

1. **HSL to Hex Conversion**: Colors are automatically converted from HSL to hex format
2. **Gradients**: Use with `expo-linear-gradient` (already in your dependencies)
3. **Shadows**: React Native shadow properties differ from CSS, so effects are adapted
4. **Fonts**: Font families are suggestions - you may need to load custom fonts

## Next Steps

1. Test individual components with web design tokens
2. Compare visual results with your website
3. Gradually adopt tokens that work well
4. Update `globalStyles.ts` when ready to fully adopt

