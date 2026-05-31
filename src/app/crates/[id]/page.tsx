import { createClient } from '@/utils/supabase'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface CrateDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CrateDetailPage({ params }: CrateDetailPageProps) {
  const resolvedParams = await params
  const crateId = resolvedParams.id

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. buscar os detalhes da caixa de discos
  const { data: crate } = await supabase
    .from('crates')
    .select('*')
    .eq('id', crateId)
    .single()

  if (!crate) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white">
        <p>Caixa não encontrada.</p>
        <Link href="/crates" className="text-indigo-400 underline mt-4">Voltar</Link>
      </div>
    )
  }

  // 2. buscar todos os discos guardados nesta caixa (ordenados lexicograficamente pela posição)
  const { data: items } = await supabase
    .from('crate_items')
    .select(`
      id,
      position,
      added_at,
      albums (
        id,
        title,
        image_url,
        artists ( name )
      )
    `)
    .eq('crate_id', crateId)
    .order('position', { ascending: true })

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-zinc-950 text-white p-12">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* header da caixa */}
        <div className="border-b border-zinc-800 pb-6 text-left space-y-2">
          <Link href="/crates" className="text-zinc-500 hover:text-white text-xs">← Voltar para Minhas Caixas</Link>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black">{crate.title}</h1>
              <p className="text-zinc-400 text-sm mt-1">{crate.description || 'Nenhuma descrição adicionada.'}</p>
            </div>
            <span className="text-xs text-zinc-500">Capacidade: {items?.length || 0}/50 discos</span>
          </div>
        </div>

        {/* grade de discos (capas) */}
        {items && items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
            {items.map((item: any) => (
              <div 
                key={item.id} 
                className="group relative bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-indigo-500 transition-all flex flex-col gap-2"
              >
                <div className="relative aspect-square w-full rounded-md overflow-hidden shadow-md">
                  <img 
                    src={item.albums?.image_url} 
                    alt={item.albums?.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* efeito simulado de vinil sobressaindo na direita ao passar o mouse */}
                  <div className="absolute top-0 -right-2 w-full h-full bg-zinc-950 rounded-full border border-zinc-800 shadow-inner -z-10 translate-x-0 group-hover:translate-x-3 transition-transform duration-300 pointer-events-none" />
                </div>
                <div className="text-left mt-1">
                  <h3 className="font-bold text-xs truncate leading-tight">{item.albums?.title}</h3>
                  <p className="text-zinc-500 text-[10px] truncate">{item.albums?.artists?.name}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 border-2 border-dashed border-zinc-800 rounded-2xl text-center space-y-2">
            <p className="text-zinc-400 text-sm">Esta caixa de vinil está vazia.</p>
            <p className="text-zinc-600 text-xs">Pesquise por discos na página inicial e selecione esta caixa para guardá-los!</p>
            <Link href="/" className="inline-block mt-4 text-xs font-bold text-indigo-400 hover:underline">Ir pesquisar discos →</Link>
          </div>
        )}

      </div>
    </main>
  )
}