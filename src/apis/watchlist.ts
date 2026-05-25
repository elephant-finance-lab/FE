import { apiRequest } from '../lib/apiClient'

export interface WatchlistItem {
  itemId: number
  ticker: string
}

export interface WatchlistGroup {
  groupId: number
  name: string
  items: WatchlistItem[]
}

export interface WatchlistGroupList {
  groups: WatchlistGroup[]
}

export interface WatchlistGroupRequest {
  name: string
}

export interface WatchlistItemRequest {
  groupId: number
  ticker: string
}

export function getWatchlistGroups() {
  return apiRequest<WatchlistGroupList>('/api/watchlist/groups')
}

export function createWatchlistGroup(payload: WatchlistGroupRequest) {
  return apiRequest<void>('/api/watchlist/groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateWatchlistGroup(groupId: number, payload: WatchlistGroupRequest) {
  return apiRequest<void>(`/api/watchlist/groups/${groupId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteWatchlistGroup(groupId: number) {
  return apiRequest<void>(`/api/watchlist/groups/${groupId}`, {
    method: 'DELETE',
  })
}

export function addWatchlistItem(payload: WatchlistItemRequest) {
  return apiRequest<void>('/api/watchlist/items', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function removeWatchlistItem(payload: WatchlistItemRequest) {
  return apiRequest<void>('/api/watchlist/items', {
    method: 'DELETE',
    body: JSON.stringify(payload),
  })
}
