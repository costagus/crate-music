import { getSpotifyAlbum } from '@/utils/spotify'
import { createClient } from '@/utils/supabase'
import { createSpinLog } from '@/actions/spinActions'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface LogPageProps {
  params: Promise<{ id: string }>
}

export default async function LogPage({ params }: LogPageProps) {
  const resolvedParams = await params
  const albumId = resolvedParams.id

  // 1. validar autenticação
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. buscar detalhes do álbum na API do Spotify
  const album = await getSpotifyAlbum(albumId)
  if (!album) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white">
        <p>Álbum não encontrado na API do Spotify.</p>
        <Link href="/" className="text-indigo-400 underline mt-4">Voltar</Link>
      </div>
    )
  }

  // 3. função nativa de submit que chama nossa Server Action
  const handleFormSubmit = async (formData: FormData) => {
    'use server';
    
    const rating = parseFloat(formData.get('rating') as string)
    const mediaFormat = formData.get('mediaFormat') as 'vinyl' | 'cd' | 'cassette' | 'streaming' | 'live'
    const context = formData.get('context') as string
    const notes = formData.get('notes') as string

    await createSpinLog({
      albumExternalId: album.id,
      albumTitle: album.title,
      albumImageUrl: album.image_url,
      albumReleaseType: album.release_type,
      albumReleaseDate: album.release_date,
      artistExternalId: album.artist_id,
      artistName: album.artist_name,
      rating,
      mediaFormat,
      context,
      notes,
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-6">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl flex flex-col md:flex-row gap-8">
        
        {/* capa e informações do álbum */}
        <div className="w-full md:w-1/3 flex flex-col items-center gap-4 text-center">
          <img 
            src={album.image_url} 
            alt={album.title} 
            className="w-48 aspect-square object-cover rounded-lg shadow-lg border border-zinc-700"
          />
          <div>
            <h1 className="font-extrabold text-lg leading-tight">{album.title}</h1>
            <p className="text-zinc-400 text-sm">{album.artist_name}</p>
            <p className="text-zinc-500 text-xs mt-1">{album.release_date.split('-')[0]}</p>
          </div>
          <Link href="/" className="text-zinc-500 text-xs hover:underline mt-4">← Cancelar</Link>
        </div>

        {/* formulário do Spin Log */}
        <form action={handleFormSubmit} className="flex-1 space-y-6">
          <h2 className="text-xl font-bold border-b border-zinc-800 pb-2">Salvar Avaliação (Spin Log)</h2>

          {/* seleção de nota */}
          <div>
            <label htmlFor="rating" className="block text-sm font-medium text-zinc-300">Nota (Estrelas)</label>
            <select
              id="rating"
              name="rating"
              required
              className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm"
            >
              <option value="5.0">⭐⭐⭐⭐⭐ (5.0)</option>
              <option value="4.5">⭐⭐⭐⭐✨ (4.5)</option>
              <option value="4.0">⭐⭐⭐⭐ (4.0)</option>
              <option value="3.5">⭐⭐⭐✨ (3.5)</option>
              <option value="3.0">⭐⭐⭐ (3.0)</option>
              <option value="2.5">⭐⭐✨ (2.5)</option>
              <option value="2.0">⭐⭐ (2.0)</option>
              <option value="1.5">⭐✨ (1.5)</option>
              <option value="1.0">⭐ (1.0)</option>
              <option value="0.5">✨ (0.5)</option>
            </select>
          </div>

          {/* formato de mídia */}
          <div>
            <label htmlFor="mediaFormat" className="block text-sm font-medium text-zinc-300">Como você ouviu?</label>
            <select
              id="mediaFormat"
              name="mediaFormat"
              required
              className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm"
            >
              <option value="streaming">📱 Streaming (Spotify/Apple Music)</option>
              <option value="vinyl">💿 Vinyl / LP</option>
              <option value="cd">💿 CD</option>
              <option value="cassette">📟 Cassete</option>
              <option value="live">🎸 Live</option>
            </select>
          </div>

          {/* contexto da escuta */}
          <div>
            <label htmlFor="context" className="block text-sm font-medium text-zinc-300">Onde você estava? (Opcional)</label>
            <input
              id="context"
              name="context"
              type="text"
              placeholder="Ex: No trânsito, foco total com fones..."
              className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 text-sm"
            />
          </div>

          {/* notas / review */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-zinc-300">O que achou deste lançamento? (Opcional)</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Escreva sua mini-resenha ou pensamentos sobre as faixas..."
              className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Salvar Spin Log
          </button>
        </form>

      </div>
    </main>
  )
}