import { StyleSheet } from 'react-native'

// Global color palette for dark theme with green branding
export const colors = {
  background: '#000',
  surface: '#1a1a1a',
  primary: '#22c55e', // Green-500
  primaryLight: '#4ade80', // Green-400
  text: '#fff',
  textSecondary: '#9ca3af', // Gray-400
  textMuted: '#6b7280', // Gray-500
  border: '#374151',
  error: '#FF3B30',
  success: '#22c55e',
  blue: "#31f7eb",
  orange: '#f59104', // Premium orange color
}

// Global typography
export const typography = {
  title: {
    fontSize: 36,
    fontWeight: 'bold' as const,
    color: colors.text,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.primaryLight,
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  body: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  link: {
    fontSize: 16,
    color: colors.primaryLight,
    fontWeight: '600' as const,
  },
  buttonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  footer: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center' as const,
  },
}

// Global styles
export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    justifyContent: 'center',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 48,
    paddingHorizontal: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 80,
    marginBottom: 32,
  },
  logoIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  contentSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  buttonSection: {
    width: '100%',
    maxWidth: '100%',
    gap: 12,
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
    width: '100%',
  },
  footerSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    padding: 15,
    borderRadius: 8,
    marginBottom: 0,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    width: '100%',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 0,
  },
  verticalLinkContainer: {
    gap: 15,
    alignItems: 'center',
  },
  title: typography.title,
  subtitle: typography.subtitle,
  body: typography.body,
  link: typography.link,
  buttonText: typography.buttonText,
  footer: typography.footer,
})

// Helper function to get placeholder text color
export const getPlaceholderTextColor = () => colors.textSecondary

