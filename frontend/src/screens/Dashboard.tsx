import { useState, useEffect } from 'react'
import {
  Search, Bell, Filter, Plus, Sparkles, Wind, DollarSign,
  Calendar, AlertCircle, X,
} from 'lucide-react'
import type { Screen } from '../App'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

interface Props {
  onNavigate: (screen: Screen, dealId?: number) => void
}

interface Summary {
  active_deals: number
  total_pipeline: number
  meetings_this_week: number
  follow_ups_due: number
}

interface PipelineStage {
  stage: string
  count: number
  value: number
}

interface UpcomingMeeting {
  id: number
  title: string
  scheduled_at: string
  purpose: string
  deal_id: number | null
  deal_name: string | null
  company_name: string | null
  contact_name: string | null
}

function NewDealModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">New Deal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Company</label>
            <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300" placeholder="Company name" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Deal Name</label>
            <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300" placeholder="Deal name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Value</label>
              <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300" placeholder="$0" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Stage</label>
              <select className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 bg-white">
                <option>Qualification</option>
                <option>Discovery</option>
                <option>Proposal</option>
                <option>Negotiation</option>
                <option>Closed Won</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Expected Close Date</label>
            <input type="date" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onClose} className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Create Deal</button>
        </div>
      </div>
    </div>
  )
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value}`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const dayName = d.toDateString() === today.toDateString()
    ? 'Today'
    : d.toDateString() === tomorrow.toDateString()
    ? 'Tomorrow'
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${dayName} · ${time}`
}

