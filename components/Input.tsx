import { Colors } from '@/utils/colors';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

export default function Input({ ...props }: TextInputProps) {
    const { style, ...rest } = props;

    return (
        <TextInput
            {...rest}
            style={StyleSheet.flatten([
                {
                    padding: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: Colors.Secondary,
                    backgroundColor: Colors.Surface,
                    color: "#fff",
                    placeholderTextColor: Colors.Gray,
                }, 
                style,
            ])}
        />
    );
}

