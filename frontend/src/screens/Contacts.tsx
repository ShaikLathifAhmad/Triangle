import { useState, useEffect } from 'react'
import {
  Search, Bell, Users, Mail, Phone, Building2, DollarSign,
  Sparkles, Plus, ChevronRight, X,
} from 'lucide-react'
import type { Screen } from '../App'

interface Props {
  onNavigate: (screen: Screen, dealId?: number) => void
}

interface Contact {
  id: number
  name: string
  company: string | null
  company_id: number
  job_title: string | null
  email: string | null
  phone: string | null
  deal_count: number
  total_deal_value: number
  has_active_deal: boolean
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
const API_VERSION = Date.now() // Cache buster

const getInitials = (name: string) => {
  const parts = name.split(' ')
  if (parts.length >= 2) return parts[0][0] + parts[1][0]
  return name.substring(0, 2)
}

const avatarColors = [
  'bg-orange-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-teal-500',
  'bg-amber-500',
  'bg-cyan-500',
]

interface Company { id: number; name: string }

function ContactProfileModal({ contact, onClose, avatarColor }: {
  contact: Contact
  onClose: () => void
  avatarColor: string
}) {
  const formatCurrency = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full ${avatarColor} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white font-bold text-lg">
                {contact.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{contact.name}</h2>
              {contact.job_title && <p className="text-sm text-gray-500">{contact.job_title}</p>}
              {contact.company && <p className="text-xs text-orange-500 font-medium mt-0.5">{contact.company}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-1"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Contact Info */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Contact Info</p>
            <div className="space-y-2">
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail size={14} className="text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline">{contact.email}</a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={14} className="text-gray-400 flex-shrink-0" />
                  <a href={`tel:${contact.phone}`} className="text-sm text-gray-700">{contact.phone}</a>
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-3">
                  <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{contact.company}</span>
                </div>
              )}
              {!contact.email && !contact.phone && !contact.company && (
                <p className="text-sm text-gray-400">No contact details available.</p>
              )}
            </div>
          </div>

          {/* Deal Info */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Deal Activity</p>
            {contact.has_active_deal ? (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-green-800">Active Deals</span>
                  <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                    {contact.deal_count} deal{contact.deal_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(contact.total_deal_value)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total pipeline value</p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">No active deals</p>
                <p className="text-xs text-gray-400 mt-0.5">This contact is a prospect</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-2">
          {contact.email && (
            <a
              href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(contact.email)}&su=${encodeURIComponent(`Following up — ${contact.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              <Mail size={14} /> Send Email
            </a>
          )}
          <button onClick={onClose}
            className="flex-1 bg-orange-500 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-orange-600 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function NewContactModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [name, setName] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/companies`)
      .then(r => r.json()).then(setCompanies).catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return }
    if (!companyId) { setError('Please select a company.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`${BACKEND_URL}/api/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          company_id: parseInt(companyId),
          job_title: jobTitle.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data?.detail || `Error: ${res.status}`); return }
      onSaved(); onClose()
    } catch {
      setError('Cannot connect to backend.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">New Contact</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              placeholder="e.g. John Smith" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Company *</label>
            <select value={companyId} onChange={e => setCompanyId(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200">
              <option value="">{companies.length === 0 ? 'Loading...' : 'Select company...'}</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Job Title</label>
            <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              placeholder="e.g. VP of Sales" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="email@company.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="+1-555-0000" />
            </div>
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60">
            {saving ? 'Saving...' : 'Add Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Contacts({ onNavigate }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'with-deals' | 'prospects'>('all')
  const [showNewContact, setShowNewContact] = useState(false)
  const [selectedContact, setSelectedContact] = useState<{ contact: Contact; color: string } | null>(null)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/contacts?v=${API_VERSION}`)
      const data = await response.json()
      setContacts(data)
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.company && contact.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.job_title && contact.job_title.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'with-deals' && contact.has_active_deal) ||
      (filterType === 'prospects' && !contact.has_active_deal)
    
    return matchesSearch && matchesFilter
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const contactsWithDeals = contacts.filter(c => c.has_active_deal).length
  const totalDealValue = contacts.reduce((sum, c) => sum + c.total_deal_value, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-[52px] flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            className="bg-transparent text-sm text-gray-600 placeholder-gray-400 focus:outline-none w-full"
            placeholder="Search contacts..."
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
              <Users size={11} className="text-orange-500" />
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                Contact Management
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">All Contacts</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} in your network
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('with-deals')}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  filterType === 'with-deals'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                With Deals
              </button>
              <button
                onClick={() => setFilterType('prospects')}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  filterType === 'prospects'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Prospects
              </button>
            </div>
            <button
              onClick={() => setShowNewContact(true)}
              className="flex items-center gap-1.5 bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-sm">
              <Plus size={14} />
              New Contact
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={15} className="text-gray-400" />
              <span className="text-xs text-gray-500">Total Contacts</span>
            </div>
            <p className="text-[26px] font-bold leading-tight text-gray-900">{contacts.length}</p>
            <p className="text-xs mt-1 text-gray-500">Active in CRM</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={15} className="text-gray-400" />
              <span className="text-xs text-gray-500">With Active Deals</span>
            </div>
            <p className="text-[26px] font-bold leading-tight text-gray-900">{contactsWithDeals}</p>
            <p className="text-xs mt-1 text-green-600">
              {contacts.length > 0 ? Math.round((contactsWithDeals / contacts.length) * 100) : 0}% of total
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={15} className="text-gray-400" />
              <span className="text-xs text-gray-500">Total Deal Value</span>
            </div>
            <p className="text-[26px] font-bold leading-tight text-gray-900">
              {formatCurrency(totalDealValue)}
            </p>
            <p className="text-xs mt-1 text-orange-500">Across all contacts</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={15} className="text-orange-500" />
              <span className="text-xs text-gray-500">Prospects</span>
            </div>
            <p className="text-[26px] font-bold leading-tight text-gray-900">
              {contacts.length - contactsWithDeals}
            </p>
            <p className="text-xs mt-1 text-gray-500">No active deals yet</p>
          </div>
        </div>

        {/* Contacts Grid */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No contacts found</p>
              <p className="text-xs text-gray-400 mt-2">Total contacts in state: {contacts.length}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredContacts.map((contact, index) => (
                <div
                  key={contact.id}
                  className="p-5 hover:bg-gray-50 transition-colors flex items-center gap-4"
                >
                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-full ${avatarColors[index % avatarColors.length]} flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-white font-bold text-sm">
                      {getInitials(contact.name)}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">{contact.name}</h3>
                      {contact.has_active_deal && (
                        <span className="text-[11px] font-semibold bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                          ACTIVE DEAL
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {contact.job_title && (
                        <span className="flex items-center gap-1.5">
                          <Building2 size={11} />
                          {contact.job_title}
                        </span>
                      )}
                      {contact.company && (
                        <>
                          <span>·</span>
                          <span className="font-medium text-gray-700">{contact.company}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {contact.email && (
                      <div className="flex items-center gap-1.5 min-w-[180px]">
                        <Mail size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-1.5 min-w-[120px]">
                        <Phone size={12} className="text-gray-400 flex-shrink-0" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Deal Amount */}
                  <div className="text-right min-w-[140px]">
                    {contact.has_active_deal ? (
                      <>
                        <p className="text-base font-bold text-gray-900">
                          {formatCurrency(contact.total_deal_value)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {contact.deal_count} deal{contact.deal_count !== 1 ? 's' : ''}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-400">No active deals</p>
                        <p className="text-xs text-gray-400 mt-0.5">Prospect</p>
                      </>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => setSelectedContact({ contact, color: avatarColors[index % avatarColors.length] })}
                    className="flex items-center gap-1.5 border border-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors">
                    View Profile
                    <ChevronRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showNewContact && (
        <NewContactModal onClose={() => setShowNewContact(false)} onSaved={fetchContacts} />
      )}
      {selectedContact && (
        <ContactProfileModal
          contact={selectedContact.contact}
          avatarColor={selectedContact.color}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </div>
  )
}
