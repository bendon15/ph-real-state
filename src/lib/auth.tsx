import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface Ctx { session: Session | null; isAdmin: boolean; loading: boolean; signOut: () => Promise<void> }
const AuthCtx = createContext<Ctx>({ session: null, isAdmin: false, loading: true, signOut: async () => {} })
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async (s: Session | null) => {
      setSession(s)
      if (s) {
        const { data } = await supabase.from('admins').select('user_id').eq('user_id', s.user.id).maybeSingle()
        setIsAdmin(!!data)
      } else setIsAdmin(false)
      setLoading(false)
    }
    supabase.auth.getSession().then(({ data }) => check(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setTimeout(() => check(s), 0) })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <AuthCtx.Provider value={{ session, isAdmin, loading, signOut: async () => { await supabase.auth.signOut() } }}>
      {children}
    </AuthCtx.Provider>
  )
}
