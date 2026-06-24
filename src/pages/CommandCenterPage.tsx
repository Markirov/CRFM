import React, { useState } from 'react';
import { 
  Crosshair, User, Wrench, Shield, Zap, TrendingUp, 
  Map, BarChart2, Activity, Settings, AlertTriangle, 
  Target, Cpu, Battery, Hexagon, ShoppingCart
} from 'lucide-react';
import { AdminPanel } from '../components/CommandCenter/AdminPanel';
import { DesktopBarracones } from '../components/CommandCenter/DesktopBarracones';
import { DesktopContratos } from '../components/CommandCenter/DesktopContratos';
import { DesktopFinanzas } from '../components/CommandCenter/DesktopFinanzas';
import { DesktopHangar } from '../components/CommandCenter/DesktopHangar';
import { DesktopInteligencia } from '../components/CommandCenter/DesktopInteligencia';
import { DesktopOperaciones } from '../components/CommandCenter/DesktopOperaciones';
import { DesktopMercado } from '../components/CommandCenter/DesktopMercado';
import { DesktopTaller } from '../components/CommandCenter/DesktopTaller';
import { useAppStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';

// --- MOCK DATA ---
const CONTRACTS = [
  { id: 'c1', faction: 'Casa Davion', type: 'Asalto', payout: '2,500,000', difficulty: 'Alta' },
  { id: 'c2', faction: 'Magistrado', type: 'Escolta', payout: '850,000', difficulty: 'Baja' },
  { id: 'c3', faction: 'ComStar', type: 'Recuperación', payout: '1,200,000', difficulty: 'Media' },
];

const MARKET_MECHS = [
  { name: 'Locust LCT-1V', weight: 20, price: '1,500K' },
  { name: 'Shadow Hawk', weight: 55, price: '4,200K' },
  { name: 'Warhammer', weight: 70, price: '6,100K' },
  { name: 'Atlas AS7-D', weight: 100, price: '14,000K' },
];

// --- COMPONENTES AUXILIARES Gamificados ---

const HexTab = ({ children, isGroup }: { children: React.ReactNode, isGroup?: boolean }) => (
  <div className={`relative w-8 h-8 flex items-center justify-center bg-orange-600/80 ${isGroup ? 'group-hover:bg-orange-400 transition-colors shadow-[0_0_10px_rgba(234,88,12,0.5)]' : ''}`} style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)' }}>
    <div className="absolute inset-[1px] bg-[#120500]/80 backdrop-blur-md shadow-[inset_0_0_8px_rgba(234,88,12,0.3)] flex items-center justify-center" style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)' }}>
      {children}
    </div>
  </div>
);

const TitleTab = ({ title, isGroup }: { title: string, isGroup?: boolean }) => (
  <div className={`relative flex-1 h-8 bg-orange-600/80 ${isGroup ? 'group-hover:bg-orange-400 transition-colors shadow-[0_0_10px_rgba(234,88,12,0.5)]' : ''}`} style={{ clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}>
    <div className="absolute inset-[1px] bottom-0 bg-[#120500]/80 backdrop-blur-md shadow-[inset_0_0_8px_rgba(234,88,12,0.3)] flex items-center justify-center" style={{ clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}>
      <span className="text-orange-200 font-teko text-[22px] tracking-widest uppercase pt-1 drop-shadow-[0_0_5px_rgba(234,88,12,0.8)]">{title}</span>
    </div>
  </div>
);

const ContentBox = ({ children, isGroup }: { children: React.ReactNode, isGroup?: boolean }) => (
  <div className={`relative flex-1 bg-orange-600/60 transition-colors ${isGroup ? 'group-hover:bg-orange-400/80 shadow-[0_0_15px_rgba(234,88,12,0.3)]' : ''}`} style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px))' }}>
    <div className="absolute inset-[1px] bg-[#000810]/40 backdrop-blur-md shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] flex flex-col" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px))' }}>
      <div className="flex-1 overflow-auto p-3 custom-scrollbar relative z-0">
        {children}
      </div>
    </div>
  </div>
);

