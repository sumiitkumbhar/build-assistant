'use client'
import React, { createContext, useContext, useMemo, useState } from 'react'

type AuthState = {
  open: boolean
  mode: 'login' | 'register'
  setOpen: (v: boolean) => void
  setMode: (m: 'login' | 'register') => void
  loginForm: { email: string; password: string }
  setLoginForm: React.Dispatch<React.SetStateAction<{ email: string; password: string }>>
  registerForm: { name: string; email: string; password: string; confirmPassword: string }
  setRegisterForm: React.Dispatch<React.SetStateAction<{ name: string; email: string; password: string; confirmPassword: string }>>
  onLogin: (e: React.FormEvent) => void
  onRegister: (e: React.FormEvent) => void
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })

  const onLogin = (e: React.FormEvent) => { e.preventDefault(); setOpen(false) }
  const onRegister = (e: React.FormEvent) => { e.preventDefault(); setOpen(false) }

  const value = useMemo<AuthState>(() => ({
    open, mode, setOpen, setMode,
    loginForm, setLoginForm,
    registerForm, setRegisterForm,
    onLogin, onRegister,
  }), [open, mode, loginForm, registerForm])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
