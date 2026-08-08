import { ReactNode } from 'react'
import Navbar from './Navbar'
import Chatbot from './Chatbot'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Navbar />
      <main className="pt-16 min-h-screen">{children}</main>
      <Chatbot />
    </div>
  )
}

