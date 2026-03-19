
import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './lib/supabase'

function App() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [message, setMessage] = useState('Testando conexao com Supabase...')

  useEffect(() => {
    const checkConnection = async () => {
      const { error } = await supabase.auth.getSession()

      if (error) {
        setStatus('error')
        setMessage(`Falha ao conectar: ${error.message}`)
        return
      }

      setStatus('connected')
      setMessage('Supabase conectado com sucesso.')
    }

    checkConnection()
  }, [])

  return (
    <main>
      <h1>Status Supabase</h1>
      <p>{message}</p>
      {status === 'loading' && <p>Carregando...</p>}
    </main>
  )
}

export default App
