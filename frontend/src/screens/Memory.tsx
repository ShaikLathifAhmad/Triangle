import { useState, useEffect } from 'react'
import {
  Bell, ChevronRight, Sparkles, Brain, FileText, ThumbsUp,
  Briefcase, Search, X, ExternalLink, ChevronDown, Database,
} from 'lucide-react'
import type { Screen } from '../App'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

interface Props {
  onNavigate: (screen: Screen, dealId?: number) => void
  dealId?: number | null
}

interface MemoryItem {
  id: number
  type: string
  content: string
  created_at: string
  interaction_id: number | null
  interaction_title: string | null
  sync_status: string
}

interface Stats {
  total_memories: number
  deals_with_memory: number
  briefings_generated: number
  feedback_submitted: number
  recent_updates: any[]
  hindsight_connected: boolean
}

const CATEGORIES = ['All', 'Customer Need', 'Objection', 'Preference', 'Decision', 'Commitment', 'Technical Requirement', 'Hard Requirement']

const categoryColor = (type: string): string => {
  const map: Record<string, string> = {
    'Customer Need':         'bg-blue-100 text-blue-700',
    'Objection':             'bg-red-100 text-red-700',
    'Preference':            'bg-purple-100 text-purple-700',
    'Decision':              'bg-green-100 text-green-700',
    'Commitment':            'bg-yellow-100 text-yellow-700',
    'Technical Requirement': 'bg-indigo-100 text-indigo-700',
    'Hard Requirement':      'bg-orange-100 text-orange-700',
    'Deadline Constraint':   'bg-red-100 text-red-700',
    'Stakeholder Constraint':'bg-pink-100 text-pink-700',
    'Value Driver':          'bg-teal-100 text-teal-700',
    'Compliance Risk':       'bg-red-100 text-red-700',
    'Business Goal':         'bg-blue-100 text-blue-700',
    'Timeline Pressure':     'bg-amber-100 text-amber-700',
    'Feature Requirement':   'bg-indigo-100 text-indigo-700',
  }
  return map[type] || 'bg-gray-100 text-gray-700'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function MemoryDrawer({ memory, onClose }: { memory: MemoryItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[420px] bg-white flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Memory Detail</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-base font-bold text-gray-900">{memory.content.slice(0, 60)}{memory.content.length > 60 ? '...' : ''}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${categoryColor(memory.type)}`}>
                {memory.type}
              </span>
            </div>
            {memory.sync_status === 'synced' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                ✓ Synced to Hindsight
              </span>
            )}
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-700 leading-relaxed">{memory.content}</p>
          </div>
          <div className="space-y-2.5">
            {memory.interaction_title && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 text-xs">Source</span>
                <span className="font-medium text-gray-900 text-xs">{memory.interaction_title}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 text-xs">Date Recorded</span>
              <span className="font-medium text-gray-900 text-xs">{formatDate(memory.created_at)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 text-xs">Sync Status</span>
              <span className={`text-xs font-semibold ${memory.sync_status === 'synced' ? 'text-green-600' : 'text-amber-600'}`}>
                {memory.sync_status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface Deal { id: number; name: string; company: string }

export default function Memory({ onNavigate, dealId: propDealId }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('Newest')
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null)
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [stats, setStats] = useState<Stats>({ total_memories: 0, deals_with_memory: 0, briefings_generated: 0, feedback_submitted: 0, recent_updates: [], hindsight_connected: false })
  const [loading, setLoading] = useState(true)
  const [deals, setDeals] = useState<Deal[]>([])
  const [activeDealId, setActiveDealId] = useState<number | null>(propDealId ?? null)

  // Sync prop dealId into local state when navigating from DealWorkspace
  useEffect(() => {
    if (propDealId) setActiveDealId(propDealId)
  }, [propDealId])

  // Fetch deals for selector
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/deals`)
      .then(r => r.json())
      .then(setDeals)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await fetch(`${BACKEND_URL}/api/memories/stats`)
        if (statsRes.ok) setStats(await statsRes.json())

        if (activeDealId) {
          setMemories([])
          const memRes = await fetch(`${BACKEND_URL}/api/deals/${activeDealId}/memories`)
          if (memRes.ok) setMemories(await memRes.json())
        } else {
          setMemories([])
        }
      } catch (e) {
        console.error('Memory fetch failed:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [activeDealId])

  const filtered = memories.filter(m => {
    const matchCat = selectedCategory === 'All' || m.type === selectedCategory
    const matchSearch = !search || m.content.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.created_at).getTime()
    const db = new Date(b.created_at).getTime()
    return sort === 'Newest' ? db - da : da - db
  })

  const kpiCards = [
    { icon: Brain,    label: 'Total Memories',      value: loading ? '—' : String(stats.total_memories),    sub: 'Across all deals',    subColor: 'text-gray-500' },
    { icon: Briefcase,label: 'Deals with Memory',   value: loading ? '—' : String(stats.deals_with_memory), sub: 'Active context',      subColor: 'text-gray-500' },
    { icon: FileText, label: 'Briefings Generated', value: loading ? '—' : String(stats.briefings_generated),sub: 'AI powered',         subColor: 'text-green-600' },
    { icon: ThumbsUp, label: 'Feedback Submitted',  value: loading ? '—' : String(stats.feedback_submitted), sub: stats.hindsight_connected ? 'Hindsight connected' : 'Hindsight offline', subColor: stats.hindsight_connected ? 'text-orange-500' : 'text-gray-400' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-[52px] flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <button onClick={() => onNavigate('dashboard')} className="hover:text-orange-500 transition-colors">Dashboard</button>
          <ChevronRight size={13} className="text-gray-400" />
          <span className="text-gray-900 font-medium">Memory & Learning</span>
        </div>

        {/* Deal Selector */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 ml-2">
          <Brain size={13} className="text-orange-500 flex-shrink-0" />
          <select
            value={activeDealId ?? ''}
            onChange={e => {
              setActiveDealId(e.target.value ? Number(e.target.value) : null)
              setLoading(true)
            }}
            className="bg-transparent text-sm text-gray-700 focus:outline-none cursor-pointer max-w-[220px]"
          >
            <option value="">Select a deal...</option>
            {deals.map(d => (
              <option key={d.id} value={d.id}>{d.company} — {d.name}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-6">
        {/* Title */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Brain size={11} className="text-orange-500" />
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Persistent Memory</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Memory & Learning</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {activeDealId ? `Memories for selected deal.` : 'Select a deal above to explore its memory bank.'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-48">
            <Search size={13} className="text-gray-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-gray-600 placeholder-gray-400 focus:outline-none w-full"
              placeholder="Search memories..." />
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

        {/* Two-column layout */}
        <div className="flex gap-4">
          {/* Left: Memory List */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  {activeDealId ? 'Deal Memories' : 'Select a deal above to view memories'}
                </h2>
                <div className="relative">
                  <select value={sort} onChange={e => setSort(e.target.value)}
                    className="appearance-none text-xs text-gray-600 border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 focus:outline-none bg-white">
                    <option>Newest</option>
                    <option>Oldest</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Category Chips */}
              <div className="flex gap-1.5 flex-wrap mb-4">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors ${
                      selectedCategory === cat ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Memory List */}
              <div className="space-y-3">
                {!activeDealId && (
                  <div className="text-center py-12">
                    <Brain size={32} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Open a deal and navigate to Memory to see its knowledge base.</p>
                    <button onClick={() => onNavigate('deals')} className="mt-3 text-xs text-orange-500 font-semibold hover:text-orange-600">
                      Browse Deals →
                    </button>
                  </div>
                )}
                {activeDealId && loading && (
                  <p className="text-sm text-gray-400 text-center py-8">Loading memories...</p>
                )}
                {activeDealId && !loading && sorted.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">No memories found. Add interactions to build the knowledge base.</p>
                )}
                {sorted.map((mem) => (
                  <button key={mem.id} onClick={() => setSelectedMemory(mem)}
                    className="w-full text-left border border-gray-100 rounded-xl p-4 hover:border-orange-200 hover:bg-orange-50/30 transition-colors group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">
                          {mem.content.length > 70 ? mem.content.slice(0, 70) + '...' : mem.content}
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${categoryColor(mem.type)}`}>
                          {mem.type}
                        </span>
                        {mem.sync_status === 'synced' && (
                          <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">✓ Synced</span>
                        )}
                      </div>
                      <ExternalLink size={13} className="text-gray-300 group-hover:text-orange-400 flex-shrink-0 mt-0.5 transition-colors" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">{formatDate(mem.created_at)}</span>
                      {mem.interaction_title && (
                        <span className="text-[11px] text-orange-500 font-medium">↗ {mem.interaction_title}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-[300px] flex-shrink-0 space-y-4">
            {/* How Triangle Learns */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={14} className="text-orange-500" />
                <h3 className="text-sm font-semibold text-gray-900">How Triangle Learns</h3>
              </div>
              <div className="space-y-0">
                {[
                  { icon: <FileText size={16} className="text-orange-500" />, bg: 'bg-orange-50', label: 'Interaction Recorded', desc: 'Calls, emails and meetings are logged in the deal workspace.' },
                  { icon: <Database size={16} className="text-blue-500" />, bg: 'bg-blue-50', label: 'Context Stored', desc: 'Relevant facts, concerns and preferences are extracted and saved.' },
                  { icon: <Sparkles size={16} className="text-purple-500" />, bg: 'bg-purple-50', label: 'Briefing Enriched', desc: 'Stored context is retrieved to personalise future AI briefings.' },
                ].map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-xl ${step.bg} flex items-center justify-center flex-shrink-0`}>{step.icon}</div>
                      {i < 2 && <div className="w-px flex-1 bg-gray-200 my-1 min-h-[16px]" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-xs font-semibold text-gray-900">{step.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 border-t border-gray-100 pt-3 leading-relaxed">
                Triangle uses retrieval, not retraining. Your context gets richer with every interaction.
              </p>
            </div>

            {/* Recent Updates */}
            {stats.recent_updates.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Memory Updates</h3>
                <div className="space-y-3">
                  {stats.recent_updates.slice(0, 4).map((item: any, i: number) => (
                    <div key={i} className="flex gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{item.type}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{item.customer || item.deal_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedMemory && <MemoryDrawer memory={selectedMemory} onClose={() => setSelectedMemory(null)} />}
    </div>
  )
}
