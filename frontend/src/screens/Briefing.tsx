import { useState, useEffect } from 'react'
import {
  ChevronRight, Sparkles, Share2, Calendar, Users, X, RefreshCw, Loader2,
} from 'lucide-react'
import type { Screen } from '../App'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

interface Props {
  onNavigate: (screen: Screen, dealId?: number) => void
  dealId?: number | null
}

interface BriefingContent {
  meeting_summary?: string
  known_customer_facts?: string[]
  key_talking_points?: string[]
  potential_objections?: string[]
  suggested_responses?: string[]
  recommended_next_steps?: string[]
  why_these_insights?: string
}

interface BriefingData {
  id: number
  content: BriefingContent
  memories_used: number
  generated_at: string
}

function OutcomeModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Add Meeting Outcome</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Meeting Outcome</label>
            <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" placeholder="e.g. Agreement reached on phased rollout" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Customer Concerns</label>
            <textarea className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none" rows={2} placeholder="Any new or updated concerns from the customer?" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Commitments Made</label>
            <textarea className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none" rows={2} placeholder="What commitments were made by either side?" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={onSave} className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600">Save Outcome</button>
        </div>
      </div>
    </div>
  )
}

export default function Briefing({ onNavigate, dealId }: Props) {
  const [briefing, setBriefing] = useState<BriefingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOutcomeModal, setShowOutcomeModal] = useState(false)
  const [outcomeSaved, setOutcomeSaved] = useState(false)

  useEffect(() => {
    if (dealId) fetchLatestBriefing(dealId)
  }, [dealId])

  const fetchLatestBriefing = async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const listRes = await fetch(`${BACKEND_URL}/api/deals/${id}/briefings`)
      if (!listRes.ok) return
      const list = await listRes.json()
      if (list.length === 0) return

      const latest = list[0]
      const detailRes = await fetch(`${BACKEND_URL}/api/briefings/${latest.id}`)
      if (detailRes.ok) {
        const data = await detailRes.json()
        setBriefing({ id: data.id, content: data.content, memories_used: data.memories_used, generated_at: data.generated_at })
      }
    } catch (e) {
      console.error('Failed to fetch briefing:', e)
    } finally {
      setLoading(false)
    }
  }

  const generateBriefing = async () => {
    if (!dealId) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND_URL}/api/deals/${dealId}/briefings/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.detail || 'Failed to generate briefing.')
        return
      }
      const data = await res.json()
      setBriefing({ id: data.id, content: data.content, memories_used: data.memories_used, generated_at: new Date().toISOString() })
    } catch (e) {
      setError('Could not reach the server. Make sure the backend is running.')
    } finally {
      setGenerating(false)
    }
  }

  const c = briefing?.content

  // No dealId selected
  if (!dealId) {
    return (
      <div className="flex flex-col h-full">
        <header className="bg-white border-b border-gray-100 px-6 h-[52px] flex items-center flex-shrink-0">
          <span className="text-sm font-medium text-gray-900">AI Briefing</span>
        </header>
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <Sparkles size={40} className="text-orange-200 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Open a deal and click "AI Meeting Prep" to generate a briefing.</p>
            <button onClick={() => onNavigate('deals')} className="mt-4 text-sm text-orange-500 font-semibold hover:text-orange-600">
              Browse Deals →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-[52px] flex items-center flex-shrink-0">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <button onClick={() => onNavigate('deal', dealId)} className="hover:text-orange-500 transition-colors">Deal Workspace</button>
          <ChevronRight size={13} className="text-gray-400" />
          <span className="text-gray-900 font-medium">AI Meeting Briefing</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button className="flex items-center gap-1.5 border border-gray-200 text-gray-700 text-sm font-medium px-3.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <Share2 size={13} /> Share Brief
          </button>
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">AM</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-6">
        <div className="max-w-[860px] mx-auto space-y-4">

          {/* Hero Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={11} className="text-orange-500" />
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">AI-Generated Intelligence Brief</span>
            </div>
            <h1 className="text-[26px] font-bold text-gray-900">Meeting Preparation Briefing</h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><Users size={12} /> Deal #{dealId}</span>
              {briefing && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  Generated {new Date(briefing.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
              )}
              {briefing && briefing.memories_used > 0 && (
                <span className="text-orange-500 font-semibold">{briefing.memories_used} memories used</span>
              )}
            </div>
            <div className="absolute right-6 top-4 opacity-60">
              <Sparkles size={36} className="text-orange-200" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={generateBriefing}
                disabled={generating}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                {generating ? 'Generating...' : briefing ? 'Regenerate' : 'Generate Briefing'}
              </button>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <Loader2 size={28} className="text-orange-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading briefing...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Generating state */}
          {generating && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <Loader2 size={28} className="text-orange-400 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700">Generating your AI briefing...</p>
              <p className="text-xs text-gray-400 mt-1">Analysing interactions and recalling memories. This takes 15–30 seconds.</p>
            </div>
          )}

          {/* No briefing yet */}
          {!loading && !generating && !briefing && !error && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <Sparkles size={36} className="text-orange-200 mx-auto mb-4" />
              <p className="text-base font-semibold text-gray-700 mb-2">No briefing yet</p>
              <p className="text-sm text-gray-400 mb-5">Click "Generate Briefing" above to create an AI-powered meeting preparation brief based on this deal's interactions and memory.</p>
              <button onClick={generateBriefing}
                className="bg-orange-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-orange-600 transition-colors">
                Generate Briefing
              </button>
            </div>
          )}

          {/* Briefing Content */}
          {!loading && !generating && briefing && c && (
            <>
              {/* Executive Summary */}
              {c.meeting_summary && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center">
                      <Sparkles size={11} className="text-orange-500" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">Executive Summary</h2>
                  </div>
                  <blockquote className="border-l-4 border-orange-500 pl-4">
                    <p className="text-sm text-gray-700 leading-relaxed">"{c.meeting_summary}"</p>
                  </blockquote>
                </div>
              )}

              {/* Known Customer Facts */}
              {c.known_customer_facts && c.known_customer_facts.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center">
                      <Sparkles size={11} className="text-orange-500" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">Critical Memory Context</h2>
                  </div>
                  <div className="space-y-3">
                    {c.known_customer_facts.map((fact: any, i: number) => {
                      const text = typeof fact === 'string' ? fact : (fact?.fact || fact?.content || fact?.text || JSON.stringify(fact))
                      return (
                        <div key={i} className={`${i % 2 === 0 ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'} border rounded-xl p-4`}>
                          <div className="flex gap-3">
                            <div className={`w-6 h-6 rounded-full ${i % 2 === 0 ? 'bg-orange-500' : 'bg-blue-500'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <span className="text-white text-xs font-bold">{i + 1}</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Talking Points + Objections */}
              <div className="grid grid-cols-2 gap-4">
                {c.key_talking_points && c.key_talking_points.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center">
                        <Sparkles size={11} className="text-orange-500" />
                      </div>
                      <h2 className="text-sm font-semibold text-gray-900">AI Talking Points</h2>
                    </div>
                    <ol className="space-y-3">
                      {c.key_talking_points.map((point: any, i: number) => {
                        const text = typeof point === 'string' ? point : (point?.point || point?.text || point?.content || JSON.stringify(point))
                        return (
                          <li key={i} className="flex gap-3">
                            <span className="text-sm font-bold text-orange-500 flex-shrink-0 mt-0.5">{i + 1}</span>
                            <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                )}

                {c.potential_objections && c.potential_objections.length > 0 && (
                  <div className="bg-gray-900 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-5 h-5 bg-orange-500/20 rounded flex items-center justify-center">
                        <Sparkles size={11} className="text-orange-400" />
                      </div>
                      <h2 className="text-sm font-semibold text-white">Objection Battlecard</h2>
                    </div>
                    <div className="space-y-4">
                      {c.potential_objections.slice(0, 2).map((obj: any, i: number) => {
                        const objText = typeof obj === 'string' ? obj : (obj?.objection || obj?.concern || obj?.text || JSON.stringify(obj))
                        const resp = c.suggested_responses?.[i]
                        const respText = resp ? (typeof resp === 'string' ? resp : (resp?.response || resp?.text || JSON.stringify(resp))) : null
                        return (
                          <div key={i} className={i > 0 ? 'border-t border-gray-700 pt-4' : ''}>
                            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">Potential Concern</p>
                            <p className="text-sm font-semibold text-white mb-1.5">"{objText}"</p>
                            {respText && (
                              <>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">AI-Suggested Response</p>
                                <p className="text-xs text-gray-300 leading-relaxed italic">"{respText}"</p>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Recommended Next Steps */}
              {c.recommended_next_steps && c.recommended_next_steps.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center">
                      <Sparkles size={11} className="text-orange-500" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">Recommended Next Steps</h2>
                  </div>
                  <ul className="space-y-2">
                    {c.recommended_next_steps.map((step: any, i: number) => {
                      const text = typeof step === 'string' ? step : (step?.step || step?.action || step?.text || JSON.stringify(step))
                      return (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          {text}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Why These Insights */}
              {c.why_these_insights && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Sparkles size={18} className="text-orange-500" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900 mb-2">Why These Insights?</h2>
                  <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">{c.why_these_insights}</p>
                  {briefing.memories_used > 0 && (
                    <p className="text-xs text-gray-400 mt-2">Based on <strong>{briefing.memories_used}</strong> memories from Hindsight Cloud.</p>
                  )}
                </div>
              )}

              {/* After the Meeting */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">After the Meeting</h2>
                {outcomeSaved ? (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                    <p className="text-sm font-semibold text-green-800">Meeting outcome saved!</p>
                    <p className="text-xs text-green-600 mt-0.5">Triangle has stored this context for future memory-informed briefings.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      Record what happened to help Triangle build better context for future briefings.
                    </p>
                    <button onClick={() => setShowOutcomeModal(true)}
                      className="flex items-center gap-1.5 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                      Add Meeting Outcome
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showOutcomeModal && (
        <OutcomeModal onClose={() => setShowOutcomeModal(false)} onSave={() => { setShowOutcomeModal(false); setOutcomeSaved(true) }} />
      )}
    </div>
  )
}
