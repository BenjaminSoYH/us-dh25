import React, {useState} from 'react'
import {TouchableOpacity, Text, StyleSheet} from "react-native";

const ButtonComponent = ({title, mainColor, textColor}: { title: string, mainColor: string, textColor: string }) => {
    return (
        <TouchableOpacity style={[styles.button, {backgroundColor: `#${mainColor}`}]}>
            <Text style={[styles.text, {color: `#${textColor}`}]}>{title}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    }
})

export default ButtonComponent;