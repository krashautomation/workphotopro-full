import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { Colors } from '@/utils/colors';

export interface EmojiPickerRef {
    close: () => void;
    isOpen: () => boolean;
}

interface EmojiPickerProps {
    /** Callback when an emoji is selected */
    onEmojiSelect: (emoji: string) => void;
    /** Callback when the picker open state changes */
    onOpenChange?: (isOpen: boolean) => void;
    /** Whether the picker button is disabled */
    isDisabled?: boolean;
    /** Custom list of emojis to display */
    emojis?: string[];
    /** Controlled open state (if provided, component becomes controlled) */
    isOpen?: boolean;
    /** Callback to close other menus when emoji picker opens */
    onCloseOtherMenus?: () => void;
    /** Whether to render the picker view separately (for different placement) */
    renderPickerSeparately?: boolean;
}

const EmojiPicker = forwardRef<EmojiPickerRef, EmojiPickerProps>(
    (
        {
            onEmojiSelect,
            onOpenChange,
            isDisabled = false,
            emojis = ['👍', '❤️', '😂', '😮', '🔥'],
            isOpen: controlledIsOpen,
            onCloseOtherMenus,
            renderPickerSeparately = false,
        },
        ref
    ) => {
        const [internalIsOpen, setInternalIsOpen] = useState(false);
        
        // Use controlled state if provided, otherwise use internal state
        const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
        
        const setIsOpen = (open: boolean) => {
            if (controlledIsOpen === undefined) {
                setInternalIsOpen(open);
            }
            onOpenChange?.(open);
        };

        const handleToggle = () => {
            const newIsOpen = !isOpen;
            setIsOpen(newIsOpen);
            
            // Close other menus when opening
            if (newIsOpen && onCloseOtherMenus) {
                onCloseOtherMenus();
            }
        };

        const handleEmojiSelect = (emoji: string) => {
            onEmojiSelect(emoji);
            setIsOpen(false);
        };

        // Expose methods via ref
        useImperativeHandle(ref, () => ({
            close: () => setIsOpen(false),
            isOpen: () => isOpen,
        }));

        const pickerView = isOpen ? (
            <View style={styles.pickerContainer}>
                {emojis.map((emoji) => (
                    <Pressable
                        key={emoji}
                        onPress={() => handleEmojiSelect(emoji)}
                        style={styles.emojiButton}
                    >
                        <Text style={styles.emojiText}>{emoji}</Text>
                    </Pressable>
                ))}
            </View>
        ) : null;

        return (
            <>
                {/* Emoji Picker Button */}
                <Pressable 
                    onPress={handleToggle}
                    disabled={isDisabled}
                    style={styles.button}
                >
                    <IconSymbol 
                        name="face.smiling" 
                        color={isDisabled ? Colors.Gray : '#4A9EFF'}
                        size={24}
                    />
                </Pressable>

                {/* Emoji Picker - render inline unless renderPickerSeparately is true */}
                {!renderPickerSeparately && pickerView}
            </>
        );
    }
);

EmojiPicker.displayName = 'EmojiPicker';

// Export a separate component for the picker view
export const EmojiPickerView: React.FC<{
    isOpen: boolean;
    emojis?: string[];
    onEmojiSelect: (emoji: string) => void;
}> = ({ isOpen, emojis = ['👍', '❤️', '😂', '😮', '🔥'], onEmojiSelect }) => {
    if (!isOpen) return null;

    return (
        <View style={styles.pickerContainer}>
            {emojis.map((emoji) => (
                <Pressable
                    key={emoji}
                    onPress={() => onEmojiSelect(emoji)}
                    style={styles.emojiButton}
                >
                    <Text style={styles.emojiText}>{emoji}</Text>
                </Pressable>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickerContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Colors.Gray,
        borderRadius: 8,
        marginTop: 8,
        backgroundColor: Colors.Secondary,
    },
    emojiButton: {
        padding: 12,
        backgroundColor: Colors.Primary + '20',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.Primary,
    },
    emojiText: {
        fontSize: 24,
    },
});

export default EmojiPicker;
