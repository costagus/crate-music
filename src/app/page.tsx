import { createClient } from '@/utils/supabase'
import { logout } from './login/actions'
import { handleSearch } from '@/actions/spotifyActions'
import Link from 'next/link'
import { addAlbumToCrate } from '@/actions/crateActions'

export const dynamic = 'force-dynamic'

interface HomeProps {
  searchParams: Promise<{ q?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const supabase = await createClient()
  const params = await searchParams
  const query = params.q || ''

  // 1. obter os dados do usuário atual e perfil
  const { data: { user } } = await supabase.auth.getUser()
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  let userCrates: any[] = []
  if (user) {
    const { data } = await supabase
      .from('crates')
      .select('id, title')
      .eq('user_id', user.id)
    userCrates = data || []
  }
  
  // 2. realizar busca se houver query na URL
  const searchResults = query ? await handleSearch(query) : []

  // 3. buscar todos os Spin Logs recentes cadastrados no banco (Feed Global)
  const { data: recentLogs } = await supabase
    .from('spin_logs')
    .select(`
      id,
      rating,
      media_format,
      notes,
      context,
      created_at,
      profiles ( username, avatar_url ),
      albums ( title, image_url, artists ( name ) )
    `)
    .order('created_at', { ascending: false })

  // função auxiliar para converter enums de mídia em emojis visuais
  const getFormatEmoji = (format: string) => {
    switch (format) {
      case 'vinyl': return '💿 Vinil';
      case 'cd': return '💿 CD';
      case 'cassette': return '📟 Cassete';
      case 'live': return '🎸 Ao Vivo';
      default: return '📱 Streaming';
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-zinc-950 text-white p-12">
      <div className="w-full max-w-xl space-y-8">
        
        {/* header com login */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-black tracking-tight">Crate Music 💿</h1>
          {user && profile ? (
            <div className="flex items-center gap-3">
              <Link href="/crates" className="text-xs text-indigo-400 hover:underline mr-4">📦 Minhas Caixas</Link>
              <span className="text-sm font-bold text-zinc-400">@{profile.username}</span>
              <form action={logout}>
                <button className="text-xs text-red-400 hover:underline">Sair</button>
              </form>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-md font-semibold text-xs transition-colors"
            >
              Entrar
            </Link>
          )}
        </div>

        {/* barra de pesquisa */}
        <form method="GET" action="/" className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Pesquise por álbum ou artista para avaliar..."
            className="flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          />
          <button 
            type="submit"
            className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Buscar
          </button>
        </form>

        {/* resultados da busca */}
        {query && (
          <div className="space-y-4 border-b border-zinc-800 pb-8">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Resultados para "{query}":</h2>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
              {searchResults.map((album) => (
                <div 
                  key={album.id} 
                  className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col gap-3 hover:border-indigo-500/50 transition-all text-left"
                >
                  <img 
                    src={album.image_url} 
                    alt={album.title} 
                    className="w-full aspect-square object-cover rounded-md shadow-md"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm truncate">{album.title}</h3>
                      <p className="text-zinc-400 text-xs truncate">{album.artist_name}</p>
                    </div>

                    <div className="mt-4 space-y-3">
                      {/* Link para avaliar */}
                      <Link 
                        href={user ? `/log/${album.id}` : '/login'}
                        className="block text-center text-xs font-bold text-indigo-400 hover:bg-indigo-950/30 border border-indigo-900/40 py-1.5 rounded-md transition-colors"
                      >
                        Avaliar álbum (Log) →
                      </Link>

                      {/* seletor de caixas (apenas se o usuário estiver logado e possuir caixas) */}
                      {user && userCrates.length > 0 && (
                        <form 
                          action={async (formData) => {
                            'use server';
                            const crateId = formData.get('crateId') as string
                            if (!crateId) return;

                            await addAlbumToCrate({
                              crateId,
                              albumExternalId: album.id,
                              albumTitle: album.title,
                              albumImageUrl: album.image_url,
                              albumReleaseType: album.release_type,
                              albumReleaseDate: album.release_date,
                              artistExternalId: album.artist_id,
                              artistName: album.artist_name,
                            })
                          }}
                          className="flex gap-1"
                        >
                          <select 
                            name="crateId"
                            required
                            className="flex-1 bg-zinc-950 border border-zinc-800 text-[11px] rounded-md px-2 py-1 text-zinc-300 focus:outline-none"
                          >
                            <option value="">Guardar na caixa...</option>
                            {userCrates.map((crate) => (
                              <option key={crate.id} value={crate.id}>{crate.title}</option>
                            ))}
                          </select>
                          <button 
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-[11px] font-bold px-2.5 py-1 rounded-md transition-colors"
                          >
                            +
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">Nenhum resultado encontrado.</p>
            )}
          </div>
        )}

        {/* feed de atividades (Logs Recentes) */}
        {!query && (
          <div className="space-y-6">
            <h2 className="text-sm uppercase tracking-widest text-zinc-400 font-black">Atividade Recente da Comunidade</h2>
            
            {recentLogs && recentLogs.length > 0 ? (
              <div className="space-y-4">
                {recentLogs.map((log: any) => (
                  <div 
                    key={log.id} 
                    className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl flex gap-5 text-left"
                  >
                    <img 
                      src={log.albums?.image_url} 
                      alt={log.albums?.title} 
                      className="w-20 h-20 object-cover rounded-md shadow-md border border-zinc-800"
                    />
                    <div className="flex-1 space-y-1">
                      {/* usuário que avaliou */}
                      <div className="flex items-center gap-2 mb-1">
                        <img 
                          src={log.profiles?.avatar_url} 
                          alt="Avatar" 
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="text-xs font-bold text-zinc-400">@{log.profiles?.username}</span>
                        <span className="text-zinc-600 text-xs">•</span>
                        <span className="text-zinc-500 text-[10px]">{getFormatEmoji(log.media_format)}</span>
                      </div>

                      {/* informações do disco e nota */}
                      <h3 className="font-black text-sm leading-none">{log.albums?.title}</h3>
                      <p className="text-zinc-400 text-xs">{log.albums?.artists?.name}</p>
                      
                      {/* estrelas */}
                      <p className="text-amber-400 text-xs font-bold pt-1">
                        {'★'.repeat(Math.floor(log.rating))}
                        {log.rating % 1 !== 0 ? '½' : ''} 
                        <span className="text-zinc-500 ml-1">({log.rating})</span>
                      </p>

                      {/* resenha / comentário */}
                      {log.notes && (
                        <p className="text-zinc-300 text-xs italic bg-zinc-950/40 p-2.5 rounded-md mt-2 border border-zinc-800/50">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-600 text-sm">Nenhuma avaliação foi criada ainda. Seja o primeiro!</p>
            )}
          </div>
        )}

      </div>
    </main>
  )
}