'use server';

import { createClient } from '@/utils/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ação para criar uma nova caixa virtual
export async function createCrate(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado.')

  const title = formData.get('title') as string
  const description = formData.get('description') as string

  const { error } = await supabase.from('crates').insert({
    user_id: user.id,
    title,
    description,
    max_capacity: 50, // limite conceitual de discos por caixa
  })

  if (error) {
    console.error(error)
    throw new Error('Erro ao criar a caixa.')
  }

  revalidatePath('/crates')
  redirect('/crates')
}

interface AddToCratePayload {
  crateId: string;
  albumExternalId: string;
  albumTitle: string;
  albumImageUrl: string;
  albumReleaseType: 'album' | 'single' | 'ep';
  albumReleaseDate: string;
  artistExternalId: string;
  artistName: string;
}

// adiciona um álbum a uma caixa (com ingestão JIT)
export async function addAlbumToCrate(payload: AddToCratePayload) {
  const supabase = await createClient()

  // 1. JIT: garantir que o artista exista no banco local
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
        image_url: payload.albumImageUrl,
      })
      .select('id')
      .single()

    if (artistError) throw artistError
    artistId = newArtist.id
  }

  // 2. JIT: garantir q allbum exista no banco local
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

  // 3. determinar a próxima posição lexicográfica na caixa (Fractional Indexing simples)
  let nextPosition = 'n'
  const { data: lastItem } = await supabase
    .from('crate_items')
    .select('position')
    .eq('crate_id', payload.crateId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastItem) {
    // add uma letra para garantir que seja classificado depois do últimod
    nextPosition = lastItem.position + 'n'
  }

  // 4. inserir o item na caixa
  const { error: itemError } = await supabase
    .from('crate_items')
    .insert({
      crate_id: payload.crateId,
      album_id: albumId,
      position: nextPosition,
    })

  if (itemError) {
    if (itemError.code === '23505') {
      // código de erro Postgres para violação de chave única (já inserido)
      throw new Error('Este álbum já está guardado nesta caixa!')
    }
    console.error(itemError)
    throw new Error('Erro ao adicionar o álbum na caixa.')
  }

  revalidatePath(`/crates/${payload.crateId}`)
}