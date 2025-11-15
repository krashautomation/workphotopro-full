/**
 * Web Design Token Test Component
 * 
 * Use this component to preview and test the web design tokens
 * extracted from globals-web.css
 * 
 * Usage:
 *   import { WebDesignTest } from '@/components/WebDesignTest';
 *   // Add <WebDesignTest /> to any screen to see the tokens
 */

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { webColors, webGradients, webEffects } from '@/styles/webDesignTokens';
import { LinearGradient } from 'expo-linear-gradient';

export function WebDesignTest() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Web Design Tokens Preview</Text>
      
      {/* Primary Colors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Primary Colors</Text>
        <View style={[styles.colorCard, { backgroundColor: webColors.primary }]}>
          <Text style={[styles.colorText, { color: webColors.primaryForeground }]}>
            Primary: {webColors.primary}
          </Text>
        </View>
        <View style={[styles.colorCard, { backgroundColor: webColors.accent }]}>
          <Text style={[styles.colorText, { color: webColors.accentForeground }]}>
            Accent: {webColors.accent}
          </Text>
        </View>
      </View>

      {/* Background Colors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Background Colors</Text>
        <View style={[styles.colorCard, { backgroundColor: webColors.background }]}>
          <Text style={[styles.colorText, { color: webColors.foreground }]}>
            Background: {webColors.background}
          </Text>
        </View>
        <View style={[styles.colorCard, { backgroundColor: webColors.card }]}>
          <Text style={[styles.colorText, { color: webColors.cardForeground }]}>
            Card: {webColors.card}
          </Text>
        </View>
        <View style={[styles.colorCard, { backgroundColor: webColors.muted }]}>
          <Text style={[styles.colorText, { color: webColors.foreground }]}>
            Muted: {webColors.muted}
          </Text>
        </View>
      </View>

      {/* Gradient Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gradients</Text>
        <LinearGradient
          colors={webGradients.primary.colors}
          start={webGradients.primary.start}
          end={webGradients.primary.end}
          style={styles.gradientCard}
        >
          <Text style={styles.gradientText}>
            Primary Gradient
          </Text>
        </LinearGradient>
      </View>

      {/* Special Colors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special Colors</Text>
        <View style={[styles.colorCard, { backgroundColor: webColors.limeSolid }]}>
          <Text style={[styles.colorText, { color: '#000' }]}>
            Lime Solid: {webColors.limeSolid}
          </Text>
        </View>
        <View style={[styles.colorCard, { backgroundColor: webColors.cyanAccent }]}>
          <Text style={[styles.colorText, { color: webColors.accentForeground }]}>
            Cyan Accent: {webColors.cyanAccent}
          </Text>
        </View>
      </View>

      {/* Chart Colors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chart Colors</Text>
        <View style={styles.chartRow}>
          <View style={[styles.chartColor, { backgroundColor: webColors.chart1 }]} />
          <View style={[styles.chartColor, { backgroundColor: webColors.chart2 }]} />
          <View style={[styles.chartColor, { backgroundColor: webColors.chart3 }]} />
          <View style={[styles.chartColor, { backgroundColor: webColors.chart4 }]} />
          <View style={[styles.chartColor, { backgroundColor: webColors.chart5 }]} />
        </View>
      </View>

      {/* Effects Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shadow Effects</Text>
        <View style={[styles.effectCard, webEffects.glow]}>
          <Text style={styles.effectText}>Glow Effect</Text>
        </View>
        <View style={[styles.effectCard, webEffects.cardHover]}>
          <Text style={styles.effectText}>Card Hover Effect</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: webColors.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: webColors.foreground,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: webColors.foreground,
    marginBottom: 12,
  },
  colorCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    minHeight: 60,
    justifyContent: 'center',
  },
  colorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  gradientCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  gradientText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  chartRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chartColor: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  effectCard: {
    backgroundColor: webColors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    minHeight: 60,
    justifyContent: 'center',
  },
  effectText: {
    color: webColors.foreground,
    fontSize: 14,
    fontWeight: '500',
  },
});

