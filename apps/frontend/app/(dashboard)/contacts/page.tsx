'use client';
import { useEffect, useState, useCallback } from 'react';
import { contactsApi, api } from '@/lib/api';
import {
  Search, Users, Mail, Phone, Calendar, Filter, Download, Plus, X,
  MessageSquare, Globe, Send, QrCode, Tag, Eye, ChevronRight,
  User, CreditCard, MapPin, Clock, Trash2, Edit3, Check,
} from 'lucide-react';
import { getInitials, timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  last_seen_at: string;
  first_seen_at: string;
  metadata: Record<string, any>;
}

const SOURCE_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  web_widget: { label: 'Widget', color: 'bg-indigo-100 text-indigo-700', icon: Globe },
  whatsapp_meta: { label: 'WhatsApp', color: 'bg-green-100 text-green-700', icon: MessageSquare },
  whatsapp_qr: { label: 'WhatsApp QR', color: 'bg-green-100 text-green-700', icon: QrCode },
  telegram: { label: 'Telegram', color: 'bg-blue-100 text-blue-700', icon: Send },
  email: { label: 'Email', color: 'bg-amber-100 text-amber-700', icon: Mail },
  manual: { label: 'Manual', color: 'bg-gray-100 text-gray-600', icon: User },
};

function SourceBadge({ source }: { source?: string }) {
  if (!source) return null;
  const s = SOURCE_LABELS[source] || SOURCE_LABELS.manual;
  const Icon = s.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold', s.color)}>
      <Icon className="w-2.5 h-2.5" />
      {s.label}
    </span>
  );
}

