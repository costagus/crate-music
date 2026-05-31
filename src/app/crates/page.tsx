import { createClient } from '@/utils/supabase'
import { createCrate } from '@/actions/crateActions'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CratesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // buscar todas as caixas pertencentes ao usuário logado
  const { data: userCrates } = await supabase
    .from('crates')
    .select('*, crate_items(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-zinc-950 text-white p-12">
      <div className="w-full max-w-4xl space-y-12">
        
        {/* navegação */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-500 hover:text-white text-sm">← Voltar para a Home</Link>
            <h1 className="text-3xl font-black">Minhas Caixas 📦</h1>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          
          {/* lista de caixas */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Suas Caixas Criadas:</h2>
            
            {userCrates && userCrates.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {userCrates.map((crate: any) => (
                  <Link 
                    key={crate.id} 
                    href={`/crates/${crate.id}`}
                    className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-indigo-500 transition-all flex flex-col justify-between h-40 text-left"
                  >
                    <div>
                      <h3 className="font-black text-lg">{crate.title}</h3>
                      <p className="text-zinc-500 text-xs mt-1 truncate">{crate.description || 'Sem descrição.'}</p>
                    </div>
                    <span className="text-xs text-indigo-400 font-bold">
                      {crate.crate_items?.[0]?.count || 0} de 50 discos guardados →
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">Você ainda não tem nenhuma caixa de vinil virtual. Crie a sua primeira ao lado!</p>
            )}
          </div>

          {/* formulário de criação de caixa */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4 text-left">
            <h2 className="text-lg font-bold border-b border-zinc-800 pb-2">Nova Caixa de Discos</h2>
            <form action={createCrate} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wide text-zinc-400">Título</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  placeholder="Ex: Favoritos de Jazz, Anos 80..."
                  className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wide text-zinc-400">Descrição (Opcional)</label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Para que serve essa caixa de discos?"
                  className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 text-sm focus:outline-none"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 rounded-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Criar Caixa
              </button>
            </form>
          </div>

        </div>

      </div>
    </main>
  )
}