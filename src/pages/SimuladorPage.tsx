import { useEffect, useMemo, useRef, useState } from 'react';
import { Shield, Crosshair, Cpu, Users, Eye, Target, Map as MapIcon, RotateCcw, Save, Search, Settings, AlertTriangle, AlertCircle, FileDigit, Plus, Download } from 'lucide-react';
import { TallerModal, genId, getCampaignDateISO } from '@/pages/FinanzasPage';
import { commitLibroEntryAndTreasury, removeMechFromUnit, saveFuerzaCampana, loadFuerzaCampana, saveConfigBatch, loadAllFuerzaConfigSlots, saveFuerzaConfigSlot, loadHangar, saveHangarItem, type FuerzaSlot } from '@/lib/firebase-service';
import type { HangarItem } from '@/lib/hangar-types';
import { newHangarItem } from '@/lib/hangar-types';
import { loadLocalSnapshot, snapshotHasUnits, extractDamageFromSession, applyDamageToSession } from '@/lib/simulador-persistence';
import { useMechCatalog } from '@/hooks/useMechCatalog';
import { loadRoster } from '@/lib/roster';
import { useSimulador } from '@/hooks/useSimulador';
import { EndTurnSummaryModal } from '@/components/simulador/EndTurnSummaryModal';
import { GlobalEndTurnSummaryModal } from '@/components/simulador/GlobalEndTurnSummaryModal';
import { usePerm } from '@/hooks/usePerm';
import { UnitSlots } from '@/components/simulador/UnitSlots';
import { InfantrySlots } from '@/components/simulador/infantry/InfantrySlots';
import { InfantryPanel } from '@/components/simulador/infantry/InfantryPanel';
import { BASlots } from '@/components/simulador/ba/BASlots';
import { BAPanel } from '@/components/simulador/ba/BAPanel';
import { PilotPanel, type AvailablePilot } from '@/components/simulador/PilotPanel';
import { HeatMonitor } from '@/components/simulador/HeatMonitor';
import { ArmorDiagram } from '@/components/simulador/ArmorDiagram';
import { CriticalMatrix } from '@/components/simulador/CriticalMatrix';
import { AdjustModModal, type AdjustModTarget } from '@/components/simulador/AdjustModModal';
import { CombatLog } from '@/components/simulador/CombatLog';
import { VehiclePanel } from '@/components/simulador/VehiclePanel';
import { CatalogSearch } from '@/components/simulador/CatalogSearch';
import { SimuladorPortada } from '@/components/simulador/SimuladorPortada';
import { FuerzaSyncBar } from '@/components/simulador/FuerzaSyncBar';
import { SubtabRightPortal } from '@/components/shell/SubtabRightPortal';
import { useAppStore } from '@/lib/store';
import type { FireTarget } from '@/lib/combat-types';
import { useLiveSession } from '@/hooks/useLiveSession';
import { ComputadoraCombate, IncomingAttacks } from '@/components/simulador/CombatRadar';
import { FireControlModal } from '@/components/simulador/FireControlModal';
import { SaveSlotModal } from '@/components/simulador/SaveSlotModal';
const TAB_MAP: Record<string, string> = { mechs: 'mechs', vehicles: 'vehiculos' };

// Orden fijo PJs (8 slots simulador en modo campaña). Match contra roster.jugador.
const CAMPAIGN_PILOT_ORDER = ['Jaime', 'Marcos', 'Joan', 'Alex', 'Erik', 'Zhao', 'Val', 'Tariq'];

const CAMPAIGN_UNLOCK_KEY = 'kk_campaign_unlock';
const CAMPAIGN_PASSWORD = 'Mark';

function isCampaignUnlocked(): boolean {
  return sessionStorage.getItem(CAMPAIGN_UNLOCK_KEY) === '1';
}
function gateCampaignWrite(actionLabel: string): boolean {
  if (isCampaignUnlocked()) return true;
  const pwd = prompt(`Modo Campaña (${actionLabel}): introduce la clave`);
  if (pwd === null) return false;
  if (pwd === CAMPAIGN_PASSWORD) {
    sessionStorage.setItem(CAMPAIGN_UNLOCK_KEY, '1');
    return true;
  }
  alert('Clave incorrecta');
  return false;
}