const Panel = ({ title, num, children, className = "", onClick }: { title: string, num: number, children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div onClick={onClick} className={`flex flex-col gap-[2px] ${onClick ? 'cursor-pointer group' : ''} ${className}`}>
    <div className="flex items-end gap-[2px]">
      <HexTab isGroup={!!onClick}><span className="text-orange-200 font-teko text-xl font-bold pt-1">{num}</span></HexTab>
      <TitleTab isGroup={!!onClick} title={title} />
    </div>
    <ContentBox isGroup={!!onClick}>
      {children}
    </ContentBox>
  </div>
);

const BarChartMock = () => {
  const bars = [40, 60, 30, 80, 50, 90, 45, 70, 85, 30, 55, 75];
  return (
    <div className="flex items-end gap-[2px] h-20 w-full mt-2 border-b border-l border-slate-700 pb-1 pl-1">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end group">
          <div 
            className={`w-full transition-all duration-300 ${i % 3 === 0 ? 'bg-orange-500' : 'bg-cyan-600 group-hover:bg-cyan-400'}`} 
            style={{ height: `${h}%` }}
          />
        </div>
      ))}
    </div>
  );
};

const MechWireframe = () => (
  <div className="flex flex-col items-center justify-center h-full scale-90">
    <div className="w-8 h-8 border border-cyan-500 bg-cyan-900/30 rounded-t-lg mb-1" />
    <div className="flex gap-1 mb-1">
      <div className="w-8 h-20 border border-orange-500 bg-orange-900/30 rounded-l-lg" />
      <div className="w-16 h-24 border-2 border-cyan-400 bg-cyan-900/20 relative">
        <div className="absolute inset-2 border border-cyan-500/50" />
      </div>
      <div className="w-8 h-20 border border-cyan-500 bg-cyan-900/30 rounded-r-lg" />
    </div>
    <div className="flex gap-2">
      <div className="w-7 h-24 border border-cyan-500 bg-cyan-900/30" />
      <div className="w-7 h-24 border border-cyan-500 bg-cyan-900/30" />
    </div>
  </div>
);

