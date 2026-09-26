import { apiClient } from './client'

export type City = { id: number; name: string; active: boolean }
export type CityLocation = { id: number; name: string; address: string; country: string; eventCount: number }

export async function getCities(admin = false): Promise<City[]> {
  return (await apiClient.get<City[]>(admin ? '/api/admin/cities' : '/api/cities')).data
}
export async function saveCity(data: { name: string; active: boolean }, id?: number): Promise<City> {
  return id ? (await apiClient.patch<City>(`/api/admin/cities/${id}`, data)).data
    : (await apiClient.post<City>('/api/admin/cities', data)).data
}
export async function deleteCity(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/cities/${id}`)
}
export async function getCityLocations(): Promise<CityLocation[]> {
  return (await apiClient.get<CityLocation[]>('/api/admin/city-locations')).data
}
export async function assignCity(locationId: number, cityId: number): Promise<void> {
  await apiClient.patch(`/api/admin/city-locations/${locationId}`, { cityId })
}
