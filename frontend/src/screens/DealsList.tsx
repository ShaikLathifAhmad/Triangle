import { useState, useEffect } from 'react'
import {
  Search, Bell, Plus, TrendingUp, Calendar, DollarSign,
  ChevronRight, Sparkles, X,
} from 'lucide-react'
import type { Screen } from '../App'

interface Props {
  onNavigate: (screen: Screen, dealId?: number) => void
}

interface Deal {
  id: number
  name: string
  company: string
  contact: string | null
  value: number
  stage: string
  expected_close_date: string
  owner: string
  description: string | null
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
const API_VERSION = Date.now() // Cache buster

const stageColors: Record<string, string> = {
  'Qualification': 'bg-blue-100 text-blue-700 border-blue-200',
  'Discovery': 'bg-purple-100 text-purple-700 border-purple-200',
  'Proposal': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Negotiation': 'bg-orange-100 text-orange-700 border-orange-200',
  'Closed Won': 'bg-green-100 text-green-700 border-green-200',
  'Closed Lost': 'bg-gray-100 text-gray-700 border-gray-200',
}

const companyInitials = (name: string) => {
  const words = name.split(' ')
  if (words.length >= 2) return words[0][0] + words[1][0]
  return name.substring(0, 2)
}

const companyColors = [
  'bg-orange-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-teal-500',
]

interface Company { id: number; name: string; industry: string }

function NewDealModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(true)
  const [companyId, setCompanyId] = useState('')
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [stage, setStage] = useState('Qualification')
  const [closeDate, setCloseDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/companies`)
      .then(r => r.json())
      .then(data => { setCompanies(data); setCompaniesLoading(false) })
      .catch(() => { setError('Failed to load companies. Check backend.'); setCompaniesLoading(false) })
  }, [])

  const handleSave = async () => {
    if (!name.trim()) { setError('Deal name is required.'); return }
    if (!companyId) { setError('Please select a company.'); return }
    if (!value || isNaN(parseFloat(value))) { setError('Valid deal value is required.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`${BACKEND_URL}/api/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          company_id: parseInt(companyId),
          value: parseFloat(value),
          stage,
          expected_close_date: closeDate || null,
          owner_id: 1,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.detail || `Server error: ${res.status}`)
        return
      }
      onSaved(); onClose()
    } catch (e) {
      setError('Cannot connect to backend. Is the server running?')
    } finally {
      setSaving(false)
    }
  }

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
            <select value={companyId} onChange={e => setCompanyId(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200">
              <option value="">{companiesLoading ? 'Loading...' : companies.length === 0 ? 'No companies found' : 'Select company...'}</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Deal Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              placeholder="e.g. Enterprise Analytics Package" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Value ($)</label>
              <input type="number" value={value} onChange={e => setValue(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="50000" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Stage</label>
              <select value={stage} onChange={e => setStage(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200">
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
            <input type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60">
            {saving ? 'Creating...' : 'Create Deal'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DealsList({ onNavigate }: Props) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStage, setFilterStage] = useState<string>('all')
  const [showNewDeal, setShowNewDeal] = useState(false)

  useEffect(() => {
    fetchDeals()
  }, [])

  const fetchDeals = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/deals?v=${API_VERSION}`)
      const data = await response.json()
      setDeals(data)
    } catch (error) {
      console.error('Failed to fetch deals:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          deal.company.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStage = filterStage === 'all' || deal.stage === filterStage
    return matchesSearch && matchesStage
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-[52px] flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            className="bg-transparent text-sm text-gray-600 placeholder-gray-400 focus:outline-none w-full"
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <Bell size={17} />
          </button>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-6 bg-gray-100">
        {/* Page Title Row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={11} className="text-orange-500" />
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                Active Pipeline
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">All Deals</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredDeals.length} deal{filteredDeals.length !== 1 ? 's' : ''} in your pipeline
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="all">All Stages</option>
              <option value="Qualification">Qualification</option>
              <option value="Discovery">Discovery</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Closed Won">Closed Won</option>
              <option value="Closed Lost">Closed Lost</option>
            </select>
            <button
              onClick={() => setShowNewDeal(true)}
              className="flex items-center gap-1.5 bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Plus size={14} />
              New Deal
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={15} className="text-gray-400" />
              <span className="text-xs text-gray-500">Total Pipeline</span>
            </div>
            <p className="text-[26px] font-bold leading-tight text-gray-900">
              {formatCurrency(deals.reduce((sum, d) => sum + d.value, 0))}
            </p>
            <p className="text-xs mt-1 text-gray-500">{deals.length} active deals</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={15} className="text-gray-400" />
              <span className="text-xs text-gray-500">Avg Deal Size</span>
            </div>
            <p className="text-[26px] font-bold leading-tight text-gray-900">
              {formatCurrency(deals.length > 0 ? deals.reduce((sum, d) => sum + d.value, 0) / deals.length : 0)}
            </p>
            <p className="text-xs mt-1 text-gray-500">Across all deals</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={15} className="text-gray-400" />
              <span className="text-xs text-gray-500">Closing This Month</span>
            </div>
            <p className="text-[26px] font-bold leading-tight text-gray-900">
              {deals.filter(d => {
                if (!d.expected_close_date) return false
                const closeDate = new Date(d.expected_close_date)
                const now = new Date()
                return closeDate.getMonth() === now.getMonth() && closeDate.getFullYear() === now.getFullYear()
              }).length}
            </p>
            <p className="text-xs mt-1 text-orange-500">Review forecasts</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={15} className="text-orange-500" />
              <span className="text-xs text-gray-500">AI Analyzed</span>
            </div>
            <p className="text-[26px] font-bold leading-tight text-gray-900">
              {deals.length}
            </p>
            <p className="text-xs mt-1 text-orange-500">Memory active</p>
          </div>
        </div>

        {/* Deals List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading deals...</div>
          ) : filteredDeals.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No deals found</p>
              <p className="text-xs text-gray-400 mt-2">Total deals in state: {deals.length}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredDeals.map((deal, index) => (
                <button
                  key={deal.id}
                  onClick={() => onNavigate('deal', deal.id)}
                  className="w-full p-5 hover:bg-gray-50 transition-colors flex items-center gap-4 text-left group"
                >
                  {/* Company Logo */}
                  <div className={`w-12 h-12 rounded-xl ${companyColors[index % companyColors.length]} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-base">
                      {companyInitials(deal.company)}
                    </span>
                  </div>

                  {/* Deal Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                        {deal.name}
                      </h3>
                      <span className={`text-[11px] font-semibold border px-2.5 py-0.5 rounded-full ${stageColors[deal.stage] || stageColors['Qualification']}`}>
                        {deal.stage.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{deal.company}</span>
                      {deal.contact && (
                        <>
                          <span>·</span>
                          <span>Contact: {deal.contact}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{deal.owner}</span>
                    </div>
                    {deal.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{deal.description}</p>
                    )}
                  </div>

                  {/* Value */}
                  <div className="text-right">
                    <p className="text-base font-bold text-gray-900">{formatCurrency(deal.value)}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-end gap-1">
                      <Calendar size={10} />
                      {formatDate(deal.expected_close_date)}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-orange-500 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {showNewDeal && (
        <NewDealModal onClose={() => setShowNewDeal(false)} onSaved={fetchDeals} />
      )}
    </div>
  )
}