export function CommandCenterPage() {
  const campaign = useAppStore(s => s.campaign);
  const roster = useAppStore(s => s.roster);
  const [selectedMech, setSelectedMech] = useState('Marauder MAD-3R');
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeModule, setActiveModule] = useState<'home' | 'barracones' | 'taller' | 'contratos' | 'finanzas' | 'mercado' | 'hangar' | 'inteligencia' | 'operaciones'>('home');
  const navigate = useNavigate();

  // Month names
  const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  const currentMonth = meses[(campaign.campaignMonth || 1) - 1] || "ENE";

  return (
    <div className="min-h-screen bg-black text-slate-300 font-sans p-2 flex flex-col overflow-hidden relative" 
         style={{ backgroundImage: 'url(/hangar-default.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-[#000810]/70 pointer-events-none"></div>
      
      {/* Estilos globales para la barra de desplazamiento y grid */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-left: 1px solid rgba(234,88,12,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(234,88,12,0.5); border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(234,88,12,0.8); }
        .scanlines { background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2)); background-size: 100% 4px; }
      `}} />

      {/* HEADER PRINCIPAL */}
      <header className="flex flex-col items-center mb-4 relative z-10 w-full cursor-pointer group px-2" onClick={() => setShowAdmin(true)}>
        <div className="absolute top-0 left-0 w-full h-full scanlines pointer-events-none opacity-30"></div>
        <div className="relative w-full max-w-[1200px] mx-auto h-[4.5rem] bg-orange-600 group-hover:bg-orange-400 transition-colors shadow-[0_0_20px_rgba(234,88,12,0.3)]" style={{ clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)' }}>
          <div className="absolute inset-[2px] bg-[#120500] flex flex-col items-center justify-center" style={{ clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)' }}>
             <h1 className="text-orange-200 font-teko text-2xl md:text-3xl tracking-widest uppercase mt-1 drop-shadow-[0_0_8px_rgba(234,88,12,0.8)]">
               UNIDAD MERCENARIA: "{campaign.unitName || 'LOS GATOS DE GUERRA'}" - CENTRO DE MANDO CENTRAL
             </h1>
             <div className="flex items-center gap-4 font-teko text-lg text-orange-400 tracking-wide mt-[-4px]">
               <span>FECHA STARDATE: 12 {currentMonth} {campaign.campaignYear}</span>
               <span>-</span>
               <span className="text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">ESTADO DE LA UNIDAD: OPERATIVO</span>
               {activeModule !== 'home' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveModule('home'); }}
                    className="ml-4 px-3 py-0 bg-red-900/40 border border-red-500 text-red-200 hover:bg-red-500 hover:text-white transition-colors uppercase text-sm leading-tight"
                  >
                    Cerrar Módulo
                  </button>
               )}
             </div>
          </div>
        </div>
      </header>

      {/* GRID PRINCIPAL DE PANELES */}
      {/* 3 Columnas: Izquierda (25%), Centro (50%), Derecha (25%) */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-6 overflow-hidden px-2 pb-2">
        
        {/* ================= COLUMNA IZQUIERDA ================= */}
        <div className="col-span-1 md:col-span-3 flex flex-col gap-6 overflow-hidden z-10">
          
          {/* 1. Barracones */}
          <Panel num={1} title="Barracones (Personal)" className="flex-[1.5]" onClick={() => setActiveModule('barracones')}>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {roster.slice(0, 8).map((pilot, i) => {
                const PILOT_PICS = ['/pilot-alex.png', '/pilot-erik.png', '/pilot-jaime.png', '/pilot-joan.png', '/pilot-marcos.png', '/pilot-zhao.png'];
                return (
                <div key={pilot.nombre} className="border border-slate-700 bg-slate-900/50 p-1 relative group hover:border-cyan-500/50 transition-colors cursor-pointer flex flex-col items-center">
                  <div className="w-12 h-14 bg-slate-800 border border-slate-600 mb-1 flex items-center justify-center overflow-hidden rounded-sm">
                    <img src={PILOT_PICS[i % PILOT_PICS.length]} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Pilot" />
                  </div>
                  <div className="text-[11px] text-green-400 font-mono mt-[-10px] bg-black px-1 border border-green-500 z-10">{pilot.disparoMech || '5'}/{pilot.pilotajeMech || '6'}</div>
                </div>
                );
              })}
            </div>
          </Panel>

          {/* 2. Inteligencia y Archivos */}
          <Panel num={2} title="Inteligencia" className="flex-[1.2]" onClick={() => setActiveModule('inteligencia')}>
            <div className="flex flex-col gap-2 h-full justify-center px-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border border-green-500 bg-green-900/40 flex items-center justify-center text-[10px] text-green-400">R1</div>
                <div className="h-px bg-green-800 flex-1"></div>
                <div className="w-6 h-6 border border-cyan-500 bg-cyan-900/40 flex items-center justify-center text-[10px] text-cyan-400">W1</div>
                <div className="h-px bg-slate-800 flex-1"></div>
                <div className="w-6 h-6 border border-slate-700 flex items-center justify-center text-[10px] text-slate-600">A1</div>
              </div>
              <div className="flex items-center gap-2 pl-8">
                <div className="w-px h-6 bg-green-800 ml-3"></div>
              </div>
              <div className="flex items-center gap-2 pl-8">
                <div className="w-6 h-6 border border-green-500 bg-green-900/40 flex items-center justify-center text-[10px] text-green-400">M1</div>
                <div className="h-px bg-slate-800 w-4"></div>
                <div className="w-6 h-6 border border-slate-700 flex items-center justify-center text-[10px] text-slate-600">C1</div>
              </div>
            </div>
          </Panel>

          {/* 3. Operaciones */}
          <Panel num={3} title="Operaciones" className="flex-[1.5]" onClick={() => setActiveModule('operaciones')}>
             {/* Mockup de un grid hexagonal usando CSS */}
             <div className="relative w-full h-full bg-[#051010] overflow-hidden flex items-center justify-center border border-cyan-900/30">
               <div className="absolute inset-0 opacity-20" 
                    style={{ backgroundImage: 'radial-gradient(circle, #00ffff 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
               <div className="grid grid-cols-4 gap-1 transform rotate-6 scale-110">
                 {[...Array(12)].map((_, i) => (
                    <div key={i} className={`w-8 h-10 border ${i===5 ? 'border-orange-500 bg-orange-900/50' : i===8 ? 'border-red-500 bg-red-900/50' : 'border-cyan-800/50'} flex items-center justify-center`} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}}>
                      {(i === 5 || i === 8) && <Target className={`w-4 h-4 ${i===5 ? 'text-orange-400' : 'text-red-500'}`} />}
                    </div>
                 ))}
               </div>
             </div>
          </Panel>

        </div>

        {/* ================= COLUMNA CENTRAL ================= */}
        <div className="col-span-1 md:col-span-6 flex flex-col gap-6 overflow-hidden relative">
          
          {/* VIEWPORT PRINCIPAL DEL HANGAR ESTÁTICO (SIEMPRE VISIBLE) */}
          <div className="flex-[2] bg-[#050f14]/40 border-2 border-cyan-800/60 relative rounded-sm overflow-hidden flex flex-col shadow-[inset_0_0_50px_rgba(6,182,212,0.2)] cursor-pointer hover:border-cyan-500/80 transition-colors backdrop-blur-sm" onClick={() => setActiveModule('hangar')}>
            <div className="absolute top-0 left-0 w-full h-full scanlines pointer-events-none z-20"></div>
            {/* Esquinas marco */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/50 z-30 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/50 z-30 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/50 z-30 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/50 z-30 pointer-events-none"></div>

            {/* Overlays del HUD */}
            <div className="absolute top-4 left-4 z-10">
              <div className="text-[12px] text-cyan-500 font-mono mb-1 border border-cyan-800 px-2 bg-cyan-900/20 backdrop-blur-md">FONDOS DISPONIBLES</div>
              <div className="text-3xl font-bold font-teko text-cyan-300 tracking-wider drop-shadow-[0_0_8px_rgba(8,145,178,0.8)] leading-none mt-1">1,250,000 ₡</div>
              <div className="text-[12px] text-cyan-500 font-mono mt-2 border border-cyan-800 px-2 bg-cyan-900/20 backdrop-blur-md">MECHS ACTIVOS: <span className="text-cyan-300">4/4</span></div>
            </div>
            
            <div className="absolute top-4 right-4 z-10 text-right">
              <div className="text-lg font-teko text-orange-400 font-bold uppercase drop-shadow-[0_0_5px_rgba(234,88,12,0.8)] mb-2 border-b border-orange-600/50 pb-1">NOTICIAS DE LA ESFERA INTERIOR</div>
              <div className="text-[10px] text-slate-400 font-mono w-52 leading-relaxed text-justify bg-black/40 p-2 backdrop-blur-sm">Última hora: Fuerzas Kurita detectadas en el sector fronterizo. Mercenarios presten atención a los nuevos contratos...</div>
            </div>

            <div className="absolute bottom-4 left-6 z-10 border-l-4 border-cyan-500 pl-3">
              <h2 className="text-5xl font-teko font-black text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] leading-none">{selectedMech}</h2>
            </div>

            {/* Representación Real del Mech en el Hangar */}
            <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none p-8 mt-12">
               <img src="/mech-marauder.png" alt="Marauder" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]" />
            </div>

            {/* OVERLAY DEL MODULO ACTIVO */}
            {activeModule !== 'home' && (
              <div className="absolute inset-0 z-50 bg-[#000810]/80 backdrop-blur-md flex flex-col p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex-1 overflow-auto custom-scrollbar border border-cyan-900/50 bg-black/40 rounded-sm p-4 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
                  {activeModule === 'barracones' && <DesktopBarracones />}
                  {activeModule === 'contratos' && <DesktopContratos />}
                  {activeModule === 'finanzas' && <DesktopFinanzas />}
                  {activeModule === 'mercado' && <DesktopMercado />}
                  {activeModule === 'taller' && <DesktopTaller />}
                  {activeModule === 'hangar' && <DesktopHangar />}
                  {activeModule === 'inteligencia' && <DesktopInteligencia />}
                  {activeModule === 'operaciones' && <DesktopOperaciones />}
                </div>
              </div>
            )}
          </div>

          {/* Fila Inferior Central: Taller y HUD Táctico (SIEMPRE VISIBLE) */}
          <div className="flex-1 flex gap-4 overflow-hidden">
            <Panel num={4} title="Taller" className="flex-[1.2]" onClick={() => setActiveModule('taller')}>
              <div className="flex h-full gap-2 items-center">
                <div className="w-12 flex flex-col gap-2 border-r border-slate-800 pr-2">
                   <button className="bg-slate-800 p-2 border border-slate-600 hover:border-orange-500 rounded-sm"><Wrench size={16} /></button>
                   <button className="bg-slate-800 p-2 border border-slate-600 hover:border-cyan-500 rounded-sm"><Settings size={16} /></button>
                   <button className="bg-slate-800 p-2 border border-slate-600 rounded-sm"><Shield size={16} /></button>
                </div>
                <div className="flex-1 h-full flex items-center justify-center">
                  <MechWireframe />
                </div>
              </div>
            </Panel>
            
            <Panel num={5} title="HUD Táctico" className="flex-[1.5]" onClick={() => setActiveModule('operaciones')}>
              <div className="text-[10px] font-mono text-cyan-400 flex flex-col gap-2 h-full">
                <div className="flex justify-between border-b border-cyan-900 pb-1">
                  <span className="flex items-center gap-2"><Crosshair size={12}/> PROBABILIDADES</span>
                  <span>Impacto: 72%</span>
                </div>
                <div className="flex justify-between border-b border-cyan-900 pb-1">
                  <span className="flex items-center gap-2"><Zap size={12}/> ESTADO DEL ARMA</span>
                  <span className="text-green-400">PPC Lista</span>
                </div>
                <div className="flex-1 border border-cyan-900/50 bg-cyan-950/20 relative mt-2 flex items-center justify-center">
                   {/* Gráfico Mock del HUD Táctico */}
                   <svg width="100%" height="100%" viewBox="0 0 100 50" preserveAspectRatio="none" className="opacity-50">
                     <path d="M0,40 Q25,30 50,20 T100,5" stroke="cyan" fill="none" strokeWidth="1" />
                     <path d="M0,10 Q30,20 60,35 T100,40" stroke="orange" fill="none" strokeWidth="1" />
                     <circle cx="70" cy="25" r="2" fill="red" />
                   </svg>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        {/* ================= COLUMNA DERECHA ================= */}
        <div className="col-span-1 md:col-span-3 flex flex-col gap-6 overflow-hidden">
          
          {/* 6. Contratos */}
          <Panel num={6} title="Contratos" className="flex-[1]" onClick={() => setActiveModule('contratos')}>
            <div className="flex flex-col gap-2 mt-1">
              {CONTRACTS.map(c => (
                <div key={c.id} className="bg-[#1a0a00] border border-orange-900/50 p-2 flex justify-between items-center group hover:border-orange-500 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-900/50 border border-orange-700 rounded-sm flex items-center justify-center">
                      <Target size={14} className="text-orange-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-orange-200">{c.faction}</div>
                      <div className="text-[8px] text-orange-500 uppercase">{c.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-green-400">{c.payout}</div>
                    <div className="text-[8px] text-red-400">{c.difficulty}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* 7. Finanzas */}
          <Panel num={7} title="Finanzas" className="flex-[1.2]" onClick={() => setActiveModule('finanzas')}>
            <div className="flex justify-between items-center px-1 mb-1 border-b border-slate-800 pb-1">
               <div className="text-[10px] text-slate-400">BALANCE ACTUAL</div>
               <div className="text-xs font-mono font-bold text-green-400">1,250,000 C-BILLS</div>
            </div>
            <BarChartMock />
          </Panel>

          {/* 8. Personal */}
          <Panel num={8} title="Personal" className="flex-[0.8]">
             <div className="flex items-center justify-around h-full py-2">
                <div className="text-center"><div className="text-2xl text-slate-300 font-bold">12</div><div className="text-[8px] text-slate-500">MECHWARRIORS</div></div>
                <div className="text-center"><div className="text-2xl text-cyan-400 font-bold">8</div><div className="text-[8px] text-slate-500">TÉCNICOS</div></div>
                <div className="text-center"><div className="text-2xl text-green-400 font-bold">2</div><div className="text-[8px] text-slate-500">MÉDICOS</div></div>
             </div>
          </Panel>

          {/* 9. Mercado */}
          <Panel num={9} title="Mercado de Mechs" className="flex-[1]" onClick={() => setActiveModule('mercado')}>
            <div className="flex flex-col gap-2">
              {MARKET_MECHS.map(m => (
                <div key={m.name} className="flex justify-between items-center border-b border-slate-800 py-1 text-[10px] group hover:bg-slate-900/50 cursor-pointer">
                  <span className="text-slate-300 truncate w-24 group-hover:text-cyan-400">{m.name}</span>
                  <span className="text-slate-500 font-mono">{m.weight}T</span>
                  <span className="text-orange-400 font-mono text-right">{m.price}</span>
                </div>
              ))}
            </div>
          </Panel>

        </div>
      </main>

      {/* ADMIN PANEL */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}