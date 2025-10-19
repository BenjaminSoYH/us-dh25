import React, {useState} from 'react'
import {StyleSheet, TextInput, View} from "react-native";

const LoginInput = ({placeHolder, onChange} :{placeHolder: string, onChange: any}) => {
    const [value, setValue] = useState<string>('');

    const handleChange = (input:string) => {
        setValue(input);
        onChange(input);
    }

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder={placeHolder}
                placeholderTextColor="#999"
                value={value}
                onChangeText={handleChange}
                autoCapitalize="none"
                autoCorrect={false}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E6EAEF',
        backgroundColor: '#F5F7FA',
        width: '100%',
    },
    iconContainer: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
});

export default LoginInput;