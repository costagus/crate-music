'use server';

import { createClient } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

interface SpinLogPayload {
  albumExternalId: string;
  albumTitle: string;
  albumImageUrl: string;
  albumReleaseType: 'album' | 'single' | 'ep';
  albumReleaseDate: string;
  artistExternalId: string;
  artistName: string;
  rating: number;
  mediaFormat: 'vinyl' | 'cd' | 'cassette' | 'streaming' | 'live';
  context: string;
  notes: string;
}

export async function createSpinLog(payload: SpinLogPayload) {
  const supabase = await createClient()

  // 1. obter usuário logado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuário precisa estar autenticado para salvar uma avaliação.')
  }

  // 2. JIT: garantir que o Artista exista no banco local
  let artistId: string
  const { data: existingArtist } = await supabase
    .from('artists')
    .select('id')
    .eq('external_id', payload.artistExternalId)
    .maybeSingle()

  if (existingArtist) {
    artistId = existingArtist.id
  } else {
    const { data: newArtist, error: artistError } = await supabase
      .from('artists')
      .insert({
        external_id: payload.artistExternalId,
        name: payload.artistName,
        image_url: payload.albumImageUrl, // usa a própria capa como referência se o artista não tiver uma própria
      })
      .select('id')
      .single()

    if (artistError) throw artistError
    artistId = newArtist.id
  }

  // 3. JIT: garantir que o Álbum exista no banco local
  let albumId: string
  const { data: existingAlbum } = await supabase
    .from('albums')
    .select('id')
    .eq('external_id', payload.albumExternalId)
    .maybeSingle()

  if (existingAlbum) {
    albumId = existingAlbum.id
  } else {
    const { data: newAlbum, error: albumError } = await supabase
      .from('albums')
      .insert({
        external_id: payload.albumExternalId,
        artist_id: artistId,
        title: payload.albumTitle,
        release_type: payload.albumReleaseType,
        release_date: payload.albumReleaseDate || null,
        image_url: payload.albumImageUrl,
      })
      .select('id')
      .single()

    if (albumError) throw albumError
    albumId = newAlbum.id
  }

  // 4. inserir o Spin Log associado ao Usuário e Álbum locais
  const { error: logError } = await supabase
    .from('spin_logs')
    .insert({
      user_id: user.id,
      album_id: albumId,
      rating: payload.rating,
      media_format: payload.mediaFormat,
      context: payload.context || null,
      notes: payload.notes || null,
    })

  if (logError) {
    console.error(logError)
    throw new Error('Erro ao salvar o registro de audição.')
  }

  // revalida a Home para atualizar estatísticas futuras e limpa cache
  revalidatePath('/', 'layout')
  redirect('/')
}