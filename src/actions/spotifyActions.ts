'use server';

import { searchSpotifyAlbums, type SpotifyAlbumSearchResult } from '@/utils/spotify'

export async function handleSearch(query: string): Promise<SpotifyAlbumSearchResult[]> {
  return await searchSpotifyAlbums(query);
}