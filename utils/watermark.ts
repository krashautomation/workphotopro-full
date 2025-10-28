export interface WatermarkOptions {
  watermarkEnabled: boolean;
  timestampEnabled: boolean;
  timestampFormat?: 'short' | 'long'; // short: "Oct 27, 4:26am PDT" or long: "October 27, 2025, 4:26am PDT"
}

/**
 * Get formatted timestamp string
 */
export function getFormattedTimestamp(format: 'short' | 'long' = 'short'): string {
  const now = new Date();
  
  const options: Intl.DateTimeFormatOptions = {
    month: format === 'short' ? 'short' : 'long',
    day: 'numeric',
    year: format === 'long' ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  };

  return now.toLocaleString('en-US', options);
}

/**
 * Get default watermark preferences
 */
export function getDefaultWatermarkPreferences(): WatermarkOptions {
  return {
    watermarkEnabled: true,
    timestampEnabled: true,
    timestampFormat: 'short',
  };
}
