import { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PickerEmployee = { _id: string; name: string };
export type Suggestion = { employeeId: string; entries: number };

type Props = {
  employees: PickerEmployee[];
  value: string[];
  onChange: (ids: string[]) => void;
  /** Most common employees for the chosen project, best first. */
  suggestions?: Suggestion[];
  /** employeeId -> reason they can't be picked (e.g. "On Leave"). */
  unavailable?: Map<string, string>;
};

/**
 * Inline employee picker (no popup): selected people are chips you can remove,
 * likely people are one-tap suggestions, everyone else is found via search.
 */
export function EmployeePicker({ employees, value, onChange, suggestions = [], unavailable }: Props) {
  const [query, setQuery] = useState('');
  const [browse, setBrowse] = useState(false);

  const byId = new Map(employees.map((e) => [e._id, e]));
  const selected = value.map((id) => byId.get(id)).filter((e): e is PickerEmployee => !!e);
  const isFree = (id: string) => !unavailable?.has(id);

  const add = (ids: string[]) => onChange(Array.from(new Set([...value, ...ids])));
  const remove = (id: string) => onChange(value.filter((v) => v !== id));

  const openSuggestions = suggestions
    .filter((s) => byId.has(s.employeeId) && isFree(s.employeeId) && !value.includes(s.employeeId));

  const q = query.trim().toLowerCase();
  const showList = browse || q.length > 0;
  const results = employees.filter((e) => !value.includes(e._id) && (!q || e.name.toLowerCase().includes(q)));

  return (
    <div className="space-y-3 rounded-lg border border-line p-3">
      {/* Selected */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-ink-secondary">
            {selected.length === 0 ? 'No one selected yet' : `${selected.length} selected`}
          </span>
          {selected.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="text-xs text-ink-secondary hover:text-ink">
              Clear all
            </button>
          )}
        </div>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((e) => (
              <span key={e._id} className="inline-flex items-center gap-1 rounded-full bg-primary-tint py-1 pl-3 pr-1.5 text-[13px] font-medium text-primary">
                {e.name}
                <button
                  type="button"
                  aria-label={`Remove ${e.name}`}
                  onClick={() => remove(e._id)}
                  className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/10"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {openSuggestions.length > 0 && (
        <div className="border-t border-dashed border-line pt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-ink-secondary">Usually on this project</span>
            <button
              type="button"
              onClick={() => add(openSuggestions.map((s) => s.employeeId))}
              className="text-xs font-medium text-primary hover:underline"
            >
              Add all ({openSuggestions.length})
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {openSuggestions.map((s) => (
              <button
                key={s.employeeId}
                type="button"
                onClick={() => add([s.employeeId])}
                title={`${s.entries} previous ${s.entries === 1 ? 'entry' : 'entries'}`}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-3 py-1 text-[13px] text-ink hover:border-primary hover:bg-primary-tint hover:text-primary"
              >
                <Plus className="h-3 w-3" />
                {byId.get(s.employeeId)!.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search / browse */}
      <div className="border-t border-dashed border-line pt-3">
        <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3">
          <Search className="h-4 w-4 shrink-0 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search to add another employee..."
            className="h-9 min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-secondary"
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="text-ink-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setBrowse((b) => !b)}
            className="shrink-0 text-xs font-medium text-primary hover:underline"
          >
            {browse ? 'Hide list' : 'Show all'}
          </button>
        </div>

        {showList && (
          <ul className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-line">
            {results.length === 0 ? (
              <li className="px-3 py-4 text-center text-[13px] text-ink-secondary">No employees found.</li>
            ) : (
              results.map((e) => {
                const reason = unavailable?.get(e._id);
                return (
                  <li key={e._id}>
                    <button
                      type="button"
                      disabled={!!reason}
                      onClick={() => { add([e._id]); setQuery(""); }}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px]',
                        reason ? 'cursor-not-allowed bg-gray-50 text-ink-muted' : 'hover:bg-gray-50',
                      )}
                    >
                      <span className="truncate">{e.name}</span>
                      {reason ? (
                        <span className="shrink-0 text-[11px] font-medium text-red-500">{reason}</span>
                      ) : (
                        <Plus className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
