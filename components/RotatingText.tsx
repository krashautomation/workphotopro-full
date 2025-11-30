import React, { useState, useEffect } from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface RotatingTextProps extends Omit<TextProps, 'children'> {
  words: string[];
  interval?: number; // Time in milliseconds between rotations
  style?: TextProps['style'];
}

export default function RotatingText({ 
  words, 
  interval = 2000, 
  style,
  ...textProps 
}: RotatingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (words.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval]);

  if (words.length === 0) return null;

  return (
    <Text style={[style, styles.highlightedText]} {...textProps}>
      {words[currentIndex]}
    </Text>
  );
}

const styles = StyleSheet.create({
  highlightedText: {
    backgroundColor: '#ccff00',
    color: '#000',
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

