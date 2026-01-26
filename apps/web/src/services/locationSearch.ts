export interface SearchLocationResult {
  label: string
  lat: number
  lng: number
}

export async function searchLocations(query: string): Promise<SearchLocationResult[]> {
  if (!query || query.length < 3) return []

  try {
    const res = await fetch(
      `/api/location/search?q=${encodeURIComponent(query)}`
    )
    return await res.json()
  } catch (error) {
    console.error('Location search failed', error)
    return []
  }
}
