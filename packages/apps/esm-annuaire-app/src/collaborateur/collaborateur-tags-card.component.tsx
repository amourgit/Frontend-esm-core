import React, { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import { type DirectoryEmployee } from '../data/directory-data';
import { playXboxSound } from '@egen-civitas/esm-framework';

interface CollaborateurTagsCardProps {
  employee: DirectoryEmployee;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export function CollaborateurTagsCard({
  employee,
  onShowToast,
}: CollaborateurTagsCardProps) {
  const [tags, setTags] = useState<string[]>(
    employee.skills && employee.skills.length > 0
      ? employee.skills
      : ['Cloud Architecture', 'SecOps', 'Alfresco GED', 'High Availability', 'Linux']
  );
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    playXboxSound('select');
    setTags(prev => [...prev, newTag.trim()]);
    onShowToast?.(`Tag "${newTag.trim()}" ajouté`, 'success');
    setNewTag('');
    setIsAdding(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    playXboxSound('select');
    setTags(prev => prev.filter(t => t !== tagToRemove));
    onShowToast?.(`Tag "${tagToRemove}" retiré`, 'info');
  };

  return (
    <div className="w-full flex flex-col gap-3 p-4 sm:p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] backdrop-blur-md transition-all shadow-sm select-none">
      
      {/* Title */}
      <div className="w-full flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white tracking-tight">
          Tags
        </h3>
        <button
          type="button"
          onClick={() => {
            playXboxSound('select');
            setIsAdding(!isAdding);
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Ajouter un tag"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tags Pills List */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-slate-200 transition-colors group"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="opacity-40 hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-slate-400 hover:text-rose-400" />
            </button>
          </span>
        ))}
      </div>

      {/* Add Tag Input Form */}
      {isAdding && (
        <form onSubmit={handleAddTag} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Nouveau tag..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-xs text-white placeholder-slate-400 outline-none focus:border-amber-400"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-semibold text-xs hover:bg-amber-300 transition-colors"
          >
            Ajouter
          </button>
        </form>
      )}

    </div>
  );
}
