import { useState, useEffect, useRef } from 'react'
import { Sparkles, Send, Loader2, ChevronDown, Bot, User } from 'lucide-react'
import type { Screen } from '../App'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

interface Props {
  onNavigate: (screen: Screen, dealId?: number) => void
}

interface Deal { id: number; name: string; company: string; stage: string }
interface Message { role: 'user' | 'ai'; text: string; sources?: { hindsight_memories_used: number; interactions_searched: number } }

const SUGGESTED = [
  'What are the main concerns this customer has raised?',
  'What decisions have been made so far?',
  'What are the key talking points for the next meeting?',
  'What commitments were made by both sides?',
  'Summarise the deal history so far.',
]

export default function ChatBot({ onNavigate }: Props) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [selectedDealId, setSelectedDealId] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dealsLoading, setDealsLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/deals`)
      .then(r => r.json())
      .then(data => { setDeals(data); setDealsLoading(false) })
      .catch(() => setDealsLoading(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (query: string) => {
    if (!query.trim() || loading) return
    if (!selectedDealId) {
      setMessages(prev => [...prev, { role: 'user', text: query }, { role: 'ai', text: 'Please select a deal first so I can search its memory and interactions.' }])
      setInput('')
      return
    }

    setMessages(prev => [...prev, { role: 'user', text: query }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${BACKEND_URL}/api/deals/${selectedDealId}/insights/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'ai', text: data?.detail || 'Something went wrong. Try again.' }])
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: data.answer, sources: data.sources }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Cannot reach the backend. Make sure the server is running.' }])
    } finally {
      setLoading(false)
    }
  }

  const selectedDeal = deals.find(d => String(d.id) === selectedDealId)

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-[52px] flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-orange-500" />
          <span className="text-sm font-semibold text-gray-900">Deal Intelligence</span>
        </div>

        {/* Deal Selector */}
        <div className="ml-4 relative">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <span className="text-xs text-gray-500">Deal:</span>
            <select
              value={selectedDealId}
              onChange={e => { setSelectedDealId(e.target.value); setMessages([]) }}
              className="bg-transparent text-sm font-medium text-gray-800 focus:outline-none pr-5 cursor-pointer max-w-[220px]"
            >
              <option value="">{dealsLoading ? 'Loading...' : 'Select a deal...'}</option>
              {deals.map(d => (
                <option key={d.id} value={d.id}>{d.company} — {d.name}</option>
              ))}
            </select>
            <ChevronDown size={12} className="text-gray-400 pointer-events-none absolute right-2.5" />
          </div>
        </div>

        {selectedDeal && (
          <button
            onClick={() => onNavigate('deal', selectedDeal.id)}
            className="ml-auto text-xs text-orange-500 font-semibold hover:text-orange-600 transition-colors"
          >
            Open Deal Workspace →
          </button>
        )}
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">

        {/* Welcome state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-20">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles size={30} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Deal Intelligence Assistant</h2>
            <p className="text-sm text-gray-500 max-w-sm mb-8">
              {selectedDealId
                ? `Ask anything about "${selectedDeal?.company}" — I'll search through interactions and memory.`
                : 'Select a deal above, then ask me anything about it.'}
            </p>

            {/* Suggested questions */}
            {selectedDealId && (
              <div className="w-full max-w-lg space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Suggested Questions</p>
                {SUGGESTED.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              msg.role === 'user' ? 'bg-orange-500' : 'bg-gray-200'
            }`}>
              {msg.role === 'user'
                ? <User size={14} className="text-white" />
                : <Bot size={14} className="text-gray-600" />
              }
            </div>

            {/* Bubble */}
            <div className={`max-w-[72%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-orange-500 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
              }`}>
                {msg.text}
              </div>
              {msg.sources && (
                <p className="text-[10px] text-gray-400 px-1">
                  {msg.sources.hindsight_memories_used} memories · {msg.sources.interactions_searched} interactions searched
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Loading bubble */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot size={14} className="text-gray-600" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-orange-500" />
              <span className="text-sm text-gray-400">Searching memories...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-6 py-4 flex-shrink-0">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder={selectedDealId ? 'Ask anything about this deal...' : 'Select a deal first, then ask a question...'}
            rows={1}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none placeholder-gray-400"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="w-11 h-11 bg-orange-500 text-white rounded-xl flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
