"use server"

import { createClient } from "@/lib/supabase/server"

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  return profile?.is_admin ?? false
}

export async function requireAdmin(): Promise<{ userId: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) return null

  return { userId: user.id }
}

export async function setAdminStatus(userId: string, isAdmin: boolean): Promise<boolean> {
  const supabase = await createClient()

  // 現在のユーザーが管理者かチェック
  const admin = await requireAdmin()
  if (!admin) return false

  const { error } = await supabase
    .from("profiles")
    .update({ is_admin: isAdmin })
    .eq("id", userId)

  return !error
}
