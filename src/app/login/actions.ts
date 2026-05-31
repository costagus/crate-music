'use server';

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // força o Next.js a limpar o cache e recalcular o estado de login da Home
  revalidatePath('/', 'layout') 
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // supabase por padrão exige confirmação de e-mail no plano gratuito
  // redirecionar avisando o usuário
  redirect('/login?message=Verifique seu e-mail para confirmar o cadastro!')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // força o Next.js a limpar o cache ao deslogar
  revalidatePath('/', 'layout') 
  redirect('/login')
}