import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMechEditor } from '@/hooks/useMechEditor';
import { serializeSSW } from '@/lib/ssw-serializer';
import { MechEditorGrid } from '@/components/editor/MechEditorGrid';
import { EquipmentPicker } from '@/components/editor/EquipmentPicker';
import { ArmorEditor } from '@/components/editor/ArmorEditor';

export type EditorSaveTarget = 'hangar' | 'personal';
export type EditorMode = 'libre' | 'campaign' | 'preview-compra';

interface EditorPageProps {
  initialSswXml: string;
  onSave: (newSsw: string, target: EditorSaveTarget) => void;
  onCancel: () => void;
  mode?: EditorMode;       // 'libre' = sin coste (TRO/no campaña); 'campaign' = requiere aprobación; 'preview-compra' = mercado hangar
  strictTech?: boolean;    // true = solo techBase del mech (campaña); false = libre (simulador)
  allowHangarSave?: boolean; // false oculta botón Hangar (ej. TRO sin destino directo)
  allowPersonalSave?: boolean;
}

export function EditorPage({
  initialSswXml,
  onSave,
  onCancel,
  mode = 'libre',
  strictTech = true,
  allowHangarSave = true,
  allowPersonalSave = true,
}: EditorPageProps) {
  const { baseMech, state, setState, tonnageDelta, freeCritsPerLoc } = useMechEditor(initialSswXml);

  const handleSave = (target: EditorSaveTarget) => {
    const newXml = serializeSSW(initialSswXml, state);
    onSave(newXml, target);
  };

  const isArmorOverMax = () => {
    if (!baseMech) return false;
    const is = baseMech.is;
    return state.armor.HD > 9 ||
           (state.armor.CTf + state.armor.CTr) > is.CT * 2 ||
           (state.armor.LTf + state.armor.LTr) > is.LT * 2 ||
           (state.armor.RTf + state.armor.RTr) > is.RT * 2 ||
           state.armor.LA > is.LA * 2 ||
           state.armor.RA > is.RA * 2 ||
           state.armor.LL > is.LL * 2 ||
           state.armor.RL > is.RL * 2;
  };

  const hasCritOverflow = Object.values(freeCritsPerLoc || {}).some(v => v < 0);
  const canSave = tonnageDelta >= 0 && !hasCritOverflow && !isArmorOverMax();

  if (!baseMech) return <div>Cargando Editor...</div>;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#050f14]/95 backdrop-blur-md flex flex-col">
      {/* Header */}
      <div className="h-14 bg-cyan-950/40 border-b border-cyan-800 flex items-center justify-between px-4">
        <h1 className="font-headline font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-4">
          <span>Editor de Loadout: {baseMech.chassis} {baseMech.model} ({baseMech.tonnage}t)</span>
          <span className={`text-xs px-2 py-0.5 rounded ${tonnageDelta < 0 ? 'bg-red-500/20 text-red-500' : tonnageDelta > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
            Tonelaje Libre: {tonnageDelta > 0 ? '+' : ''}{tonnageDelta}t
          </span>
        </h1>
        <div className="flex gap-2 items-center">
          {mode === 'campaign' && (
            <span className="text-[10px] px-2 py-0.5 border border-amber-700 bg-amber-950/30 text-amber-400 uppercase tracking-widest">
              Campaña · req. aprobación
            </span>
          )}
          {mode === 'preview-compra' && (
            <span className="text-[10px] px-2 py-0.5 border border-emerald-700 bg-emerald-950/30 text-emerald-400 uppercase tracking-widest">
              Preview compra+mod
            </span>
          )}
          <button onClick={onCancel} className="px-4 py-2 border border-cyan-800 hover:bg-cyan-900/30 text-xs text-cyan-500 uppercase tracking-widest transition-colors">
            Cancelar
          </button>
          {allowPersonalSave && (
            <button
              onClick={() => handleSave('personal')}
              disabled={!canSave}
              className="px-4 py-2 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500 text-cyan-300 font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50 disabled:border-cyan-900 disabled:text-cyan-700"
              title="Guardar como diseño personal (customMechs)"
            >
              Guardar Personal
            </button>
          )}
          {allowHangarSave && (
            <button
              onClick={() => handleSave('hangar')}
              disabled={!canSave}
              className="px-4 py-2 bg-orange-950/40 hover:bg-orange-900/60 border border-orange-500 text-orange-400 font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50 disabled:border-cyan-900 disabled:text-cyan-700"
              title={mode === 'campaign' ? 'Solicitar modificación al mech del Hangar' : 'Guardar en Hangar'}
            >
              {mode === 'campaign' ? 'Solicitar Mod' : 'Guardar Hangar'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden grid grid-cols-12 bg-[#02050a]/80">
        {/* Left: Mech Specs & Armor */}
        <div className="col-span-3 border-r border-cyan-900/50 p-4 overflow-y-auto">
          <h2 className="font-bold text-slate-300 tracking-widest text-sm uppercase mb-4 flex justify-between items-center">
            <span>Armadura</span>
            <span className="text-[9px] px-1 border border-cyan-800 bg-cyan-950/30 text-cyan-500">
              {state.armorType.replace(' Armor', '')}
            </span>
          </h2>
          <ArmorEditor 
            baseMech={baseMech}
            state={state}
            onChangeArmor={(loc, val) => setState({ ...state, armor: { ...state.armor, [loc]: val } })}
          />
        </div>

        {/* Center: Critical Grid */}
        <div className="col-span-6 border-r border-cyan-900/50 p-4 overflow-y-auto">
          <h2 className="font-bold text-slate-300 tracking-widest text-sm uppercase mb-4">Slots Críticos</h2>
          <MechEditorGrid 
            baseMech={baseMech} 
            state={state} 
            freeCritsPerLoc={freeCritsPerLoc}
            onRemoveEquipment={(idx) => {
              const newEq = [...state.equipment];
              newEq.splice(idx, 1);
              setState({ ...state, equipment: newEq });
            }} 
          />
        </div>

        {/* Right: Equipment Picker */}
        <div className="col-span-3 p-4 bg-[#050f14] flex flex-col h-full">
          <h2 className="font-bold text-slate-300 tracking-widest text-sm uppercase mb-4">Catálogo</h2>
          <div className="flex-1 min-h-0">
            <EquipmentPicker
              techBase={baseMech.techBase}
              strictTech={strictTech}
              onAddEquipment={(item) => {
                const loc = (item.location || 'CT').toUpperCase();
                if (!['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'].includes(loc)) return;
                setState({
                  ...state,
                  equipment: [...state.equipment, { name: item.name, type: item.type, location: loc }]
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
