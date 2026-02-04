import { loadGoogleMaps } from './googleMapsLoader'

export function formatAddress(item: any): { label: string; subLabel: string } {
  // ... (keep existing implementation if needed, but we are moving to Google mainly)
  // For now, I will keep this function as is, it's used by the old Nominatim logic if any remains.
  // console.log('formatAddress Input:', item)
  if (!item) return { label: 'Unknown Location', subLabel: '' }

  const a = item.address || {}
  const displayName = item.display_name || ''
  
  // 1. Identify the "City" or main anchor
  const city = a.city || 
               a.town || 
               a.municipality || 
               a.state_district || 
               'Unknown City'

  // 2. Split display_name
  const parts = displayName.split(',').map((p: string) => p.trim())

  // 3. Determine the "Area"
  let cityIndex = -1
  cityIndex = parts.findIndex((p: string) => p.toLowerCase() === city.toLowerCase())
  
  if (cityIndex === -1) {
      cityIndex = parts.findIndex((p: string) => p.toLowerCase().includes(city.toLowerCase()))
  }

  let areaParts: string[] = []

  if (cityIndex > 0) {
    areaParts = parts.slice(0, cityIndex)
  } else {
    areaParts = parts
  }

  // 4. Filter and clean
  const cleanAreaParts = areaParts.filter((p: string) => {
    const lower = p.toLowerCase()
    const lowerCity = city.toLowerCase()
    if (lower === lowerCity) return false
    if (p.match(/^\d{6}$/)) return false
    if (lower === 'india') return false
    if (['uttar pradesh', 'up', 'delhi', 'haryana', 'maharashtra', 'karnataka'].includes(lower)) return false
    if (lower.includes('district') && lower !== lowerCity) return false
    return true
  })

  // 5. Construct Final Label
  const areaString = cleanAreaParts.slice(0, 3).join(', ')
  const label = areaString ? `${areaString}, ${city}` : city
  
  return {
    label,
    subLabel: displayName
  }
}

// NEW: Google Maps Helper (Using JS API to avoid CORS)
export async function getGoogleAddress(lat: number, lng: number): Promise<{ label: string; subLabel: string } | null> {
    try {
      // Add a timeout to loadGoogleMaps to prevent hanging indefinitely
      const loadPromise = loadGoogleMaps();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Google Maps Load Timeout')), 5000));
      
      await Promise.race([loadPromise, timeoutPromise]);
      
      const geocoder = new (window as any).google.maps.Geocoder()
      console.error('--- GOOGLE JS API REQUEST ---')
      console.error('LatLng:', lat, lng)

      // WRAPPING IN PROMISE (Callback Pattern) for Maximum Compatibility
      return new Promise((resolve) => {
          geocoder.geocode({ location: { lat, lng } }, (results: any[], status: any) => {
              console.error('--- GOOGLE JS API RESPONSE (CALLBACK) ---')
              console.error('Status:', status)
              console.error('Results:', results)

              if (status === 'OK' && results && results.length > 0) {
                  // FILTER: Prefer ROOFTOP or RANGE_INTERPOLATED for better precision
                  // If not found, fall back to the first result (which Google ranks best usually)
                  const preciseResult = results.find((r: any) => 
                      r.geometry.location_type === 'ROOFTOP' || 
                      r.geometry.location_type === 'RANGE_INTERPOLATED'
                  );
                  
                  const result = preciseResult || results[0]
                  
                  // Swiggy-Style Precision Logic
                  let streetNumber = ''
                  let route = ''
                  let neighborhood = ''
                  let sublocality_level_3 = ''
                  let sublocality_level_2 = ''
                  let sublocality_level_1 = ''
                  let locality = ''
                  let landmark = ''
                  let premise = ''
                  let subpremise = ''
                  let plus_code = ''

                  // Check for Plus Code (often very precise for unaddressed areas)
                  if (result.plus_code && result.plus_code.compound_code) {
                      plus_code = result.plus_code.compound_code.split(' ')[1] // Extract name part
                  }

                  result.address_components.forEach((c: any) => {
                      const type = c.types[0]
                      if (type === 'street_number') streetNumber = c.long_name
                      if (type === 'route') route = c.long_name
                      if (type === 'neighborhood') neighborhood = c.long_name
                      if (type === 'sublocality_level_3') sublocality_level_3 = c.long_name
                      if (type === 'sublocality_level_2') sublocality_level_2 = c.long_name
                      if (type === 'sublocality_level_1') sublocality_level_1 = c.long_name
                      if (type === 'locality') locality = c.long_name
                      if (type === 'premise') premise = c.long_name
                      if (type === 'subpremise') subpremise = c.long_name
                      if (type === 'landmark' || type === 'point_of_interest') landmark = c.long_name
                  })

                  const titleParts = []
                  
                  // HIGHEST PRIORITY: Premise/Building Name
                  if (premise) titleParts.push(premise)
                  if (subpremise) titleParts.push(subpremise)
                  if (landmark) titleParts.push(landmark)
                  
                  // SECOND PRIORITY: Street/Route
                  if (streetNumber) titleParts.push(streetNumber)
                  if (route) titleParts.push(route)
                  
                  // THIRD PRIORITY: Micro-locality (Block/Sector)
                  if (sublocality_level_3) titleParts.push(sublocality_level_3)
                  if (sublocality_level_2) titleParts.push(sublocality_level_2)
                  
                  // LAST PRIORITY: General Area
                  if (neighborhood) titleParts.push(neighborhood)
                  if (sublocality_level_1) titleParts.push(sublocality_level_1)
                  
                  const uniqueTitleParts = [...new Set(titleParts)].filter(Boolean)
                  
                  let label = ''
                  
                  if (uniqueTitleParts.length >= 2) {
                      // e.g. "Grand Omaxe, Sector 93B"
                      label = `${uniqueTitleParts[0]}, ${uniqueTitleParts[1]}`
                  } else if (uniqueTitleParts.length === 1) {
                      // e.g. "Sector 93B, Noida" (Append locality if only 1 part found)
                      label = `${uniqueTitleParts[0]}, ${locality}`
                  } else {
                      // Fallback to formatted address start
                      label = result.formatted_address.split(',')[0]
                  }

                  // Super Fallback: If label is still too generic (just a number), append route
                  if (label.match(/^\d+$/) && route) {
                      label = `${label}, ${route}`
                  }

                  resolve({
                    label: label,
                    subLabel: result.formatted_address
                  })
              } else {
                  console.error('Geocoder Failed or No Results:', status)
                  resolve(null)
              }
          })
      })

    } catch (e) {
      console.error('Google Maps Geocoder Error', e)
      return null
    }
}