export default function Dashboard({ onNavigate }: Props) {
  const [showNewDeal, setShowNewDeal] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [stageFilter, setStageFilter] = useState<'all' | 'active' | 'closing'>('all')
  const [meetingFilter, setMeetingFilter] = useState<'all' | 'today' | 'week'>('all')
  const [summary, setSummary] = useState<Summary>({ active_deals: 0, total_pipeline: 0, meetings_this_week: 0, follow_ups_due: 0 })
  const [pipeline, setPipeline] = useState<PipelineStage[]>([])
  const [meetings, setMeetings] = useState<UpcomingMeeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sRes, pRes, mRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/dashboard/summary`),
          fetch(`${BACKEND_URL}/api/dashboard/pipeline`),
          fetch(`${BACKEND_URL}/api/dashboard/upcoming-meetings`),
        ])
        if (sRes.ok) setSummary(await sRes.json())
        if (pRes.ok) setPipeline(await pRes.json())
        if (mRes.ok) setMeetings(await mRes.json())
      } catch (e) {
        console.error('Dashboard fetch failed:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Filter logic
  const ACTIVE_STAGES = ['Qualification', 'Discovery', 'Proposal', 'Negotiation']
  const CLOSING_STAGES = ['Proposal', 'Negotiation']

  const filteredPipeline = pipeline.filter(p => {
    if (stageFilter === 'active') return ACTIVE_STAGES.includes(p.stage)
    if (stageFilter === 'closing') return CLOSING_STAGES.includes(p.stage)
    return p.stage !== 'Closed Lost'
  })

  const filteredMeetings = meetings.filter(m => {
    if (meetingFilter === 'today') {
      return new Date(m.scheduled_at).toDateString() === new Date().toDateString()
    }
    if (meetingFilter === 'week') {
      const d = new Date(m.scheduled_at)
      const now = new Date()
      const end = new Date(now); end.setDate(now.getDate() + 7)
      return d >= now && d <= end
    }
    return true
  })

  // Calculate pipeline bar widths
  const maxPipelineValue = Math.max(...filteredPipeline.map(p => p.value), 1)
  const stageColors: Record<string, { bar: string; val: string }> = {
    'Qualification': { bar: 'bg-blue-400', val: 'text-blue-600' },
    'Discovery':     { bar: 'bg-purple-400', val: 'text-purple-600' },
    'Proposal':      { bar: 'bg-orange-400', val: 'text-gray-900' },
    'Negotiation':   { bar: 'bg-orange-500', val: 'text-gray-900' },
    'Closed Won':    { bar: 'bg-green-500', val: 'text-green-600' },
    'Closed Lost':   { bar: 'bg-red-400', val: 'text-red-500' },
  }

  const kpiCards = [
    { icon: Wind, label: 'Active Deals', value: loading ? '—' : String(summary.active_deals), sub: 'Open pipeline', subColor: 'text-gray-500' },
    { icon: DollarSign, label: 'Total Pipeline', value: loading ? '—' : formatCurrency(summary.total_pipeline), sub: 'Across all stages', subColor: 'text-green-600' },
    { icon: Calendar, label: 'Meetings This Week', value: loading ? '—' : String(summary.meetings_this_week), sub: 'Scheduled', subColor: 'text-blue-500' },
    { icon: AlertCircle, label: 'Follow-ups Due', value: loading ? '—' : String(summary.follow_ups_due), sub: 'Need attention', subColor: summary.follow_ups_due > 0 ? 'text-red-500' : 'text-gray-500' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-[52px] flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input className="bg-transparent text-sm text-gray-600 placeholder-gray-400 focus:outline-none w-full" placeholder="Search deals..." />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button className="text-gray-400 hover:text-gray-600 transition-colors"><Bell size={17} /></button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-gray-100">
        {/* Title Row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={11} className="text-orange-500" />
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">AI Memory Insights</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Pipeline Overview</h1>
            <p className="text-sm text-gray-500 mt-0.5">Live data from your Triangle deals.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter Button + Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilter(v => !v)}
                className={`flex items-center gap-1.5 border text-sm font-medium px-3.5 py-2 rounded-lg transition-colors ${
                  showFilter || stageFilter !== 'all' || meetingFilter !== 'all'
                    ? 'bg-orange-50 border-orange-300 text-orange-600'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter size={13} />
                Filter
                {(stageFilter !== 'all' || meetingFilter !== 'all') && (
                  <span className="w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {(stageFilter !== 'all' ? 1 : 0) + (meetingFilter !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>

              {showFilter && (
                <div className="absolute right-0 top-10 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-64">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Filters</p>
                    <button onClick={() => { setStageFilter('all'); setMeetingFilter('all') }}
                      className="text-xs text-orange-500 font-medium hover:text-orange-600">
                      Clear all
                    </button>
                  </div>

                  {/* Pipeline filter */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Pipeline Stage</p>
                    <div className="space-y-1">
                      {[
                        { val: 'all', label: 'All Stages' },
                        { val: 'active', label: 'Active Only (excl. Closed)' },
                        { val: 'closing', label: 'Closing (Proposal + Negotiation)' },
                      ].map(opt => (
                        <button key={opt.val}
                          onClick={() => setStageFilter(opt.val as any)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            stageFilter === opt.val
                              ? 'bg-orange-50 text-orange-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}>
                          {stageFilter === opt.val && <span className="mr-1.5">✓</span>}{opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Meetings filter */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Meetings</p>
                    <div className="space-y-1">
                      {[
                        { val: 'all', label: 'All Upcoming' },
                        { val: 'today', label: 'Today Only' },
                        { val: 'week', label: 'Next 7 Days' },
                      ].map(opt => (
                        <button key={opt.val}
                          onClick={() => setMeetingFilter(opt.val as any)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            meetingFilter === opt.val
                              ? 'bg-orange-50 text-orange-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}>
                          {meetingFilter === opt.val && <span className="mr-1.5">✓</span>}{opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => setShowFilter(false)}
                    className="w-full mt-3 bg-orange-500 text-white text-sm font-medium py-2 rounded-lg hover:bg-orange-600 transition-colors">
                    Apply
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => setShowNewDeal(true)} className="flex items-center gap-1.5 bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-sm">
              <Plus size={14} /> New Deal
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {kpiCards.map((card, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <card.icon size={15} className="text-gray-400" />
                <span className="text-xs text-gray-500">{card.label}</span>
              </div>
              <p className="text-[26px] font-bold text-gray-900 leading-tight">{card.value}</p>
              <p className={`text-xs mt-1 ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Main Row */}
        <div className="flex gap-4 mb-5">
          {/* Upcoming Meetings */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Upcoming Meetings</h2>
              <button onClick={() => onNavigate('deals')} className="text-xs text-orange-500 font-medium hover:text-orange-600 transition-colors">View all deals</button>
            </div>
            <div className="space-y-3">
              {loading && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center text-sm text-gray-400">Loading meetings...</div>
              )}
              {!loading && filteredMeetings.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center text-sm text-gray-400">No upcoming meetings. Schedule one from a deal.</div>
              )}
              {!loading && filteredMeetings.slice(0, 3).map((m) => (
                <div key={m.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">{(m.company_name || m.deal_name || 'D').charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{m.company_name || m.deal_name || 'Meeting'}</p>
                        <p className="text-xs text-gray-500">{m.contact_name || m.title}</p>
                      </div>
                    </div>
                    <span className="text-[11px] bg-orange-100 text-orange-600 font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ml-3">
                      {formatTime(m.scheduled_at)}
                    </span>
                  </div>
                  <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles size={10} className="text-orange-500" />
                      <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Purpose</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{m.purpose || m.title}</p>
                  </div>
                  {m.deal_id && (
                    <button
                      onClick={() => onNavigate('deal', m.deal_id!)}
                      className="text-xs text-orange-500 font-semibold hover:text-orange-600"
                    >
                      View Deal →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-72 flex-shrink-0 space-y-4">
            {/* Pipeline by Stage */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Pipeline by Stage</h3>
                <span className="text-xs text-gray-400">{formatCurrency(summary.total_pipeline)}</span>
              </div>
              {loading && <p className="text-xs text-gray-400 text-center py-4">Loading...</p>}
              {!loading && pipeline.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No pipeline data</p>}
              <div className="space-y-3">
                {filteredPipeline.map((item) => {
                    const colors = stageColors[item.stage] || { bar: 'bg-gray-400', val: 'text-gray-900' }
                    const width = `${Math.round((item.value / maxPipelineValue) * 100)}%`
                    return (
                      <div key={item.stage}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-600">{item.stage} <span className="text-gray-400">({item.count})</span></span>
                          <span className={`text-xs font-semibold ${colors.val}`}>{formatCurrency(item.value)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className={`${colors.bar} h-1.5 rounded-full`} style={{ width }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Quick Nav */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button onClick={() => onNavigate('deals')} className="w-full text-left text-sm text-gray-700 hover:text-orange-500 py-1.5 border-b border-gray-50 transition-colors">→ View all deals</button>
                <button onClick={() => onNavigate('contacts')} className="w-full text-left text-sm text-gray-700 hover:text-orange-500 py-1.5 border-b border-gray-50 transition-colors">→ View contacts</button>
                <button onClick={() => onNavigate('memory')} className="w-full text-left text-sm text-gray-700 hover:text-orange-500 py-1.5 transition-colors">→ Explore memory bank</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNewDeal && <NewDealModal onClose={() => setShowNewDeal(false)} />}
    </div>
  )
}
