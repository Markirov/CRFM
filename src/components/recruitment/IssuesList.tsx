import type { ValidationIssue } from '@/lib/recruitment/types';
import { AlertCircle, AlertTriangle } from 'lucide-react';

export function IssuesList({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) return null;
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  return (
    <div className="space-y-1">
      {errors.length > 0 && (
        <div className="border border-error/40 bg-error/5 p-2">
          <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-error mb-1">
            <AlertCircle size={12} /> Errores ({errors.length})
          </div>
          <ul className="font-mono text-[10px] text-error/90 space-y-0.5">
            {errors.map((e, i) => <li key={i}>· {e.message}</li>)}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="border border-amber-500/40 bg-amber-500/5 p-2">
          <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-amber-400 mb-1">
            <AlertTriangle size={12} /> Advertencias ({warnings.length})
          </div>
          <ul className="font-mono text-[10px] text-amber-400/90 space-y-0.5">
            {warnings.map((w, i) => <li key={i}>· {w.message}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
