import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native'
import { acceptCoupleRequest, cancelCoupleRequest, declineCoupleRequest, listMyCoupleRequests, sendCoupleRequest } from '../lib/db'
import { supabase } from '../lib/supabase'

export default function CoupleRequestsPanel() {
    const [recipientHandle, setRecipientHandle] = useState('')
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [incoming, setIncoming] = useState<any[]>([])
    const [outgoing, setOutgoing] = useState<any[]>([])

    async function refresh() {
        setRefreshing(true)
        try {
            const user = (await supabase.auth.getUser()).data.user
            if (!user) {
                setIncoming([])
                setOutgoing([])
                return
            }
            const r = await listMyCoupleRequests()
            setIncoming(r.incoming)
            setOutgoing(r.outgoing)
        } catch (e: any) {
            if (e?.message && !String(e.message).includes('Not authenticated')) {
                Alert.alert('Error', e.message ?? String(e))
            }
        } finally {
            setRefreshing(false)
        }
    }

    useEffect(() => {
        refresh()
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'SIGNED_OUT') {
                setIncoming([])
                setOutgoing([])
                setRecipientHandle('')
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await refresh()
            }
        })
        return () => {
            subscription.unsubscribe()
        }
    }, [])

    async function onSend() {
        setLoading(true)
        try {
            await sendCoupleRequest({ recipient_handle: recipientHandle.trim(), message: null })
            setRecipientHandle('')
            await refresh()
        } catch (e: any) {
            Alert.alert('Error', e.message ?? String(e))
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={{ width: '100%', padding: 12 }}>
            <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8 }}>Couple Requests</Text>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TextInput
                    style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' }}
                    placeholder="Partner handle (UUID for now)"
                    autoCapitalize={'none'}
                    value={recipientHandle}
                    onChangeText={setRecipientHandle}
                />
                <TouchableOpacity onPress={onSend} disabled={loading || !recipientHandle.trim()} style={{ backgroundColor: '#111', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 }}>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>{loading ? '...' : 'Send'}</Text>
                </TouchableOpacity>
            </View>

            <Text style={{ fontWeight: '600', marginBottom: 6 }}>Incoming</Text>
            <FlatList
                data={incoming}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
                ListEmptyComponent={<Text style={{ color: '#666' }}>No incoming requests</Text>}
                renderItem={({ item }) => (
                    <View style={{ borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 8, marginBottom: 8 }}>
                        <Text style={{ marginBottom: 8 }}>From: {item.requester_id}</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity onPress={async () => { await acceptCoupleRequest(item.id); await refresh(); }} style={{ backgroundColor: '#0a7', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 }}>
                                <Text style={{ color: '#fff' }}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={async () => { await declineCoupleRequest(item.id); await refresh(); }} style={{ backgroundColor: '#a00', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 }}>
                                <Text style={{ color: '#fff' }}>Decline</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            <Text style={{ fontWeight: '600', marginVertical: 6 }}>Outgoing</Text>
            <FlatList
                data={outgoing}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={{ color: '#666' }}>No outgoing requests</Text>}
                renderItem={({ item }) => (
                    <View style={{ borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 8, marginBottom: 8 }}>
                        <Text style={{ marginBottom: 8 }}>To: {item.recipient_id}</Text>
                        <TouchableOpacity onPress={async () => { await cancelCoupleRequest(item.id); await refresh(); }} style={{ backgroundColor: '#444', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, alignSelf: 'flex-start' }}>
                            <Text style={{ color: '#fff' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    )
}