export function SimuladorPage() {
  const { activeSubTab, setActiveSubTab, simuladorPortada, setSimuladorPortada, roster, setRoster, campaign } = useAppStore();
  const sim = useSimulador();
  const live = useLiveSession(sim);
  const { catalog } = useMechCatalog();
  const { readable, writable, loading: permLoading } = usePerm('simulador');
  const [allowClan, setAllowClan] = useState(false);
  const [limitToYear, setLimitToYear] = useState(true);
  const [isFireModalOpen, setIsFireModalOpen] = useState(false);
  const [tallerSlotIdx, setTallerSlotIdx] = useState<number | null>(null);
  const [destroyedModalOpen, setDestroyedModalOpen] = useState(false);
  const [destroyedBusy, setDestroyedBusy] = useState(false);
  // Modo campaña SIEMPRE arranca OFF. Usuario lo activa manualmente.
  const [campaignMode, setCampaignMode] = useState<boolean>(false);

  // Hangar items mapeados a slot del simulador (solo válidos en campaignMode).
  // hangarBySlot[i] = HangarItem asignado al PJ que ocupa el slot i, o null.
  const [hangarBySlot, setHangarBySlot] = useState<(HangarItem | null)[]>(Array(8).fill(null));
  const prevSubTabRef = useRef<string | null>(null);

  // Modal de ajuste manual de calor/dificultad (armas y componentes)
  const [adjustTarget, setAdjustTarget] = useState<
    | (AdjustModTarget & { kind: 'weapon'; id: number })
    | (AdjustModTarget & { kind: 'crit'; loc: string; slotIdx: number })
    | null
  >(null);

  // Guarda snapshot actual en FUERZACAMPAÑA + recalcula ESTADOMECHS.
  // Reutilizado por: salir de campaña, autosave 5min, guardado manual, y
  // auto-guardado tras reparación en Taller.
  const saveCampaignProgress = async (nombre = 'Campaña'): Promise<boolean> => {
    try {
      const snap: any = { schemaVersion: 1, updatedAt: new Date().toISOString(), ...sim.getSnapshot() };
      const bv = (snap.mechSlots ?? []).reduce((a: number, s: any) => a + (s?.state?.bv ?? 0), 0)
               + (snap.vehicleSlots ?? []).reduce((a: number, s: any) => a + ((s?.state as any)?.bv ?? 0), 0);
      const res = await saveFuerzaCampana({ nombre, bv, snapshot: snap });
      if (!res?.success) {
        alert('Error guardando FUERZACAMPAÑA: ' + ((res as any)?.error || 'no_response'));
        return false;
      }
      // ESTADOMECHS map
      const map: Record<string, number> = {};
      for (const ms2 of (snap.mechSlots ?? [])) {
        const st: any = ms2?.state; const se: any = ms2?.session;
        if (!st || !se) continue;
        const armorLocs = ['HD','CTf','CTr','LTf','LTr','RTf','RTr','LA','RA','LL','RL'];
        const isLocs    = ['HD','CT','LT','RT','LA','RA','LL','RL'];
        const armorMax = armorLocs.reduce((s,k) => s + ((st.armor || {})[k] ?? 0), 0);
        const armorCur = armorLocs.reduce((s,k) => s + ((se.armor || {})[k] ?? 0), 0);
        const isMax    = isLocs.reduce((s,k) => s + ((st.is || {})[k] ?? 0), 0);
        const isCur    = isLocs.reduce((s,k) => s + ((se.is || {})[k] ?? 0), 0);
        const total = armorMax + isMax;
        if (total <= 0) continue;
        const pct = se.destroyed ? 0 : Math.round(((armorCur + isCur) / total) * 100);
        const key = `${st.chassis || ''} ${st.model || ''}`.trim();
        if (key) map[key] = pct;
      }
      await saveConfigBatch({ ESTADOMECHS: JSON.stringify(map) });

      // Integración Hangar: guardar daño persistente
      if (campaignMode) {
        const promises: Promise<any>[] = [];
        for (let i = 0; i < hangarBySlot.length; i++) {
          const item = hangarBySlot[i];
          const slot = snap.mechSlots[i];
          if (item && slot?.state && slot?.session) {
            const { estadoPct, damagePersist, sessionActiva } = extractDamageFromSession(slot.state, slot.session);
            item.estadoPct = estadoPct;
            item.damagePersist = damagePersist;
            item.sessionActiva = sessionActiva;
            if (estadoPct === 0) item.estado = 'destruido';
            else if (estadoPct < 100) item.estado = 'danado';
            else item.estado = 'operativo';
            promises.push(saveHangarItem(item));
          }
        }
        if (promises.length > 0) {
          await Promise.all(promises);
        }
      }
      sim.markSynced?.();
      return true;
    } catch (err) {
      alert('Fallo guardando: ' + err);
      return false;
    }
  };

  const handleEnviarSalvataje = async () => {
    const ms = sim.mechSlots[sim.currentMechIdx]?.state;
    const ss = sim.mechSlots[sim.currentMechIdx]?.session;
    if (!ms || !ss) return;

    if (!window.confirm(`¿Reclamar ${ms.chassis} ${ms.model} como salvataje en el Hangar?`)) return;

    let cost = 0;
    if (catalog) {
      const match = catalog.mechs.find(m => m.chassis === ms.chassis && m.model === ms.model);
      if (match?.cost) cost = match.cost;
    }
    if (cost === 0) {
      const costStr = window.prompt(`Coste canon no encontrado en catálogo.\nIntroduce el coste base (para calcular futuras reparaciones):`, String(ms.bv * 10000));
      if (costStr) cost = parseInt(costStr, 10) || 0;
    }

    const item = newHangarItem({
      chassis: ms.chassis,
      model: ms.model,
      tons: ms.tonnage,
      bv: ms.bv,
      era: ms.era,
      precioBase: cost,
      fechaCompra: getCampaignDateISO(campaign?.campaignYear, campaign?.campaignMonth),
    });

    const { estadoPct, damagePersist, sessionActiva } = extractDamageFromSession(ms, ss);
    item.estadoPct = estadoPct;
    item.damagePersist = damagePersist;
    item.sessionActiva = sessionActiva;
    if (estadoPct === 0) item.estado = 'destruido';
    else if (estadoPct < 100) item.estado = 'danado';
    else item.estado = 'operativo';

    try {
      await saveHangarItem(item);
      alert(`✅ Salvataje reclamado y añadido al Hangar:\n${ms.chassis} ${ms.model}`);
    } catch (e) {
      alert('❌ Error guardando el salvataje.');
    }
  };

  // Auto-save eliminado a petición del usuario.

  useEffect(() => {
    // Hide portada only when activeSubTab changes after initial mount
    if (prevSubTabRef.current !== null && prevSubTabRef.current !== activeSubTab) {
      setSimuladorPortada(false);
    }
    prevSubTabRef.current = activeSubTab;
  }, [activeSubTab]);

  useEffect(() => {
    const tab = activeSubTab === 'vehiculos' ? 'vehicles' : 'mechs';
    if (tab !== sim.activeTab) sim.setActiveTab(tab as 'mechs' | 'vehicles');
  }, [activeSubTab]);

  // Pilotos disponibles desde roster (Personajes sheet). Disparo/Pilotaje
  // SIEMPRE de cols O/P (disparoMech/pilotajeMech). Sin fallback Barracones
  // para evitar matches cruzados (NPCs leian skills de Castigador).
  const availablePilots = useMemo<AvailablePilot[]>(() => {
    const fromRoster = roster
      .filter(r => r.estado === 'activo' || r.estado === 'herido')
      .map(r => {
        const name = r.apodo || r.nombre || r.jugador;
        if (!name) return null;
        return {
          name,
          gunnery:  r.disparoMech  ?? 4,
          piloting: r.pilotajeMech ?? 5,
        };
      })
      .filter((x): x is AvailablePilot => x !== null);
    const seen = new Set<string>();
    return fromRoster.filter(p => {
      const k = p.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [roster]);

  // Modo campaña: orden FIJO de PJs (CAMPAIGN_PILOT_ORDER). Slot N
  // muestra iniciales 2-letras del jugador (estilo Barracones).
  const campaignPilots = useMemo(() => {
    if (!campaignMode) return null;
    return CAMPAIGN_PILOT_ORDER.map(handle => handle.slice(0, 2).toUpperCase());
  }, [campaignMode]);

  // Lock model swap en modo campaña. Computado pre-early-returns para
  // mantener orden de hooks estable. slotCount aún no calculado aquí —
  // usamos length de hangarBySlot. La vista rebana al slotCount real.
  const lockedSlots = useMemo<boolean[]>(() => {
    if (!campaignMode) return Array(hangarBySlot.length).fill(false);
    return hangarBySlot.map(it => !!it);
  }, [campaignMode, hangarBySlot]);

  // Bloqueo de lectura (después de TODOS los hooks para no violar Rules of Hooks)
  if (!permLoading && !readable) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <div className="font-headline text-lg text-primary-container uppercase tracking-widest">Acceso restringido</div>
          <div className="font-mono text-[11px] text-secondary/60 mt-2">No tienes permisos para ver el Simulador</div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (sim.justResolvedAttack && live.isLive) {
      live.resolveAttack(sim.justResolvedAttack);
      sim.setJustResolvedAttack(null);
    }
  }, [sim.justResolvedAttack, live, sim]);

  const [saveSlotPromiseResolver, setSaveSlotPromiseResolver] = useState<(val: FuerzaSlot | null | 'CANCEL') => void>();

  const requestSaveSlot = async (message?: string): Promise<FuerzaSlot | null | 'CANCEL'> => {
    return new Promise((resolve) => {
      setSaveSlotPromiseResolver(() => resolve);
    });
  };

  const handleToggleCampaign = async () => {
    if (campaignMode) {
      // Salir: pregunta si guardar a FUERZACAMPAÑA
      const choice = confirm('¿Guardar estado actual a FUERZACAMPAÑA antes de salir?\n\nOK = Guardar y salir\nCancelar = Solo salir (sin guardar)');
      if (choice) {
        const ok = await saveCampaignProgress('Campaña');
        if (!ok) return;
      }
      // Limpia el simulador para dejarlo listo para partidas sueltas
      sim.resetSession();
      setCampaignMode(false);
      setHangarBySlot(Array(8).fill(null));
      return;
    }
    // Entrar: pide clave + carga FUERZACAMPAÑA
    if (!gateCampaignWrite('cargar FUERZACAMPAÑA')) return;
    try {
      // Si hay una partida suelta en curso, respaldarla antes de sobrescribir
      const currentSnap = loadLocalSnapshot();
      if (currentSnap && snapshotHasUnits(currentSnap)) {
        const targetSlot = await requestSaveSlot();
        if (targetSlot === 'CANCEL') return;
        if (targetSlot !== null) {
          const bv = (currentSnap.mechSlots ?? []).reduce((a: number, s: any) => a + (s?.state?.bv ?? 0), 0)
                   + (currentSnap.vehicleSlots ?? []).reduce((a: number, s: any) => a + ((s?.state as any)?.bv ?? 0), 0);
          const res = await saveFuerzaConfigSlot(targetSlot as FuerzaSlot, { nombre: 'Partida suelta (Auto)', bv, snapshot: currentSnap });
          if (!res?.success) {
            alert(`Error guardando partida suelta en FUERZA${targetSlot}: ` + ((res as any)?.error || 'no_response'));
          } else {
            alert(`Partida suelta guardada correctamente en FUERZA${targetSlot}.`);
          }
        }
      }

      const entry = await loadFuerzaCampana();
      const loadedMechSlots = entry?.snapshot?.mechSlots ?? [];
      if (entry?.snapshot?.schemaVersion) {
        sim.hydrateFromSnapshot(entry.snapshot);
        sim.markSynced();
      } else {
        // Sin FUERZACAMPAÑA guardada todavía: arranca limpio
        sim.resetSession();
      }

      // Pre-bind: cada slot del simulador recibe el mech del HANGAR asignado
      // al PJ correspondiente. Fuente: collection hangar/ (item.pilotoIdx).
      const BASE = import.meta.env.BASE_URL;
      const hangarRes = await loadHangar();
      const hangarItems: HangarItem[] = Array.isArray(hangarRes.data?.items)
        ? (hangarRes.data!.items as HangarItem[]) : [];
      const newHangarBySlot: (HangarItem | null)[] = Array(8).fill(null);

      for (let i = 0; i < CAMPAIGN_PILOT_ORDER.length; i++) {
        const handle = CAMPAIGN_PILOT_ORDER[i];
        const rosterIdx = roster.findIndex(r => r.jugador.toLowerCase() === handle.toLowerCase());
        if (rosterIdx < 0) continue;
        const item = hangarItems.find(it => it.pilotoIdx === rosterIdx);
        if (!item) continue;
        newHangarBySlot[i] = item;

        // Mech ya cargado en el slot que coincide con el del hangar? saltar.
        const loaded: any = loadedMechSlots[i];
        const loadedName = loaded?.state
          ? `${loaded.state.chassis || ''} ${loaded.state.model || ''}`.trim().toLowerCase()
          : '';
        const expected = `${item.chassis} ${item.model}`.trim().toLowerCase();
        if (loadedName && (loadedName.includes(expected) || expected.includes(loadedName))) continue;

        // Fetch del .ssw — prioriza sourceFile guardado en el item
        const candidates: string[] = [];
        if (item.sourceFile) candidates.push(item.sourceFile);
        candidates.push(`${item.chassis} ${item.model}.ssw`);
        candidates.push(`${item.chassis} ${item.model}.mtf`);

        let text: string | null = null;
        let fname = '';
        for (const fn of candidates) {
          const url = `${BASE}assets/mechs/${encodeURIComponent(fn)}`;
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const body = await res.text();
            const trimmed = body.trimStart().slice(0, 30).toLowerCase();
            if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) continue;
            text = body;
            fname = fn;
            break;
          } catch {/* ignore */}
        }
        if (text) {
          // Cargamos el texto del mech (.ssw) y aplicamos daño si hay (Integración Hangar)
          sim.loadUnitText(text, fname, i, (state, session) => {
            if (item.sessionActiva) {
              applyDamageToSession(session, item);
            }
          });
        } else {
          console.warn(`[Campaign] mech del hangar no encontrado en assets: ${item.chassis} ${item.model} (PJ ${handle})`);
        }
      }

      setHangarBySlot(newHangarBySlot);
      setCampaignMode(true);
    } catch (err) {
      alert('Fallo al cargar FUERZACAMPAÑA: ' + err);
    }
  };

  // Toggles Clan + Año compactos (van pegados a CatalogSearch en el portal)
  const flagToggles = (
    <div className="flex items-center gap-2 mr-1">
      <label
        onClick={() => setAllowClan(v => !v)}
        className="flex items-center gap-1 cursor-pointer group select-none"
        title="Permitir tech Clan"
      >
        <div
          className={`w-2 h-2 border shrink-0 transition-colors ${allowClan ? 'bg-primary-container border-primary-container' : 'bg-transparent border-outline-variant/40'}`}
        />
        <span className="font-mono text-[8px] tracking-widest uppercase text-secondary/60 group-hover:text-secondary">Clan</span>
      </label>
      <label
        onClick={() => setLimitToYear(v => !v)}
        className="flex items-center gap-1 cursor-pointer group select-none"
        title="Limitar al año de campaña"
      >
        <div
          className={`w-2 h-2 border shrink-0 transition-colors ${limitToYear ? 'bg-primary-container border-primary-container' : 'bg-transparent border-outline-variant/40'}`}
        />
        <span className="font-mono text-[8px] tracking-widest uppercase text-secondary/60 group-hover:text-secondary">Año</span>
      </label>
    </div>
  );

  const { mechState: ms, mechSession: ss, vehicleState: vs, vehicleSession: vss } = sim;
  const isMech = sim.activeTab === 'mechs';

  const slotCount = isMech ? sim.mechSlots.length : sim.vehicleSlots.length;
  const activeIdx = isMech ? sim.currentMechIdx : sim.currentVehicleIdx;

  const lockedSlotsForView = isMech ? lockedSlots.slice(0, slotCount) : Array(slotCount).fill(false);
  const activeLocked = lockedSlotsForView[activeIdx] === true;

  const visibleIndices = useMemo(() => {
    const indices: number[] = [];
    if (campaignMode && isMech) {
      for (let i = 0; i < slotCount; i++) {
        if (hangarBySlot[i] || sim.mechSlots[i].state) indices.push(i);
      }
    } else {
      for (let i = 0; i < slotCount; i++) indices.push(i);
    }
    return indices;
  }, [campaignMode, isMech, slotCount, hangarBySlot, sim.mechSlots]);

  if (simuladorPortada) {
    return (
      <div className="p-6 animate-[fadeInUp_0.3s_ease]">
        <SubtabRightPortal>
          {flagToggles}
          <CatalogSearch
            onLoad={(text, file) => { sim.loadUnitText(text, file); setSimuladorPortada(false); }}
            allowClan={allowClan}
            limitToYear={limitToYear}
            onSwitchTab={tab => {
              const subTab = TAB_MAP[tab] ?? tab;
              setActiveSubTab(subTab);
              sim.setActiveTab(tab as 'mechs' | 'vehicles');
              setSimuladorPortada(false);
            }}
          />
        </SubtabRightPortal>
        <SimuladorPortada
          allowClan={allowClan}
          limitToYear={limitToYear}
          onSelectMechs={(clan) => {
            setAllowClan(clan);
            setActiveSubTab('mechs');
            setSimuladorPortada(false);
          }}
          onSelectVehicles={() => {
            setActiveSubTab('vehiculos');
            setSimuladorPortada(false);
          }}
          onSelectInfanteria={() => {
            setActiveSubTab('infanteria');
            setSimuladorPortada(false);
          }}
        />
      </div>
    );
  }

  if (activeSubTab === 'infanteria') {
    return <InfantryView sim={sim} />;
  }

  const slotNames = isMech
    ? sim.mechSlots.map((s, i) => {
        if (campaignPilots && campaignPilots[i]) return campaignPilots[i];
        return s.state ? `${s.state.chassis} ${s.state.model}` : `SLOT ${i + 1}`;
      })
    : sim.vehicleSlots.map((s, i) => s.state ? s.state.name : `SLOT ${i + 1}`);

  const blockMsg = (i: number) => {
    const h = hangarBySlot[i];
    return `Slot ${i + 1} bloqueado en modo campaña.\n\nEl hangar asigna "${h?.chassis} ${h?.model}" a este PJ.\nPara cambiarlo edita la asignación en /hangar (Inventario) o desactiva modo campaña.`;
  };

  const guardedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeLocked) {
      alert(blockMsg(activeIdx));
      e.target.value = '';
      return;
    }
    sim.handleFileUpload(e);
  };

  const guardedLoadUnitText = (text: string, file: string) => {
    if (activeLocked) {
      alert(blockMsg(activeIdx));
      return;
    }
    sim.loadUnitText(text, file);
  };

  return (
    <div className="p-6 animate-[fadeInUp_0.3s_ease]">
      {/* Componentes Live / Radar */}
      <IncomingAttacks sim={sim} live={live} />

      {sim.endTurnSummary && (
        <EndTurnSummaryModal
          summary={sim.endTurnSummary.summary}
          onConfirm={sim.confirmNextTurn}
        />
      )}

      {sim.globalEndTurnSummary && (
        <GlobalEndTurnSummaryModal
          mechUpdates={sim.globalEndTurnSummary.mechUpdates}
          vehicleUpdates={sim.globalEndTurnSummary.vehicleUpdates}
          onConfirm={sim.confirmGlobalNextTurn}
          onCancel={() => sim.setGlobalEndTurnSummary(null)}
        />
      )}

      <FireControlModal 
        isOpen={isFireModalOpen} 
        onClose={() => setIsFireModalOpen(false)} 
        sim={sim} 
        live={live} 
      />

      {/* Subtab right-slot: flags + search + slot picker + sync */}
      <SubtabRightPortal>
        <ComputadoraCombate sim={sim} live={live} />
        {flagToggles}
        <CatalogSearch
          onLoad={guardedLoadUnitText}
          allowClan={allowClan}
          limitToYear={limitToYear}
          onSwitchTab={tab => {
            const subTab = TAB_MAP[tab] ?? tab;
            setActiveSubTab(subTab);
            sim.setActiveTab(tab as 'mechs' | 'vehicles');
          }}
        />
        <UnitSlots
          slotNames={slotNames}
          slotCount={slotCount}
          activeIndex={activeIdx}
          onSelectIndex={i => isMech ? sim.setCurrentMechIdx(i) : sim.setCurrentVehicleIdx(i)}
          onFileUpload={guardedFileUpload}
          shortLabels={campaignPilots ?? undefined}
          lockedSlots={lockedSlotsForView}
          visibleIndices={visibleIndices}
          // onAddSlot={!campaignMode ? (isMech ? sim.addMechSlot : sim.addVehicleSlot) : undefined}
          maxSlots={12}
        />
        <FuerzaSyncBar
          dirty={sim.dirty}
          lastLocalSave={sim.lastLocalSave}
          getSnapshot={sim.getSnapshot}
          hydrateFromSnapshot={sim.hydrateFromSnapshot}
          clearCurrentUnit={sim.clearCurrentUnit}
          markSynced={sim.markSynced}
          campaignMode={campaignMode}
          onToggleCampaignMode={handleToggleCampaign}
          onSaveCampaign={campaignMode ? () => saveCampaignProgress('Campaña') : undefined}
          onRequestSaveSlot={requestSaveSlot}
          bvTotal={
            sim.mechSlots.reduce((acc, s) => acc + (s.state?.bv ?? 0), 0) +
            sim.vehicleSlots.reduce((acc, s) => acc + ((s.state as any)?.bv ?? 0), 0)
          }
        />
      </SubtabRightPortal>

      {!sim.isLoaded ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 opacity-40">
          <span className="text-5xl">{isMech ? '🤖' : '🚛'}</span>
          <span className="font-mono text-[11px] text-outline tracking-[2px] uppercase">
            Busca en el catálogo o carga un archivo {isMech ? '.ssw / .mtf' : '.saw'}
          </span>
        </div>
      ) : isMech && ms && ss ? (
        /* ── MECH LAYOUT ── */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 pb-20 max-w-7xl mx-auto px-2 md:px-0">
          {/* Left: Pilot + Fire + Heat */}
          <div className="col-span-1 md:col-span-3 space-y-4">
            <PilotPanel
              state={ms}
              session={ss}
              gunneryTotal={sim.gunneryTotal}
              pilotingTotal={sim.pilotingTotal}
              sysHits={sim.sysHits}
              effectiveWalkMP={sim.effectiveWalkMP}
              effectiveRunMP={sim.effectiveRunMP}
              effectiveJumpMP={sim.effectiveJumpMP}
              availablePilots={availablePilots}
              onSetPilot={sim.setPilot}
              onSetWounds={sim.setWounds}
              onSetMoveMode={sim.setMoveMode}
              onSetJumpUsed={sim.setJumpUsed}
              onLoadPilot={p => sim.setPilotFull(p.name, p.gunnery, p.piloting)}
              onOpenTaller={() => setTallerSlotIdx(sim.currentMechIdx)}
              onHandleDestruction={() => setDestroyedModalOpen(true)}
            />

            <button
              onClick={() => setIsFireModalOpen(true)}
              disabled={ss.destroyed || Object.keys(ss.activeShots).length === 0}
              className="w-full bg-error hover:bg-error/80 disabled:opacity-30 disabled:cursor-not-allowed border border-error text-on-error font-headline font-bold uppercase tracking-widest py-4 clip-chamfer transition-all flex items-center justify-center gap-2 mb-2"
            >
              <Crosshair size={20} /> Fijar Blancos y Disparar
            </button>

            {sim.isSimultaneousCombat ? (
              <button
                onClick={sim.handleGlobalFire}
                className="w-full bg-amber-500/20 hover:bg-amber-500/40 disabled:opacity-30 disabled:cursor-not-allowed border border-amber-500 text-amber-500 font-headline font-bold uppercase tracking-widest py-4 clip-chamfer transition-all flex items-center justify-center gap-2 mb-2"
              >
                <RotateCcw size={20} /> Fin de Turno Global
              </button>
            ) : (
              <button
                onClick={sim.handleFire}
                disabled={!sim.canMechFire || ss.destroyed}
                className="w-full bg-error/20 hover:bg-error/40 disabled:opacity-30 disabled:cursor-not-allowed border border-error text-error font-headline font-bold uppercase tracking-widest py-4 clip-chamfer transition-all flex items-center justify-center gap-2 mb-2"
              >
                <RotateCcw size={20} /> {ss.destroyed ? 'DESTRUIDO' : 'Fin Turno (Éste)'}
              </button>
            )}

            <HeatMonitor state={ms} session={ss} onAdjustHeat={sim.adjustHeat} />

            {(!hangarBySlot[sim.currentMechIdx]) && (
              <div className="bg-surface-container-low p-3 clip-chamfer border-l-2 border-primary-container/30 mt-4">
                <button
                  onClick={handleEnviarSalvataje}
                  className="w-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-primary-container font-mono text-xs uppercase tracking-widest py-2 clip-chamfer transition-all flex items-center justify-center gap-2"
                >
                  <Download size={14} /> Reclamar Salvataje
                </button>
                <p className="text-[9px] text-secondary/60 text-center mt-2 font-mono uppercase tracking-widest">
                  Envía el mech y su daño al Hangar
                </p>
              </div>
            )}
          </div>

          {/* Center: Armor Diagram */}
          <div className="col-span-1 md:col-span-6">
            <ArmorDiagram
              state={ms}
              session={ss}
              selectedSection={sim.selectedSection}
              damageAmount={sim.damageAmount}
              setDamageAmount={sim.setDamageAmount}
              onSectionClick={s => sim.setSelectedSection(s === sim.selectedSection ? null : s)}
              onApplyDamage={sim.applyDamageToSelected}
              setSelectedSection={sim.setSelectedSection}
              onForceRevive={sim.forceReviveMech}
              onAdjustAmmo={sim.adjustAmmo}
            />
          </div>

          {/* Right: Weapons + Log */}
          <div className="col-span-1 md:col-span-3 space-y-4">
            {/* Weapons */}
            <section className="bg-surface-container-low p-4 clip-chamfer border-l-2 border-primary-container/30">
              <h2 className="font-headline text-sm font-bold text-primary-container tracking-widest uppercase mb-3">
                Armas
              </h2>
              <div className="space-y-1">
                {ms.weapons.length === 0 ? (
                  <div className="font-mono text-[10px] text-secondary/40 italic py-4 text-center">Sin armas</div>
                ) : ms.weapons.map(w => {
                  const isActive = ss.activeShots[w.id] || false;
                  const isDestroyed = w.slotIndices?.length > 0 && w.slotIndices.every(idx => ss.crits[w.loc]?.[idx]?.hit);
                  const wFam = w.ammoFamilyKey.split(':').slice(2).join(':') || w.ammoFamilyKey;
                  const noAmmo = w.usesAmmo && !ss.ammoBins.some(b => (b.familyKey.split(':').slice(2).join(':') || b.familyKey) === wFam && b.current >= w.ammoUse);
                  const baseArmMod = (w.loc === 'LA' || w.loc === 'RA') ? sim.armActuatorMod[w.loc] : 0;
                  // critMods manuales en slots de actuador del brazo → aplica a TODAS armas del brazo (igual que armMod).
                  const ACTUATOR_NAMES = ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 'Hand Actuator'];
                  const actuatorCritMod = (w.loc === 'LA' || w.loc === 'RA')
                    ? (ss.crits?.[w.loc] ?? []).reduce((sum, slot, idx) => {
                        if (!slot || !ACTUATOR_NAMES.includes(slot.name)) return sum;
                        const m = ss.critMods?.[`${w.loc}:${idx}`];
                        return sum + (m?.atk ?? 0);
                      }, 0)
                    : 0;
                  const armMod = baseArmMod + actuatorCritMod;
                  const wMod = ss.weaponMods?.[w.id] || { heat: 0, atk: 0 };
                  // critMod per-arma: solo los slots de esta arma cuentan.
                  const slotCritMod = (w.slotIndices ?? []).reduce((acc, idx) => {
                    const m = ss.critMods?.[`${w.loc}:${idx}`];
                    return m ? { heat: acc.heat + (m.heat || 0), atk: acc.atk + (m.atk || 0) } : acc;
                  }, { heat: 0, atk: 0 });
                  const weaponToHit = sim.gunneryTotal + armMod + wMod.atk + slotCritMod.atk;
                  const effectiveHeat = w.heat + wMod.heat + slotCritMod.heat;

                  return (
                    <div key={w.id}
                      className={`flex items-center justify-between p-2 transition-all text-[10px] font-mono border-l-2 ${
                        isDestroyed ? 'opacity-20 border-error line-through'
                        : isActive ? 'bg-error/20 border-error text-error'
                        : noAmmo ? 'opacity-40 border-outline-variant'
                        : (wMod.heat > 0 || wMod.atk > 0) ? 'border-amber-400/60 text-secondary'
                        : 'border-transparent hover:bg-secondary/10 text-secondary'
                      }`}
                    >
                      <div
                        onClick={() => !isDestroyed && sim.toggleWeapon(w.id)}
                        className={`flex flex-col flex-1 ${!isDestroyed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      >
                        <span className="font-bold uppercase">{w.name}</span>
                        <span className="text-[8px] text-secondary/40">{w.loc} • {w.r}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px]">
                        <span>
                          🔥{effectiveHeat}
                          {(wMod.heat > 0 || slotCritMod.heat > 0) && (
                            <span className="text-amber-400/80"> (+{wMod.heat + slotCritMod.heat})</span>
                          )}
                        </span>
                        <span>💥{w.dmg}</span>
                        {!isDestroyed && (
                          <span
                            className="text-secondary/60"
                            title="Total para impactar (Habilidad + modificadores de movimiento/calor del piloto no incluidos)"
                          >
                            🎯{weaponToHit}+
                          </span>
                        )}
                        {armMod > 0 && !isDestroyed && (
                          <span
                            className="text-amber-400/80"
                            title={`Actuador brazo: +${armMod} a impacto (afecta todas las armas del brazo)${actuatorCritMod > 0 ? ` — incluye +${actuatorCritMod} de mod manual en actuador` : ''}`}
                          >+{armMod}🦾</span>
                        )}
                        {wMod.atk > 0 && (
                          <span className="text-amber-400/80" title={`Dificultad extra (mod arma): +${wMod.atk}`}>+{wMod.atk}⚠</span>
                        )}
                        {slotCritMod.atk > 0 && (
                          <span className="text-amber-400/80" title={`Crítico en slot del arma: +${slotCritMod.atk} a impacto`}>+{slotCritMod.atk}💢</span>
                        )}
                        {w.usesAmmo && (
                          <span className={noAmmo ? 'text-error' : ''}>
                            {ss.ammoBins.filter(b => (b.familyKey.split(':').slice(2).join(':') || b.familyKey) === wFam).reduce((sum, b) => sum + b.current, 0)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <CombatLog logs={ss.logs} onReset={sim.resetLog} />
          </div>

          {/* Bottom: Critical Matrix */}
          <div className="col-span-1 md:col-span-12">
            <CriticalMatrix
              state={ms}
              session={ss}
              onToggleCrit={sim.toggleCrit}
              sysHits={sim.sysHits}
              onAdjustComponent={(loc, slotIdx, name) => {
                const mod = ss.critMods?.[`${loc}:${slotIdx}`] || { heat: 0, atk: 0 };
                setAdjustTarget({ kind: 'crit', loc, slotIdx, label: `${loc} / ${name}`, heat: mod.heat, atk: mod.atk });
              }}
            />
          </div>
        </div>
      ) : vs && vss ? (
        /* ── VEHICLE LAYOUT ── */
        <VehiclePanel
          state={vs}
          session={vss}
          selectedSection={sim.selectedSection}
          damageAmount={sim.damageAmount}
          setDamageAmount={sim.setDamageAmount}
          onSectionClick={s => sim.setSelectedSection(s === sim.selectedSection ? null : s)}
          setSelectedSection={sim.setSelectedSection}
          onApplyDamage={sim.vehicleApplyDamageToSelected}
          onToggleWeapon={sim.vehicleToggleWeapon}
          onNextTurn={sim.isSimultaneousCombat ? sim.handleGlobalFire : sim.vehicleHandleFire}
          isSimultaneousCombat={sim.isSimultaneousCombat}
          onToggleCrit={sim.vehicleToggleCrit}
          onSetMoveMode={sim.vehicleSetMoveMode}
          onSetMotive={sim.vehicleSetMotive}
          onSetPilot={sim.vehicleSetPilot}
          onApplyCritEffect={sim.vehicleApplyCritEffect}
          onAdjustPendingCrit={sim.vehicleAdjustPendingCrit}
        />
      ) : null}

      {tallerSlotIdx !== null && (
        <TallerModal
          campaignDate={getCampaignDateISO(campaign?.campaignYear, campaign?.campaignMonth)}
          initialSimSlotIdx={tallerSlotIdx}
          onClose={() => setTallerSlotIdx(null)}
          onRestore={() => {
            // restoreMechSlotFull ya actualizó localStorage; rehidratamos el estado en RAM
            const snap = loadLocalSnapshot();
            if (snap) sim.hydrateFromSnapshot(snap);
            // En modo campaña, guarda automáticamente el progreso tras reparar
            if (campaignMode && isCampaignUnlocked()) {
              saveCampaignProgress('Campaña auto').catch(err =>
                console.warn('[Taller] auto-save tras reparación fallo', err));
            }
          }}
          onCommit={async (total, concepto, mechName) => {
            await commitLibroEntryAndTreasury({
              id: genId('lm'),
              fecha: getCampaignDateISO(campaign?.campaignYear, campaign?.campaignMonth),
              concepto,
              cantidad: Math.round(total),
              tipo: 'gasto',
              categoria: 'repuestos',
              nota: `Reparación ${mechName} · Taller`,
              jugador: '',
            });
            setTallerSlotIdx(null);
          }}
        />
      )}

      {destroyedModalOpen && ms && (() => {
        const fullName = `${ms.chassis} ${ms.model}`.toLowerCase().trim();
        // Owner: roster entry cuyo mech matchea (substring) con el nombre destruido.
        const owner = roster.find(r => {
          const rm = (r.mech || '').toLowerCase().trim();
          if (!rm) return false;
          return rm === fullName || fullName.includes(rm) || rm.includes(ms.chassis.toLowerCase());
        });
        const closeModal = () => { setDestroyedModalOpen(false); setDestroyedBusy(false); };
        const handleClearSim = () => {
          sim.clearCurrentUnit();
          closeModal();
        };
        const handleDeleteFromUnit = async () => {
          if (!owner) return;
          if (!confirm(`Borrar el mech ${ms.chassis} ${ms.model} de ${owner.nombre || owner.jugador} (sheet Personajes)?\n\nNo se puede deshacer.`)) return;
          setDestroyedBusy(true);
          const res = await removeMechFromUnit(owner.jugador || owner.nombre);
          if (!res?.success) {
            alert('Error: ' + ((res as any)?.error || 'no_response'));
            setDestroyedBusy(false);
            return;
          }
          // Limpia el slot del mech destruido en el simulador
          sim.clearCurrentUnit();
          // Refresca roster (Unidad AE actualizada -> Personajes Q recalcula)
          try { const fresh = await loadRoster(); setRoster(fresh); } catch {/* ignore */}
          // Auto-guarda FUERZA5 + ESTADOMECHS con el estado limpio
          try {
            await saveCampaignProgress('Campaña auto');
          } catch (err) {
            console.warn('[destruction] auto-save FUERZA5/ESTADOMECHS fallo', err);
          }
          closeModal();
        };
        return (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={closeModal}>
            <div className="bg-surface-container border border-error/60 clip-chamfer p-5 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h3 className="font-headline text-base text-error font-bold uppercase tracking-widest mb-3">
                Mech destruido
              </h3>
              <div className="font-mono text-[11px] text-secondary mb-4">
                <div className="text-primary-container font-bold">{ms.chassis} {ms.model}</div>
                <div className="text-[10px] text-secondary/60 mt-1">{ss?.destroyedReason}</div>
                {owner ? (
                  <div className="mt-3 px-2 py-1 bg-amber-400/10 border border-amber-400/40 text-amber-400 text-[10px] uppercase">
                    Pertenece a la unidad — Piloto: {owner.nombre || owner.jugador}
                  </div>
                ) : (
                  <div className="mt-3 px-2 py-1 bg-secondary/10 border border-outline-variant/40 text-secondary/70 text-[10px] uppercase">
                    No vinculado a piloto en roster
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleClearSim}
                  disabled={destroyedBusy}
                  className="w-full px-3 py-2 border border-secondary/40 hover:border-secondary hover:bg-secondary/10 text-secondary font-mono text-[10px] uppercase tracking-widest transition-colors disabled:opacity-40"
                >Borrar solo del simulador</button>

                {owner && (
                  <button
                    onClick={handleDeleteFromUnit}
                    disabled={destroyedBusy}
                    className="w-full px-3 py-2 border border-error/60 hover:border-error hover:bg-error/20 text-error font-mono text-[10px] uppercase tracking-widest font-bold transition-colors disabled:opacity-40"
                  >{destroyedBusy ? 'Borrando…' : 'Borrar de la unidad (roster + sheet)'}</button>
                )}

                <button
                  onClick={closeModal}
                  disabled={destroyedBusy}
                  className="w-full px-3 py-2 border border-outline-variant/40 hover:border-outline-variant text-secondary/60 hover:text-secondary font-mono text-[10px] uppercase tracking-widest transition-colors disabled:opacity-40"
                >Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal ajuste manual calor/dificultad — armas y componentes */}
      {adjustTarget && (
        <AdjustModModal
          target={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onChangeHeat={(v) => {
            if (adjustTarget.kind === 'weapon') sim.setWeaponMod(adjustTarget.id, 'heat', v);
            else sim.setCritMod(adjustTarget.loc, adjustTarget.slotIdx, 'heat', v);
            setAdjustTarget((t: any) => t ? { ...t, heat: v } : t);
          }}
          onChangeAtk={(v) => {
            if (adjustTarget.kind === 'weapon') sim.setWeaponMod(adjustTarget.id, 'atk', v);
            else sim.setCritMod(adjustTarget.loc, adjustTarget.slotIdx, 'atk', v);
            setAdjustTarget((t: any) => t ? { ...t, atk: v } : t);
          }}
        />
      )}

      {/* Modal para elegir dónde guardar antes de salir/cargar */}
      <SaveSlotModal
        isOpen={!!saveSlotPromiseResolver}
        onClose={() => {
          saveSlotPromiseResolver?.('CANCEL');
          setSaveSlotPromiseResolver(undefined);
        }}
        onSelectSlot={(slot) => {
          saveSlotPromiseResolver?.(slot);
          setSaveSlotPromiseResolver(undefined);
        }}
      />
    </div>
  );
}

// ── Infantry sub-page ──────────────────────────────────────────────────────
type SimHandle = ReturnType<typeof useSimulador>;

function InfantryView({ sim }: { sim: SimHandle }) {
  const [infTab, setInfTab] = useState<'convencional' | 'ba'>('convencional');

  const targets = useMemo<FireTarget[]>(() => {
    const t: FireTarget[] = [];
    sim.mechSlots.forEach((s, i) => {
      if (s.state && s.session && !s.session.destroyed)
        t.push({ type: 'mech', slotIdx: i, label: `${s.state.chassis} ${s.state.model}` });
    });
    sim.vehicleSlots.forEach((s, i) => {
      if (s.state && s.session && !s.session.destroyed)
        t.push({ type: 'vehicle', slotIdx: i, label: s.state.name });
    });
    sim.infantrySlots.forEach((s, i) => {
      if (s.state && s.session && !s.session.destroyed)
        t.push({ type: 'inf', slotIdx: i, label: s.state.name });
    });
    sim.baSlots.forEach((s, i) => {
      if (s.state && s.session && !s.session.destroyed)
        t.push({ type: 'ba', slotIdx: i, label: s.state.name });
    });
    return t;
  }, [sim.mechSlots, sim.vehicleSlots, sim.infantrySlots, sim.baSlots]);

  return (
    <div className="p-6 animate-[fadeInUp_0.3s_ease]">
      {/* Sub-tab selector */}
      <div className="flex gap-2 mb-6">
        {(['convencional', 'ba'] as const).map(t => (
          <button
            key={t}
            onClick={() => setInfTab(t)}
            className={`font-mono text-[10px] tracking-widest uppercase px-4 py-1.5 border clip-chamfer transition-colors ${
              infTab === t
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-outline-variant/40 text-outline hover:border-primary hover:text-primary'
            }`}
          >
            {t === 'convencional' ? 'Convencional' : 'Battle Armor'}
          </button>
        ))}
      </div>

      {infTab === 'convencional' ? (
        <div className="space-y-4">
          <InfantrySlots
            slots={sim.infantrySlots}
            activeIdx={sim.activeInfantryIdx}
            onSelect={sim.setActiveInfantryIdx}
            onAssign={sim.assignInfantry}
            onClear={sim.clearInfantry}
          />
          <InfantryPanel
            slot={sim.infantrySlots[sim.activeInfantryIdx]}
            targets={targets}
            onFireAt={(rb, tgt) => sim.infantryFireAtAction(sim.activeInfantryIdx, rb, tgt)}
            onNextTurn={() => sim.infantryNextTurnAction(sim.activeInfantryIdx)}
            onDirectLoss={loss => sim.infantryDirectLossAction(sim.activeInfantryIdx, loss)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <BASlots
            slots={sim.baSlots}
            activeIdx={sim.activeBAIdx}
            onSelect={sim.setActiveBAIdx}
            onAssign={sim.assignBA}
            onClear={sim.clearBA}
          />
          <BAPanel
            slot={sim.baSlots[sim.activeBAIdx]}
            targets={targets}
            onFireWeaponAt={(wId, rb, tgt) => sim.baFireAtAction(sim.activeBAIdx, wId, rb, tgt)}
            onNextTurn={() => sim.baNextTurnAction(sim.activeBAIdx)}
            onApplyDamage={(suit, amt) => sim.baApplyDamageAction(sim.activeBAIdx, suit, amt, {})}
          />
        </div>
      )}
    </div>
  );
}
