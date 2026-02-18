'use client';
import { useEffect, useState, useRef } from 'react';
import { useConversationsStore, Conversation } from '@/store/conversations.store';
import { api, usersApi, contactNotesApi, conversationsApi } from '@/lib/api';
import { getInitials, timeAgo } from '@/lib/utils';
import {
  User,
  Mail,
  Phone,
  Globe,
  Tag,
  StickyNote,
  Trash2,
  Send,
  MapPin,
  Monitor,
  Clock,
  RefreshCw,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  conversation: Conversation | undefined;
}

interface Contact {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  metadata: Record<string, any>;
  first_seen_at: string;
  last_seen_at: string;
}

interface Agent {
  id: string;
  full_name: string;
  email: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
}

type PanelTab = 'info' | 'notes';

function InfoRow({ icon: Icon, label, value, mono }: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold leading-none mb-0.5">{label}</p>
        <p className={cn('text-[12px] text-gray-700 break-all leading-snug', mono && 'font-mono')}>{value}</p>
      </div>
    </div>
  );
}

function SectionBlock({ title, children, defaultOpen = true }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-50 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition"
      >
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{title}</span>
        {open ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

export default function ContactContextPanel({ conversation }: Props) {
  const { upsertConversation } = useConversationsStore();
  const [contact, setContact] = useState<Contact | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<PanelTab>('info');
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!conversation?.contact_id) return;
    api.get(`/contacts/${conversation.contact_id}`).then((r) => setContact(r.data)).catch(() => { });
    usersApi.list().then(setAgents).catch(() => { });
    setTags(conversation.tags || []);
  }, [conversation?.contact_id, conversation?.id]);

  useEffect(() => {
    if (activeTab === 'notes' && conversation?.contact_id) {
      contactNotesApi.list(conversation.contact_id).then(setNotes).catch(() => { });
    }
  }, [activeTab, conversation?.contact_id]);

  useEffect(() => {
    if (addingTag) {
      setTimeout(() => tagInputRef.current?.focus(), 50);
    }
  }, [addingTag]);

  async function addNote() {
    if (!noteText.trim() || !conversation?.contact_id) return;
    setSavingNote(true);
    try {
      const note = await contactNotesApi.create(conversation.contact_id, noteText.trim());
      setNotes(prev => [note, ...prev]);
      setNoteText('');
    } finally {
      setSavingNote(false);
    }
  }

  async function deleteNote(noteId: string) {
    if (!conversation?.contact_id) return;
    await contactNotesApi.delete(conversation.contact_id, noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  }

  async function handleAddTag() {
    const tag = newTag.trim();
    if (!tag || !conversation?.id) return;
    if (tags.includes(tag)) { setNewTag(''); setAddingTag(false); return; }
    const newTags = [...tags, tag];
    try {
      const updated = await conversationsApi.updateTags(conversation.id, newTags);
      setTags(newTags);
      upsertConversation(updated);
    } catch { }
    setNewTag('');
    setAddingTag(false);
  }

  async function handleRemoveTag(tag: string) {
    if (!conversation?.id) return;
    const newTags = tags.filter(t => t !== tag);
    try {
      const updated = await conversationsApi.updateTags(conversation.id, newTags);
      setTags(newTags);
      upsertConversation(updated);
    } catch { }
  }

  async function handleAssign(agentId: string) {
    if (!conversation?.id) return;
    try {
      const updated = await api.post(`/conversations/${conversation.id}/assign`, { agentId }).then(r => r.data);
      upsertConversation(updated);
    } catch { }
  }

  async function handleReopen() {
    if (!conversation?.id) return;
    try {
      const updated = await conversationsApi.reopen(conversation.id);
      upsertConversation(updated);
    } catch { }
  }

  if (!conversation) {
    return <div className="w-[280px] border-l border-gray-100 bg-white" />;
  }

  const ip = conversation.session?.ip_address;
  const city = conversation.session?.metadata?.city;
  const region = conversation.session?.metadata?.region;
  const country = conversation.session?.metadata?.country;
  const browser = conversation.session?.metadata?.browser;
  const os = conversation.session?.metadata?.os;
  const pageUrl = conversation.session?.last_url || conversation.metadata?.pageUrl;

  return (
    <div className="w-[280px] border-l border-gray-100 bg-white flex flex-col overflow-hidden shrink-0">
      {/* Contact header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-base font-bold shadow-sm">
            {getInitials(contact?.full_name || 'V')}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
              {contact?.full_name || 'Visitante'}
            </h3>
            {contact?.email && (
              <p className="text-[11px] text-gray-400 truncate mt-0.5">{contact.email}</p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <span className={cn(
                'inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold',
                conversation.status === 'open'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500',
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full', conversation.status === 'open' ? 'bg-green-500' : 'bg-gray-400')} />
                {conversation.status === 'open' ? 'Em aberto' : 'Resolvida'}
              </span>
            </div>
          </div>
        </div>

        {/* Action: reopen/resolve */}
        {conversation.status === 'resolved' && (
          <button
            onClick={handleReopen}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition"
          >
            <RefreshCw className="w-3 h-3" />
            Reabrir conversa
          </button>
        )}

        {/* Tabs */}
        <div className="flex mt-3 bg-gray-100 rounded-xl p-0.5">
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              'flex-1 py-1.5 text-[11px] font-bold rounded-lg transition',
              activeTab === 'info' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600',
            )}
          >
            Informações
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={cn(
              'flex-1 py-1.5 text-[11px] font-bold rounded-lg transition',
              activeTab === 'notes' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600',
            )}
          >
            Notas {notes.length > 0 && <span className="ml-1 text-[9px] bg-amber-200 text-amber-800 px-1.5 rounded-full">{notes.length}</span>}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {activeTab === 'info' && (
          <div className="flex flex-col divide-y divide-gray-50">
            {/* Contact info */}
            <SectionBlock title="Contato">
              <InfoRow icon={User} label="Nome" value={contact?.full_name} />
              <InfoRow icon={Mail} label="Email" value={contact?.email} />
              <InfoRow icon={Phone} label="Telefone" value={contact?.phone} />
              {contact?.first_seen_at && (
                <InfoRow icon={Clock} label="Primeira visita" value={timeAgo(contact.first_seen_at)} />
              )}
              {contact?.last_seen_at && (
                <InfoRow icon={Clock} label="Última visita" value={timeAgo(contact.last_seen_at)} />
              )}
            </SectionBlock>

            {/* Session / Device */}
            <SectionBlock title="Sessão" defaultOpen={false}>
              {ip && <InfoRow icon={Globe} label="IP" value={ip} mono />}
              {(city || region) && (
                <InfoRow icon={MapPin} label="Localização" value={[city, region, country].filter(Boolean).join(', ')} />
              )}
              {browser && <InfoRow icon={Monitor} label="Navegador" value={browser} />}
              {os && <InfoRow icon={Monitor} label="Sistema" value={os} />}
              {pageUrl && (
                <div className="flex items-start gap-2.5 py-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold leading-none mb-0.5">Página</p>
                    <a
                      href={pageUrl.startsWith('http') ? pageUrl : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-500 hover:underline break-all leading-snug"
                    >
                      {pageUrl.length > 40 ? `...${pageUrl.slice(-37)}` : pageUrl}
                    </a>
                  </div>
                </div>
              )}
              {!ip && !city && !browser && !os && !pageUrl && (
                <p className="text-[11px] text-gray-400 italic">Sem dados de sessão</p>
              )}
            </SectionBlock>

            {/* Tags */}
            <SectionBlock title="Tags">
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.length === 0 && !addingTag ? (
                  <span className="text-[11px] text-gray-400 italic">Nenhuma tag</span>
                ) : (
                  tags.map((t, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-semibold rounded-lg border border-indigo-100">
                      {t}
                      <button
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-red-500 transition ml-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>
              {addingTag ? (
                <div className="flex gap-1">
                  <input
                    ref={tagInputRef}
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddTag();
                      if (e.key === 'Escape') { setAddingTag(false); setNewTag(''); }
                    }}
                    placeholder="Nova tag..."
                    className="flex-1 px-2 py-1 text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300"
                  />
                  <button onClick={handleAddTag} className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition">
                    OK
                  </button>
                  <button onClick={() => { setAddingTag(false); setNewTag(''); }} className="px-1.5 py-1 text-gray-400 hover:text-gray-600 transition">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingTag(true)}
                  className="flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-700 transition font-semibold"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar tag
                </button>
              )}
            </SectionBlock>

            {/* Assign agent */}
            <SectionBlock title="Responsável">
              <select
                className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-gray-700"
                value={conversation.assigned_to || ''}
                onChange={(e) => handleAssign(e.target.value)}
              >
                <option value="">Sem responsável</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}
                  </option>
                ))}
              </select>
            </SectionBlock>

            {/* Conversation metadata */}
            <SectionBlock title="Conversa" defaultOpen={false}>
              <InfoRow icon={Clock} label="Iniciada" value={timeAgo(conversation.created_at)} />
              <div className="py-1.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold leading-none mb-1">Canal</p>
                <span className={cn(
                  'inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold',
                  conversation.channel === 'whatsapp_meta' ? 'bg-green-100 text-green-700' :
                  conversation.channel === 'telegram' ? 'bg-sky-100 text-sky-700' :
                  'bg-blue-100 text-blue-700',
                )}>
                  {conversation.channel === 'web_widget' ? 'Widget Web' :
                   conversation.channel === 'whatsapp_meta' ? 'WhatsApp' :
                   conversation.channel === 'telegram' ? 'Telegram' : conversation.channel}
                </span>
              </div>
            </SectionBlock>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 p-3 space-y-2 overflow-y-auto">
              {notes.length === 0 ? (
                <div className="text-center py-8">
                  <StickyNote className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Nenhuma nota ainda</p>
                  <p className="text-[10px] text-gray-300 mt-1">Registre observações internas sobre este cliente</p>
                </div>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="bg-amber-50 border border-amber-100 rounded-2xl p-3 group relative">
                    <p className="text-[12px] text-gray-800 leading-relaxed whitespace-pre-wrap pr-5">{note.content}</p>
                    <p className="text-[10px] text-gray-400 mt-1.5">{timeAgo(note.created_at)}</p>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-gray-300 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-gray-100 shrink-0">
              <div className="flex gap-2">
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Nota interna sobre este contato..."
                  rows={2}
                  className="flex-1 px-3 py-2 text-[12px] bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none placeholder-amber-300"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addNote();
                    }
                  }}
                />
                <button
                  onClick={addNote}
                  disabled={!noteText.trim() || savingNote}
                  className="w-9 h-9 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 rounded-xl flex items-center justify-center transition self-end shrink-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