function ContactDetailPanel({ contact, onClose, onUpdate }: {
  contact: Contact;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: contact.full_name || '',
    email: contact.email || '',
    phone: contact.phone || '',
    cpf: contact.metadata?.cpf || '',
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await contactsApi.update(contact.id, {
        full_name: form.full_name || null,
        email: form.email || null,
        phone: form.phone || null,
        metadata: { ...contact.metadata, cpf: form.cpf || null },
      });
      setEditing(false);
      onUpdate();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-[320px] shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-sm">Detalhes do Contato</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditing(!editing)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-sm">
            {getInitials(contact.full_name || 'V')}
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{contact.full_name || 'Visitante'}</h4>
            {contact.email && <p className="text-xs text-gray-400 truncate">{contact.email}</p>}
            <SourceBadge source={contact.metadata?.source} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {editing ? (
          <div className="space-y-3">
            {[
              { key: 'full_name', label: 'Nome', icon: User, type: 'text', placeholder: 'Nome completo' },
              { key: 'email', label: 'Email', icon: Mail, type: 'email', placeholder: 'email@exemplo.com' },
              { key: 'phone', label: 'Telefone', icon: Phone, type: 'tel', placeholder: '(11) 99999-9999' },
              { key: 'cpf', label: 'CPF', icon: CreditCard, type: 'text', placeholder: '000.000.000-00' },
            ].map(field => {
              const Icon = field.icon;
              return (
                <div key={field.key}>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <Icon className="w-3 h-3" />{field.label}
                  </label>
                  <input
                    type={field.type}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              );
            })}
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Info fields */}
            <div className="space-y-2">
              {contact.email && (
                <div className="flex items-center gap-2.5 py-2 border-b border-gray-50">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Email</p>
                    <p className="text-xs text-gray-700">{contact.email}</p>
                  </div>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2.5 py-2 border-b border-gray-50">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Telefone</p>
                    <p className="text-xs text-gray-700">{contact.phone}</p>
                  </div>
                </div>
              )}
              {contact.metadata?.cpf && (
                <div className="flex items-center gap-2.5 py-2 border-b border-gray-50">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">CPF</p>
                    <p className="text-xs text-gray-700 font-mono">{contact.metadata.cpf}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2.5 py-2 border-b border-gray-50">
                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Última visita</p>
                  <p className="text-xs text-gray-700">{timeAgo(contact.last_seen_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 py-2 border-b border-gray-50">
                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Primeiro contato</p>
                  <p className="text-xs text-gray-700">{new Date(contact.first_seen_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>

            {/* Metadata info */}
            {contact.metadata && Object.keys(contact.metadata).filter(k => !['cpf', 'source'].includes(k)).length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Dados adicionais</p>
                <div className="space-y-1.5">
                  {Object.entries(contact.metadata)
                    .filter(([k]) => !['cpf', 'source'].includes(k))
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="text-gray-700 font-medium">{String(v)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContact, setNewContact] = useState({ full_name: '', email: '', phone: '', cpf: '' });
  const [creating, setCreating] = useState(false);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contactsApi.list(search || undefined);
      setContacts(data);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadContacts, 300);
    return () => clearTimeout(timer);
  }, [loadContacts]);

  async function createContact() {
    if (!newContact.full_name && !newContact.email && !newContact.phone) return;
    setCreating(true);
    try {
      await api.post('/contacts', {
        full_name: newContact.full_name || null,
        email: newContact.email || null,
        phone: newContact.phone || null,
        metadata: { cpf: newContact.cpf || null, source: 'manual' },
      });
      setShowCreateModal(false);
      setNewContact({ full_name: '', email: '', phone: '', cpf: '' });
      loadContacts();
    } finally {
      setCreating(false);
    }
  }

  const filteredContacts = contacts.filter(c => {
    if (sourceFilter === 'all') return true;
    return c.metadata?.source === sourceFilter;
  });

  const sourceCounts = contacts.reduce((acc, c) => {
    const src = c.metadata?.source || 'unknown';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">CRM — Contatos</h1>
              <p className="text-gray-400 text-sm mt-0.5">{contacts.length} contato(s) na base</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {/* Export CSV */}}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar CSV
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Contato
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou telefone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
              />
            </div>

            {/* Source filter chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSourceFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold transition',
                  sourceFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
                )}
              >
                Todos ({contacts.length})
              </button>
              {Object.entries(SOURCE_LABELS).map(([key, { label, color }]) => {
                const count = sourceCounts[key] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setSourceFilter(key)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-semibold transition',
                      sourceFilter === key ? 'ring-2 ring-offset-1 ring-gray-400 ' + color : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48">
                <Users className="w-12 h-12 text-gray-200 mb-3" />
                <p className="font-semibold text-gray-500">Nenhum contato encontrado</p>
                <p className="text-xs text-gray-400 mt-1">
                  {search ? 'Tente outro termo de busca' : 'Os contatos aparecem automaticamente quando clientes entram em contato'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contato</th>
                    <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email / Telefone</th>
                    <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Origem</th>
                    <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Última visita</th>
                    <th className="px-5 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Desde</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredContacts.map(contact => (
                    <tr
                      key={contact.id}
                      className={cn(
                        'hover:bg-gray-50/50 transition group cursor-pointer',
                        selectedContact?.id === contact.id && 'bg-indigo-50/50',
                      )}
                      onClick={() => setSelectedContact(selectedContact?.id === contact.id ? null : contact)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                            {getInitials(contact.full_name || 'V')}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{contact.full_name || 'Visitante'}</p>
                            {contact.metadata?.cpf && (
                              <p className="text-[10px] text-gray-400 font-mono">CPF: {contact.metadata.cpf}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5">
                          {contact.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {contact.email}
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {contact.phone}
                            </div>
                          )}
                          {!contact.email && !contact.phone && (
                            <span className="text-[11px] text-gray-300 italic">Sem dados</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <SourceBadge source={contact.metadata?.source} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {timeAgo(contact.last_seen_at)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">
                        {new Date(contact.first_seen_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedContact(contact); }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedContact && (
        <ContactDetailPanel
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onUpdate={loadContacts}
        />
      )}

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Novo Contato</h2>
                <p className="text-xs text-gray-400">Adicionar contato manualmente à base</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { key: 'full_name', label: 'Nome completo', icon: User, type: 'text', placeholder: 'João da Silva' },
                { key: 'email', label: 'Email', icon: Mail, type: 'email', placeholder: 'joao@empresa.com' },
                { key: 'phone', label: 'Celular / WhatsApp', icon: Phone, type: 'tel', placeholder: '(11) 99999-9999' },
                { key: 'cpf', label: 'CPF', icon: CreditCard, type: 'text', placeholder: '000.000.000-00' },
              ].map(field => {
                const Icon = field.icon;
                return (
                  <div key={field.key}>
                    <label className="text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-gray-400" />{field.label}
                    </label>
                    <input
                      type={field.type}
                      value={(newContact as any)[field.key]}
                      onChange={e => setNewContact(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                );
              })}
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={createContact}
                disabled={creating || (!newContact.full_name && !newContact.email && !newContact.phone)}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition disabled:opacity-50"
              >
                {creating ? 'Criando...' : 'Criar Contato'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
