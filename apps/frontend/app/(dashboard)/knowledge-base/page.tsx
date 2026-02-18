'use client';
import { useEffect, useState } from 'react';
import { knowledgeBaseApi } from '@/lib/api';
import { Search, Plus, Edit2, Trash2, Eye, EyeOff, BookOpen, Tag, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Article {
  id: string;
  title: string;
  content: string;
  slug: string;
  category: string;
  published: boolean;
  views: number;
  created_at: string;
}

const CATEGORIES = ['Geral', 'Instalação', 'Uso', 'Cobrança', 'Técnico', 'Outro'];

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<Partial<Article> | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const data = await knowledgeBaseApi.list(category || undefined, search || undefined).catch(() => []);
    setArticles(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [search, category]);

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        const updated = await knowledgeBaseApi.update(editing.id, editing);
        setArticles(prev => prev.map(a => a.id === updated.id ? updated : a));
      } else {
        const created = await knowledgeBaseApi.create(editing);
        setArticles(prev => [created, ...prev]);
      }
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(article: Article) {
    const updated = await knowledgeBaseApi.update(article.id, { published: !article.published });
    setArticles(prev => prev.map(a => a.id === updated.id ? updated : a));
  }

  async function deleteArticle(id: string) {
    if (!confirm('Excluir este artigo?')) return;
    await knowledgeBaseApi.delete(id);
    setArticles(prev => prev.filter(a => a.id !== id));
  }

  if (editing !== null) {
    return (
      <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {editing.id ? 'Editar Artigo' : 'Novo Artigo'}
            </h1>
            <div className="flex gap-3">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={save} disabled={saving} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">Título</label>
              <input
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                value={editing.title || ''}
                onChange={e => setEditing({ ...editing, title: e.target.value })}
                placeholder="Título do artigo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">Categoria</label>
                <select
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
                  value={editing.category || ''}
                  onChange={e => setEditing({ ...editing, category: e.target.value })}
                >
                  <option value="">Selecionar categoria</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">Slug (URL)</label>
                <input
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-mono"
                  value={editing.slug || ''}
                  onChange={e => setEditing({ ...editing, slug: e.target.value })}
                  placeholder="slug-do-artigo"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">Conteúdo</label>
              <textarea
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-mono leading-relaxed"
                value={editing.content || ''}
                onChange={e => setEditing({ ...editing, content: e.target.value })}
                rows={16}
                placeholder="Escreva o conteúdo do artigo em Markdown..."
              />
              <p className="text-xs text-gray-400 mt-1">Suporta Markdown: **negrito**, *itálico*, # Título, - Lista</p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <input
                type="checkbox"
                id="published"
                checked={editing.published || false}
                onChange={e => setEditing({ ...editing, published: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <label htmlFor="published" className="text-sm font-medium text-gray-700">Publicar artigo (visível publicamente)</label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Base de Conhecimento</h1>
            <p className="text-sm text-gray-500">Artigos e documentação para sua equipe e clientes</p>
          </div>
          <button
            onClick={() => setEditing({ title: '', content: '', category: '', published: false })}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Novo Artigo
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
              placeholder="Buscar artigos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">Todas categorias</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Nenhum artigo encontrado</p>
            <button
              onClick={() => setEditing({ title: '', content: '', category: '', published: false })}
              className="mt-4 text-indigo-600 text-sm font-bold hover:underline"
            >
              Criar primeiro artigo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map(article => (
              <div key={article.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{article.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    {article.category && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {article.category}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {article.views} visualizações
                    </span>
                    <span className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      article.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {article.published ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => togglePublished(article)}
                    title={article.published ? 'Despublicar' : 'Publicar'}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition"
                  >
                    {article.published ? <EyeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setEditing(article)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteArticle(article.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
