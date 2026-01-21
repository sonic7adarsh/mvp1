import React, { useMemo, useState } from 'react'
import { SafeAreaView, View, Text, TextInput, Button, ScrollView, Alert } from 'react-native'
import type { ApiContext } from './api/client'
import { handleApiError } from './api/client'
import { getCart, checkout, getCustomerOrders, getDeliveryById, riderComplete } from './api/endpoints'

type Role = 'customer' | 'seller' | 'rider' | 'admin'

function TenantTokenForm({
  jwt,
  tenant,
  onChange,
}: {
  jwt?: string
  tenant?: string
  onChange: (next: { jwt?: string; tenant?: string }) => void
}) {
  const [localJwt, setLocalJwt] = useState(jwt || '')
  const [localTenant, setLocalTenant] = useState(tenant || '')
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <TextInput
        placeholder="JWT"
        value={localJwt}
        onChangeText={setLocalJwt}
        style={{ borderWidth: 1, padding: 8, flex: 1 }}
      />
      <TextInput
        placeholder="Tenant"
        value={localTenant}
        onChangeText={setLocalTenant}
        style={{ borderWidth: 1, padding: 8, width: 160 }}
      />
      <Button title="Apply" onPress={() => onChange({ jwt: localJwt, tenant: localTenant })} />
    </View>
  )
}

function RoleSwitcher({ roles, activeRole, onChange }: { roles: Role[]; activeRole: Role; onChange: (r: Role) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <Text>Role:</Text>
      {roles.map((r) => (
        <Button key={r} title={r} onPress={() => onChange(r)} />
      ))}
      <Text>Active: {activeRole}</Text>
    </View>
  )
}

export default function App() {
  const [jwt, setJwt] = useState<string | undefined>()
  const [tenant, setTenant] = useState<string | undefined>()
  const [activeRole, setActiveRole] = useState<Role>('customer')
  const roles: Role[] = ['customer', 'seller', 'rider', 'admin']
  const isReady = useMemo(() => Boolean(jwt && tenant), [jwt, tenant])

  const ctx: ApiContext | undefined = jwt && tenant ? { jwt, tenant } : undefined

  return (
    <SafeAreaView style={{ padding: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 8 }}>BharatShop Mobile MVP v1</Text>
      <TenantTokenForm jwt={jwt} tenant={tenant} onChange={(n) => { setJwt(n.jwt); setTenant(n.tenant) }} />
      <RoleSwitcher roles={roles} activeRole={activeRole} onChange={setActiveRole} />
      {!isReady && <Text style={{ backgroundColor: '#fff3cd', padding: 8, marginTop: 8 }}>Enter JWT and Tenant to enable API calls.</Text>}

      {isReady && activeRole === 'customer' && (
        <ScrollView style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 18 }}>Customer Dashboard</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Load Cart" onPress={async () => {
              try {
                const c = await getCart(ctx!)
                Alert.alert('Cart', JSON.stringify(c))
              } catch (e) { Alert.alert('Error', handleApiError(e)) }
            }} />
            <Button title="Checkout" onPress={async () => {
              try { await checkout(ctx!); Alert.alert('Checkout', 'Complete') }
              catch (e) { Alert.alert('Error', handleApiError(e)) }
            }} />
          </View>
          <Button title="Load Orders" onPress={async () => {
            try { const o = await getCustomerOrders(ctx!); Alert.alert('Orders', JSON.stringify(o)) }
            catch (e) { Alert.alert('Error', handleApiError(e)) }
          }} />
        </ScrollView>
      )}

      {isReady && activeRole === 'seller' && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 18 }}>Seller Dashboard</Text>
          <Text>Orders with state-aware actions appear here</Text>
        </View>
      )}

      {isReady && activeRole === 'rider' && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 18 }}>Rider / Logistics Dashboard</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              placeholder="Delivery ID"
              value={deliveryId}
              onChangeText={setDeliveryId}
              style={{ borderWidth: 1, padding: 8, flex: 1 }}
            />
            <Button title="Load" onPress={async () => {
              try { const d = await getDeliveryById(deliveryId, ctx!); Alert.alert('Delivery', JSON.stringify(d)) }
              catch (e) { Alert.alert('Error', handleApiError(e)) }
            }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TextInput
              placeholder="OTP"
              value={otp}
              onChangeText={setOtp}
              style={{ borderWidth: 1, padding: 8, flex: 1 }}
            />
            <Button title="Complete" onPress={async () => {
              try { await riderComplete(deliveryId, otp, ctx!); Alert.alert('Complete', 'Delivered') }
              catch (e) { Alert.alert('Error', handleApiError(e)) }
            }} />
          </View>
        </View>
      )}

      {isReady && activeRole === 'admin' && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 18 }}>Admin Dashboard</Text>
          <Text>Zones CRUD and Admin logistics actions appear here</Text>
        </View>
      )}
    </SafeAreaView>
  )
}