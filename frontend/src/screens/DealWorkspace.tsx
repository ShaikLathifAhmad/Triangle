import { useState, useEffect } from 'react'
import {
  Bell, ChevronRight, Sparkles, Mail, MoreHorizontal, Phone, X,
  TrendingUp, Calendar, Clock, Square, CheckSquare,
} from 'lucide-react'
import type { Screen } from '../App'

interface Props {
  onNavigate: (screen: Screen, dealId?: number) => void
  dealId: number | null
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function AddInteractionModal({ dealId, onClose, onSaved }: { dealId: number; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState('Discovery Call')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required.'); return }
    if (!notes.trim()) { setError('Notes are required.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`${BACKEND_URL}/api/deals/${dealId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interaction_type: type,
          title: title.trim(),
          transcript: notes.trim(),
          interaction_date: new Date(date + 'T12:00:00').toISOString(),
        }),
      })
      if (!res.ok) throw new Error('Failed')
      onSaved()
      onClose()
    } catch {
      setError('Failed to save. Check backend is running.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Add Interaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200">
                <option>Discovery Call</option>
                <option>Product Demo</option>
                <option>Pricing Discussion</option>
                <option>Meeting</option>
                <option>Email</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              placeholder="e.g. Pricing Discussion with VP of Sales" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Notes / Transcript</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none" rows={4}
              placeholder="Describe what happened, key points discussed, customer reactions..." />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Interaction'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DealWorkspace({ onNavigate, dealId }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(0)
  const [checks, setChecks] = useState([false, false, false])
  const [deal, setDeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [interactions, setInteractions] = useState<any[]>([])
  const [memoryCount, setMemoryCount] = useState(0)

  useEffect(() => {
    if (dealId) {
      fetchDealData(dealId)
      fetchInteractions(dealId)
      fetchMemoryCount(dealId)
    }
  }, [dealId])

  const fetchDealData = async (id: number) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/deals/${id}`)
      const data = await response.json()
      setDeal(data)
    } catch (error) {
      console.error('Failed to fetch deal:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInteractions = async (id: number) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/deals/${id}/interactions`)
      if (response.ok) setInteractions(await response.json())
    } catch (error) {
      console.error('Failed to fetch interactions:', error)
    }
  }

  const fetchMemoryCount = async (id: number) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/deals/${id}/memories`)
      if (response.ok) {
        const data = await response.json()
        setMemoryCount(data.length)
      }
    } catch { /* silent */ }
  }

  const toggleCheck = (i: number) => {
    setChecks(prev => prev.map((v, idx) => (idx === i ? !v : v)))
  }

  if (loading || !deal) {
    return (
      <div className="flex flex-col h-full">
        <header className="bg-white border-b border-gray-100 px-6 h-[52px] flex items-center flex-shrink-0">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <button onClick={() => onNavigate('deals')} className="hover:text-orange-500 transition-colors">Deals</button>
            <ChevronRight size={13} className="text-gray-400" />
            <span className="text-gray-900 font-medium">Loading...</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Loading deal data...</p>
        </div>
      </div>
    )
  }

  const companyInitial = deal.company?.charAt(0) || 'D'
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatInteractionTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isCallType = (type: string) => type?.toLowerCase().includes('call') || type?.toLowerCase().includes('discovery')

  const mappedInteractions = interactions.map((item) => ({
    id: item.id,
    icon: isCallType(item.interaction_type)
      ? <Phone size={14} className="text-white" />
      : <Mail size={14} className="text-gray-500" />,
    iconBg: isCallType(item.interaction_type) ? 'bg-orange-500' : 'bg-gray-100',
    type: item.interaction_type || 'Interaction',
    title: item.title,
    time: formatInteractionTime(item.interaction_date),
    hasAiInsight: item.memory_sync_status === 'synced',
    summary: item.summary || item.transcript?.slice(0, 300) || 'No summary available.',
    tags: [] as string[],
    link: null,
  }))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-[52px] flex items-center flex-shrink-0">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <button onClick={() => onNavigate('deals')} className="hover:text-orange-500 transition-colors">Deals</button>
          <ChevronRight size={13} className="text-gray-400" />
          <span className="text-gray-900 font-medium">{deal.company}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button className="text-gray-400 hover:text-gray-600"><Bell size={17} /></button>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-6">
        {/* Company Header Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">{companyInitial}</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-gray-900">{deal.company}</h1>
                  <span className="text-[11px] font-semibold bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-0.5 rounded-full">
                    {deal.stage.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {deal.name} · {deal.description || 'Enterprise Deal'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('briefing')}
                className="flex items-center gap-1.5 bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
              >
                <Sparkles size={13} />
                AI Meeting Prep
              </button>
              <a
                href={`https://mail.google.com/mail/?view=cm&su=${encodeURIComponent(`Re: ${deal.name} — ${deal.company}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 border border-gray-200 text-gray-700 text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Mail size={13} />
                Send Email
              </a>
              <button className="border border-gray-200 text-gray-500 p-2 rounded-lg hover:bg-gray-50">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Deal Amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(deal.value)}</p>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp size={11} /> Active pipeline
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Interactions</p>
            <p className="text-2xl font-bold text-gray-900">{interactions.length}</p>
            <p className="text-xs text-gray-500 mt-1">Logged conversations</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Memories Stored</p>
            <p className="text-2xl font-bold text-gray-900">{memoryCount}</p>
            <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
              <Sparkles size={9} /> In Hindsight
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Last Interaction</p>
            <p className="text-2xl font-bold text-gray-900">
              {interactions.length > 0
                ? (() => {
                    const diff = Date.now() - new Date(interactions[0].interaction_date).getTime()
                    const h = Math.floor(diff / 3600000)
                    const d = Math.floor(h / 24)
                    if (h < 1) return 'Just now'
                    if (h < 24) return `${h}h ago`
                    if (d === 1) return 'Yesterday'
                    return `${d}d ago`
                  })()
                : 'None yet'}
            </p>
            {interactions[0]?.memory_sync_status === 'synced' && (
              <span className="text-[11px] bg-orange-100 text-orange-600 font-medium px-2 py-0.5 rounded-full flex items-center gap-1 mt-1 w-fit">
                <Sparkles size={9} /> AI Analyzed
              </span>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-4">
          {/* Left: Persistent Interaction Memory */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Persistent Interaction Memory</h2>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-xs text-orange-500 font-semibold hover:text-orange-600 flex items-center gap-1 transition-colors"
                >
                  ADD INTERACTION
                </button>
              </div>

              {/* Timeline */}
              {mappedInteractions.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No interactions yet. Add the first one.</p>
              )}
              <div className="space-y-1">
                {mappedInteractions.map((item, i) => (
                  <div key={item.id}>
                    <div className="flex gap-3 py-3">
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-full ${item.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                            <span className="text-xs text-gray-400">{item.time}</span>
                            <button
                              onClick={() => setExpanded(expanded === i ? null : i)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              {expanded === i ? '▲' : '▼'}
                            </button>
                          </div>
                        </div>

                        {item.hasAiInsight && (
                          <div className="flex items-center gap-1.5 mt-1 mb-1.5">
                            <span className="flex items-center gap-1 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                              <Sparkles size={8} /> AI INSIGHT
                            </span>
                            <span className="text-[11px] text-gray-500">Extracted from Call Recording</span>
                          </div>
                        )}

                        {expanded === i && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-700 leading-relaxed">{item.summary}</p>
                            {item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {item.tags.map(tag => (
                                  <span key={tag} className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.link && (
                              <button className="text-xs text-orange-500 font-semibold mt-2 hover:text-orange-600">
                                {item.link}
                              </button>
                            )}
                          </div>
                        )}

                        {expanded !== i && (
                          <p className="text-sm text-gray-500 mt-1 truncate">{item.summary}</p>
                        )}
                      </div>
                    </div>
                    {i < mappedInteractions.length - 1 && <div className="ml-11 border-t border-gray-50" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-[280px] flex-shrink-0 space-y-4">
            {/* AI Intelligence */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-orange-500" />
                <h3 className="text-sm font-semibold text-gray-900">AI Intelligence</h3>
              </div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Sentiment Analysis
              </p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-gray-900">Positive / Analytical</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4].map(d => (
                    <div
                      key={d}
                      className={`w-2 h-2 rounded-full ${d <= 3 ? 'bg-green-500' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Top Objection Risks
              </p>
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-orange-100 text-orange-700 font-medium px-2 py-0.5 rounded">
                    Competitor Pricing
                  </span>
                  <span className="text-[10px] font-bold text-red-500">HIGH</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded">
                    Onboarding Complexity
                  </span>
                  <span className="text-[10px] font-bold text-amber-500">MEDIUM</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 italic leading-relaxed">
                  "AI recommends focusing tomorrow's presentation on{' '}
                  <strong className="not-italic">Security & Okta integration</strong> to solidify
                  Sarah's buy-in."
                </p>
              </div>
            </div>

            {/* Next Best Actions */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Next Best Actions</h3>
              <div className="space-y-3">
                {[
                  { label: 'Share TCO Case Study', desc: 'Directly counters the pricing concern Marcus raised.', i: 0 },
                  { label: 'Confirm OKTA SAML Config', desc: 'Solidifies the security requirement from CTO.', i: 1 },
                  { label: 'Draft 3-Year Discount Quote', desc: "Preparation for Marcus's request.", i: 2 },
                ].map(item => (
                  <div key={item.i} className="flex gap-2.5">
                    <button onClick={() => toggleCheck(item.i)} className="mt-0.5 flex-shrink-0">
                      {checks[item.i] ? (
                        <CheckSquare size={15} className="text-orange-500" />
                      ) : (
                        <Square size={15} className="text-gray-300" />
                      )}
                    </button>
                    <div>
                      <p className={`text-xs font-medium ${checks[item.i] ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Memory */}
            <div className="bg-orange-500 rounded-xl p-5 text-center">
              <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <Sparkles size={18} className="text-white" />
              </div>
              <h3 className="text-sm font-semibold text-white">Active Memory</h3>
              <p className="text-xs text-orange-100 mt-1.5 leading-relaxed">
                Triangle has learned{' '}
                <strong className="text-white">{memoryCount} insight{memoryCount !== 1 ? 's' : ''}</strong> from your history
                with {deal.company || 'this customer'}.
              </p>
              <button
                onClick={() => onNavigate('memory')}
                className="mt-3 bg-white text-orange-500 text-xs font-bold px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors w-full uppercase tracking-wide"
              >
                Explore Knowledge Base
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && dealId && (
        <AddInteractionModal
          dealId={dealId}
          onClose={() => setShowModal(false)}
          onSaved={() => { fetchInteractions(dealId); fetchMemoryCount(dealId) }}
        />
      )}
    </div>
  )
}
