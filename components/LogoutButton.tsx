import React, { useState } from 'react'
import { TouchableOpacity, Text } from 'react-native'
import { supabase } from '../lib/supabase'

export default function LogoutButton() {
    const [loading, setLoading] = useState(false)
    return (
        <TouchableOpacity
            disabled={loading}
            onPress={async () => {
                setLoading(true)
                try {
                    await supabase.auth.signOut()
                } finally {
                    setLoading(false)
                }
            }}
            style={{ backgroundColor: '#b00', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 }}
        >
            <Text style={{ color: '#fff', fontWeight: '600' }}>{loading ? 'Signing out…' : 'Sign out'}</Text>
        </TouchableOpacity>
    )
}


