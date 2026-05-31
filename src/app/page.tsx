import { createClient } from '@/utils/supabase'

export default async function Home() {
  const supabase = await createClient()

  // uma busca de teste na tabela de álbuns
  const { data: albums, error } = await supabase
    .from('albums')
    .select('*, artists(name)')

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-24">
        <h1 className="text-2xl font-bold text-red-500">Erro na conexão com o banco:</h1>
        <p className="mt-2 text-zinc-400">{error.message}</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-24">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Conectado ao Banco! 💿</h1>
        <p className="text-zinc-400 mb-8 text-sm">Próxima parada: Adicionar e catalogar suas músicas.</p>
        
        {albums && albums.length > 0 ? (
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg text-left">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">Dados de Teste Carregados:</h2>
            <p className="text-lg font-bold">{albums[0].title}</p>
            <p className="text-zinc-400 text-sm">Artista: {albums[0].artists?.name}</p>
            <p className="text-zinc-500 text-xs mt-4">Data de lançamento cadastrada: {albums[0].release_date}</p>
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">Conectado com sucesso, mas nenhum dado foi encontrado.</p>
        )}
      </div>
    </main>
  )
}