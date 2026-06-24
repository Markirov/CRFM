// ═══════════════════════════════════════════════════════════════
//  SalvageModal — desguace fino mech destruido (Sprint Integración Tarea 8)
//  Tirada Technician 2d6 ≥ target por componente. Fallo destruye pieza.
//  Éxito agrega al almacén (chassis-locked para armor, global para armas).
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { X, Wrench, Skull, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { saveConfigBatch, saveHangarItem } from '@/lib/firebase-service';
import { type HangarItem } from '@/lib/hangar-types';
import { rollSalvage, type TechSkill, type SalvageResult } from '@/lib/camops-canon';
import { depositChassisArmor } from '@/lib/almacen-keys';

interface SalvageEntry {
  id: string;
  componentName: string;
  isArmOrLeg: boolean;
  /** Si es armor: punto a recuperar (n). Si es arma: 1. */
  qty: number;
  /** Si armor: tipo (Standard/Ferro-Fibrous/...). */
  armorType?: string;
  /** Resultado tirada (null = sin intentar). */
  result?: SalvageResult;
}

interface Props {
  mech: HangarItem;
  /** Lista nombres armas reales del mech (parseado de .ssw). Opcional. */
  weapons?: string[];
  onClose: () => void;
  onCommit: () => void;
}

export function SalvageModal({ mech, weapons, onClose, onCommit }: Props) {
  const campaign = useAppStore(s => s.campaign);
  const setCampaign = useAppStore(s => s.setCampaign);
  const almacen = campaign.almacen || {};

  const [skill, setSkill] = useState<TechSkill>('regular');
  const [teams, setTeams] = useState<number>(1);
  const [entries, setEntries] = useState<SalvageEntry[]>(() => buildEntries(mech, weapons));
  const [working, setWorking] = useState(false);

  const totalTimeMin = entries
    .filter(e => e.result?.recovered)
    .reduce((sum, e) => sum + (e.result?.timeMin ?? 0), 0);
  const recoveredCount = entries.filter(e => e.result?.recovered).length;
  const lostCount = entries.filter(e => e.result && !e.result.recovered).length;

  const rollOne = (idx: number) => {
    setEntries(prev => prev.map((e, i) => {
      if (i !== idx || e.result) return e;
      const r = rollSalvage(e.componentName, skill, teams, e.isArmOrLeg);
      return { ...e, result: r };
    }));
  };

  const rollAll = () => {
    setEntries(prev => prev.map(e => {
      if (e.result) return e;
      const r = rollSalvage(e.componentName, skill, teams, e.isArmOrLeg);
      return { ...e, result: r };
    }));
  };

  const handleCommit = async () => {
    setWorking(true);
    let newAlmacen = { ...almacen };

    for (const e of entries) {
      if (!e.result?.recovered) continue;
      if (e.armorType) {
        // Armor recuperado → chasis-locked
        newAlmacen = depositChassisArmor(newAlmacen, mech.chassis, e.armorType, e.qty);
      } else {
        // Arma/equipo → almacén global por nombre
        newAlmacen[e.componentName] = (newAlmacen[e.componentName] ?? 0) + e.qty;
      }
    }

    setCampaign({ almacen: newAlmacen });
    await saveConfigBatch({ ALMACEN_JSON: JSON.stringify(newAlmacen) });

    // Marca mech como desguazado
    const updated: HangarItem = { ...mech, estado: 'desguazado', updatedAt: new Date().toISOString() };
    await saveHangarItem(updated);

    setWorking(false);
    onCommit();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface-container border-2 border-error/60 clip-chamfer max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">

        <div className="p-4 border-b border-error/30 flex items-center justify-between">
          <h3 className="font-headline text-lg text-error font-bold uppercase tracking-widest flex items-center gap-2">
            <Skull size={20} /> Desguace: {mech.chassis} {mech.model}
          </h3>
          <button onClick={onClose} className="text-secondary hover:text-error">
            <X size={20} />
          </button>
        </div>

        {/* CamOps controls */}
        <div className="p-3 border-b border-outline-variant/30 flex flex-wrap items-center gap-3 bg-surface-container-low">
          <span className="font-mono text-[10px] uppercase tracking-widest text-secondary/60">Equipo desguace:</span>
          <label className="font-mono text-[10px] text-secondary/80 flex items-center gap-1">
            Skill:
            <select
              value={skill}
              onChange={e => setSkill(e.target.value as TechSkill)}
              className="bg-surface-container border border-outline-variant/40 text-[10px] font-mono text-cream px-1 py-0.5"
            >
              <option value="green">Green (target 9+)</option>
              <option value="regular">Regular (target 7+)</option>
              <option value="veteran">Veteran (target 6+)</option>
              <option value="elite">Elite (target 5+)</option>
            </select>
          </label>
          <label className="font-mono text-[10px] text-secondary/80 flex items-center gap-1">
            Equipos:
            <select
              value={teams}
              onChange={e => setTeams(parseInt(e.target.value) || 1)}
              className="bg-surface-container border border-outline-variant/40 text-[10px] font-mono text-cream px-1 py-0.5"
            >
              <option value={1}>1</option>
              <option value={2}>2 (÷2)</option>
              <option value={3}>3 (÷3)</option>
            </select>
          </label>
          <button
            onClick={rollAll}
            disabled={entries.every(e => !!e.result)}
            className="ml-auto px-3 py-1 text-[10px] font-mono uppercase border border-primary/60 text-primary hover:bg-primary/20 disabled:opacity-30"
          >
            Tirar Todo
          </button>
        </div>

        {/* Lista componentes */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {entries.length === 0 ? (
            <div className="text-center font-mono text-secondary/40 py-8">
              No hay componentes recuperables en este mech.
            </div>
          ) : (
            entries.map((e, idx) => (
              <div
                key={e.id}
                className={`flex items-center justify-between gap-2 p-2 border ${
                  e.result?.recovered
                    ? 'border-emerald-400/40 bg-emerald-400/5'
                    : e.result
                      ? 'border-error/40 bg-error/5'
                      : 'border-outline-variant/30 bg-surface'
                }`}
              >
                <div className="flex-1">
                  <div className="font-mono text-[11px] text-cream">
                    {e.componentName}
                    {e.qty > 1 && <span className="text-secondary/60"> × {e.qty}</span>}
                  </div>
                  <div className="font-mono text-[9px] text-secondary/50">
                    {e.armorType ? `Blindaje ${e.armorType} (chasis ${mech.chassis})` : e.isArmOrLeg ? 'Brazo/Pierna' : 'Arma/Equipo'}
                  </div>
                </div>
                {e.result ? (
                  <div className={`font-mono text-[10px] text-center px-2 py-1 border ${
                    e.result.recovered ? 'border-emerald-400/60 text-emerald-400' : 'border-error/60 text-error'
                  }`}>
                    <div>{e.result.d1}+{e.result.d2}={e.result.sum} vs {e.result.target}+</div>
                    <div className="font-bold flex items-center justify-center gap-1">
                      {e.result.recovered ? <><Check size={10} /> {e.result.timeMin} min</> : <><Skull size={10} /> DESTRUIDO</>}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => rollOne(idx)}
                    className="px-3 py-1 text-[10px] font-mono uppercase border border-primary/60 text-primary hover:bg-primary/20"
                  >
                    <Wrench size={10} className="inline mr-1" /> Tirar
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-outline-variant/30 bg-surface-container-low flex items-center justify-between">
          <div className="font-mono text-[10px] text-secondary/80">
            <span className="text-emerald-400">{recoveredCount} recuperados</span>
            {' · '}
            <span className="text-error">{lostCount} destruidos</span>
            {totalTimeMin > 0 && <> · ⏱ <span className="text-amber-400">{totalTimeMin} min</span></>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[10px] font-mono uppercase border border-outline-variant/40 text-secondary hover:bg-surface-container"
            >
              Cancelar
            </button>
            <button
              onClick={handleCommit}
              disabled={working || recoveredCount === 0}
              className="px-3 py-1.5 text-[10px] font-mono uppercase border border-primary bg-primary/20 text-primary hover:bg-primary/40 disabled:opacity-30"
            >
              Aplicar Desguace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Construye lista de componentes recuperables del mech destruido. */
function buildEntries(mech: HangarItem, weapons?: string[]): SalvageEntry[] {
  const entries: SalvageEntry[] = [];
  let id = 0;

  // Armor restante por loc del sessionActiva
  const armor = mech.sessionActiva?.armor || {};
  let totalArmorRemaining = 0;
  for (const v of Object.values(armor)) totalArmorRemaining += (v as number) || 0;
  if (totalArmorRemaining > 0) {
    entries.push({
      id: `salv_${id++}`,
      componentName: `Blindaje restante (${totalArmorRemaining} pts)`,
      isArmOrLeg: false,
      qty: totalArmorRemaining,
      armorType: 'Standard',
    });
  }

  // Brazos completos (LA/RA) si IS sigue >0
  const is = mech.sessionActiva?.is || {};
  if ((is.LA as number) > 0) {
    entries.push({ id: `salv_${id++}`, componentName: 'Brazo Izquierdo', isArmOrLeg: true, qty: 1 });
  }
  if ((is.RA as number) > 0) {
    entries.push({ id: `salv_${id++}`, componentName: 'Brazo Derecho', isArmOrLeg: true, qty: 1 });
  }

  // Armas — si recibimos lista parseada del .ssw, una entrada per arma con
  // nombre real. Filtramos las que estén marcadas como hit (destruidas) si
  // tenemos sessionActiva.crits con kind='weapon' + hit.
  if (weapons && weapons.length > 0) {
    const destroyedWeaponNames = new Set<string>();
    const crits = mech.sessionActiva?.crits || {};
    for (const slotList of Object.values(crits)) {
      if (!Array.isArray(slotList)) continue;
      for (const slot of slotList) {
        if (slot?.kind === 'weapon' && slot?.hit && typeof slot?.name === 'string') {
          destroyedWeaponNames.add(slot.name.toLowerCase());
        }
      }
    }
    for (const wRaw of weapons) {
      // Strip location suffix [LT] etc del nombre
      const wName = wRaw.replace(/\s*\[[^\]]+\]\s*$/, '').trim();
      if (!wName) continue;
      if (destroyedWeaponNames.has(wName.toLowerCase())) continue;
      entries.push({
        id: `salv_${id++}`,
        componentName: wName,
        isArmOrLeg: false,
        qty: 1,
      });
    }
  } else {
    // Fallback: contar slots weapon no-hit en crits
    const crits = mech.sessionActiva?.crits || {};
    let weaponsLikely = 0;
    for (const slotList of Object.values(crits)) {
      if (!Array.isArray(slotList)) continue;
      for (const slot of slotList) {
        if (slot?.kind === 'weapon' && !slot?.hit) weaponsLikely++;
      }
    }
    if (weaponsLikely > 0) {
      entries.push({
        id: `salv_${id++}`,
        componentName: `Armas montadas (${weaponsLikely})`,
        isArmOrLeg: false,
        qty: weaponsLikely,
      });
    }
  }

  return entries;
}
