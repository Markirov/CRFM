import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Terminal, Play, X, RefreshCw } from 'lucide-react';
import { listen } from '@tauri-apps/api/event';

// Tipos basados en el lib.rs de Tauri
type LogLine = {
  id: number;
  stream: "stdout" | "stderr" | "exit" | "info";
  text: string;
  ts: string;
};

type ButtonDef = {
  id: string;
  label: string;
  desc?: string;
  cmd?: string;
};

const BUTTONS: ButtonDef[] = [
  { id: "dev", label: "Local Dev", desc: "scripts\\local.bat", cmd: "scripts\\local.bat" },
  { id: "deploy", label: "Full Deploy", desc: "scripts\\deploy.bat", cmd: "scripts\\deploy.bat" },
  { id: "deploy_fb", label: "FB Deploy", desc: "scripts\\deploy-firebase.bat", cmd: "scripts\\deploy-firebase.bat" },
  { id: "sync", label: "Sync Solaris (Rust)", desc: "Parseo nativo .ssw", cmd: "native" },
  { id: "index", label: "Rebuild Indexes", desc: "scripts\\index.bat", cmd: "scripts\\index.bat" },
  { id: "backup", label: "Backup DB", desc: "scripts\\backup.bat", cmd: "scripts\\backup.bat" },
];

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [running, setRunning] = useState<Record<string, number>>({});

  useEffect(() => {
    const un = listen<{ run_id: number; stream: string; line: string; code: number | null }>("shell-event", (ev) => {
      const payload = ev.payload;
      const ts = new Date().toTimeString().slice(0, 8);
      
      setLogs((prev) => {
        const next = [
          ...prev,
          {
            id: prev.length,
            stream: payload.stream as "stdout" | "stderr" | "exit",
            text: payload.stream === "exit" ? `[exit code=${payload.code ?? "?"}]` : payload.line,
            ts,
          },
        ];
        return next.length > 1500 ? next.slice(-1500) : next;
      });

      if (payload.stream === "exit") {
        setRunning((prev) => {
          const copy = { ...prev };
          for (const [k, v] of Object.entries(copy)) {
            if (v === payload.run_id) delete copy[k];
          }
          return copy;
        });
      }
    });

    return () => {
      un.then((f) => f());
    };
  }, []);

  const pushLog = (text: string, stream: LogLine["stream"] = "info") => {
    const ts = new Date().toTimeString().slice(0, 8);
    setLogs((p) => [...p, { id: p.length, stream, text, ts }]);
  };

  const runCmd = async (b: ButtonDef) => {
    if (!b.cmd) return;
    pushLog(`> ${b.label}: ${b.cmd}`);
    try {
      const cfg: any = await invoke("get_config");
      if (b.id === 'sync') {
        pushLog(`> Iniciando escaneo nativo SSW en E:\\Drive\\CBT\\SSW_0.7.4...`);
        const res: any = await invoke("sync_ssw_database", { cwd: cfg.project_root });
        pushLog(`[SSW SYNC OK] Completado en ${res.elapsed_ms}ms`);
        pushLog(`Mechs copiados: ${res.mechs_copied}`);
        pushLog(`Total Mechs indexados: ${res.mechs_indexed}`);
        pushLog(`Total Vehículos indexados: ${res.vehicles_indexed}`);
        return;
      }
      const id = await invoke<number>("stream_shell", {
        cwd: cfg.project_root,
        cmd: b.cmd,
      });
      setRunning((p) => ({ ...p, [b.id]: id }));
    } catch (e) {
      pushLog(`error: ${e}`, "stderr");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0c] border border-red-600/60 w-full max-w-4xl h-[80vh] flex flex-col shadow-[0_0_50px_rgba(220,38,38,0.2)]">
        
        {/* Header */}
        <div className="bg-red-900/40 border-b border-red-600/60 p-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-red-500 font-black tracking-widest">
            <Terminal size={20} />
            <span>SISTEMA DE ADMINISTRACIÓN Y DESPLIEGUE (ROOT)</span>
          </div>
          <button onClick={onClose} className="text-red-500 hover:text-red-300">
            <X size={24} />
          </button>
        </div>

        {/* Layout */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Panel Izquierdo: Botones */}
          <div className="w-64 border-r border-red-900/40 p-4 flex flex-col gap-3 overflow-y-auto bg-black">
            <div className="text-[10px] text-red-600 font-mono mb-2">COMANDOS DISPONIBLES</div>
            {BUTTONS.map(b => {
              const isRunning = !!running[b.id];
              return (
                <button 
                  key={b.id}
                  onClick={() => runCmd(b)}
                  disabled={isRunning}
                  className={`flex items-center justify-between p-3 border text-left transition-colors ${isRunning ? 'border-red-500 bg-red-900/20 text-red-400 cursor-not-allowed' : 'border-slate-800 bg-slate-900 hover:border-red-500 hover:bg-slate-800 text-slate-300'}`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{b.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{b.desc}</span>
                  </div>
                  {isRunning ? <RefreshCw size={14} className="animate-spin text-red-500" /> : <Play size={14} className="text-slate-600" />}
                </button>
              )
            })}
          </div>

          {/* Panel Derecho: Consola */}
          <div className="flex-1 bg-[#02050a] flex flex-col p-2 relative">
             <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)] z-10" />
             <div className="text-[10px] text-slate-500 font-mono flex justify-between mb-2 z-20">
               <span>TERMINAL SALIDA ESTÁNDAR</span>
               <button onClick={() => setLogs([])} className="hover:text-red-400">CLEAR</button>
             </div>
             
             <div className="flex-1 overflow-y-auto font-mono text-[11px] p-2 custom-scrollbar z-20 leading-relaxed">
               {logs.length === 0 && <span className="text-slate-700">Esperando comandos...</span>}
               {logs.map((l) => (
                 <div key={l.id} className="flex gap-2 hover:bg-white/5">
                   <span className="text-slate-600 shrink-0">[{l.ts}]</span>
                   <span className={`break-all ${
                     l.stream === 'stderr' ? 'text-red-400' : 
                     l.stream === 'exit' ? 'text-yellow-400 font-bold' : 
                     l.stream === 'info' ? 'text-cyan-400' : 'text-slate-300'
                   }`}>
                     {l.text}
                   </span>
                 </div>
               ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
