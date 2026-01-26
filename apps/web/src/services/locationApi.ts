export interface ReverseGeocodeResult {
  locality: string
  city: string
  state: string
  fullAddress: string
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    )
    const data = await res.json()

    if (!data || !data.address) {
      return { locality: '', city: '', state: '', fullAddress: '' }
    }

    return {
      locality:
        data.address.suburb ||
        data.address.neighbourhood ||
        data.address.village ||
        data.address.town ||
        data.address.city ||
        '',
      city: data.address.city || data.address.town || '',
      state: data.address.state || '',
      fullAddress: data.display_name || ''
    }
  } catch (error) {
    console.error('Reverse geocoding failed', error)
    return { locality: '', city: '', state: '', fullAddress: '' }
  }
}
