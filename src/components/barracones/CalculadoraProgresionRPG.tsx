import React, { useMemo, useState } from 'react';
import { Pilot } from '../../lib/barracones-types';
import { Quality, calcSalary } from '../../lib/salary-calc';
import { getVeterancy } from '../../lib/barracones-data';

interface Props {
  pilot: Pilot;
  onUpdateFinanzas: (updates: Partial<NonNullable<Pilot['rpgFinanzas']>>) => void;
  onAddPatrimonio: (amount: number) => void;
}

export function CalculadoraProgresionRPG({ pilot, onUpdateFinanzas, onAddPatrimonio }: Props) {
  const finanzas = pilot.rpgFinanzas || {};
  
  // -- Detección Automática --
  const detected = useMemo(() => {
    let hasDeuda = false;
    let hasPropiedad = false;
    let nivelPropiedad = 0;
    let rank = 0;
    let isOfficer = false;

    // Buscar en defectos
    for (const d of pilot.defectos) {
      const dlow = d.toLowerCase();
      if (dlow.includes('deuda')) hasDeuda = true;
    }
    // Buscar en méritos
    for (const m of pilot.meritos) {
      const mlow = m.toLowerCase();
      if (mlow.includes('propiedad') || mlow.includes('feudo') || mlow.includes('título')) {
        hasPropiedad = true;
        // Buscar el nivel en formatos como "Admin. de Feudo 5", "Admin de Feudo Nivel 3", etc.
        const match = mlow.match(/(?:admin\.?\s*de\s*)?(?:feudo|propiedad)\s*(?:nivel\s*)?(\d+)/i) || mlow.match(/\b(\d+)\b/);
        if (match && match[1]) {
          nivelPropiedad = parseInt(match[1], 10);
        }
      }
      if (mlow.includes('oficial') || mlow.includes('teniente') || mlow.includes('capitán') || mlow.includes('comandante')) {
        isOfficer = true;
        rank = 2; // Rango base para oficiales detectados
      }
    }

    // Buscar en habilidades para Admin. de Feudo
    for (const h of pilot.habilidades) {
      if (h.nombre.toLowerCase().includes('admin. de feudo') || h.nombre.toLowerCase().includes('feudo')) {
        hasPropiedad = true;
        nivelPropiedad = h.nivel; // Su nivel dictamina el ingreso
      }
    }

    // Inferir calidad usando el sistema real de XP de la unidad
    let quality: Quality = 'regular';
    const vet = getVeterancy(pilot.xpTotal).nombre.toLowerCase();
    if (vet.includes('elite') || vet.includes('as')) quality = 'elite';
    else if (vet.includes('veterano')) quality = 'veteran';
    else if (vet.includes('regular')) quality = 'regular';
    else quality = 'green';

    return { hasDeuda, hasPropiedad, nivelPropiedad, quality, isOfficer, rank };
  }, [pilot]);

  // -- Estados locales interactivos --
  const [quality, setQuality] = useState<Quality>(detected.quality);
  const [isOfficer, setIsOfficer] = useState(detected.isOfficer);
  const [rank, setRank] = useState(detected.rank);
  const [añosPasados, setAñosPasados] = useState(1);

  // -- Cálculos --
  const baseMonthly = 1500; // Base MechWarrior
  const sueldoMensual = calcSalary(baseMonthly, quality, isOfficer, rank);
  const sueldoAnual = sueldoMensual * 12;

  const propertyTable: Record<number, number> = {
    1: 20000, 2: 40000, 3: 60000, 4: 80000, 5: 100000,
    6: 200000, 7: 400000, 8: 800000, 9: 1600000, 10: 15000000, 11: 125000000
  };
  const defaultFeudo = detected.nivelPropiedad > 0 ? (propertyTable[detected.nivelPropiedad] || 40000) : 40000;

  const feudoLimpio = finanzas.feudoManual ?? (detected.hasPropiedad ? defaultFeudo : 0);
  const deudaNivel = finanzas.deudaNivel ?? (detected.hasDeuda ? 20 : 0);

  const ingresosBrutosAnuales = sueldoAnual + feudoLimpio;
  const retencionDeudaAnual = (ingresosBrutosAnuales * deudaNivel) / 100;
  const beneficioNetoAnual = ingresosBrutosAnuales - retencionDeudaAnual;
  
  const totalAcumulado = beneficioNetoAnual * añosPasados;

  const handleApply = () => {
    if (window.confirm(`¿Añadir ${totalAcumulado.toLocaleString()} ₡ al patrimonio de ${pilot.nombre}?`)) {
      onAddPatrimonio(totalAcumulado);
    }
  };

  return (
    <div className="bg-dark/40 border border-brand/20 p-4 rounded mt-4">
      <h3 className="text-brand font-bold uppercase mb-2 flex items-center justify-between">
        <span><i className="fas fa-calculator mr-2" /> Calculadora RPG</span>
        <span className="text-sm font-normal text-gray-400 normal-case">Detección automática activa</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PARTE IZQUIERDA: Entradas */}
        <div className="space-y-4">
          <div className="bg-dark p-3 rounded border border-gray-700/50">
            <h4 className="text-sm font-bold text-gray-300 mb-2">1. Sueldo (Multiplicador de Veteranía)</h4>
            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
              <div>
                <label className="text-gray-500 block text-xs">Calidad</label>
                <select value={quality} onChange={e => setQuality(e.target.value as Quality)} className="w-full bg-dark border border-gray-600 rounded px-2 py-1 text-gray-300">
                  <option value="green">Green (x0.5)</option>
                  <option value="regular">Regular (x1.0)</option>
                  <option value="veteran">Veteran (x1.6)</option>
                  <option value="elite">Elite (x2.0)</option>
                </select>
              </div>
              <div>
                <label className="text-gray-500 block text-xs">Rango / Oficial</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="checkbox" checked={isOfficer} onChange={e => setIsOfficer(e.target.checked)} title="Es Oficial" />
                  <input type="number" min={0} max={7} value={rank} onChange={e => setRank(parseInt(e.target.value)||0)} className="w-16 bg-dark border border-gray-600 rounded px-2 py-1 text-gray-300" title="Nivel de Rango" />
                </div>
              </div>
            </div>
            <div className="text-xs text-brand/80">
              Sueldo Base Resultante: <strong className="text-brand">{sueldoMensual.toLocaleString()} ₡/mes</strong>
            </div>
          </div>

          <div className="bg-dark p-3 rounded border border-gray-700/50">
            <h4 className="text-sm font-bold text-gray-300 mb-2">2. Feudo / Propiedad (Rasgo)</h4>
            {detected.hasPropiedad ? (
              <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded inline-block mb-2">
                Mérito detectado: Feudo/Propiedad {detected.nivelPropiedad > 0 && `(Nivel ${detected.nivelPropiedad})`}
              </span>
            ) : (
              <span className="text-xs text-gray-500 block mb-2">No se detectaron méritos de propiedad.</span>
            )}
            <div>
              <label className="text-gray-500 block text-xs">Ingreso Neto Promedio Anual (₡)</label>
              <input 
                type="number" 
                value={feudoLimpio} 
                onChange={e => onUpdateFinanzas({ feudoManual: parseInt(e.target.value) || 0 })}
                className="w-full bg-dark border border-gray-600 rounded px-2 py-1 text-white" 
              />
            </div>
          </div>

          <div className="bg-dark p-3 rounded border border-gray-700/50">
            <h4 className="text-sm font-bold text-gray-300 mb-2">3. Deudas (Rasgo)</h4>
            {detected.hasDeuda && (
               <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded inline-block mb-2">Defecto detectado: Deuda</span>
            )}
            <div>
              <label className="text-gray-500 block text-xs">Retención de Ingresos</label>
              <select 
                value={deudaNivel} 
                onChange={e => onUpdateFinanzas({ deudaNivel: parseInt(e.target.value) as 5|10|20 })}
                className="w-full bg-dark border border-gray-600 rounded px-2 py-1 text-gray-300"
              >
                <option value={0}>Sin deuda (0%)</option>
                <option value={5}>Deuda Nivel 1 (5%)</option>
                <option value={10}>Deuda Nivel 2 (10%)</option>
                <option value={20}>Deuda Nivel 3 (20%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* PARTE DERECHA: Resultados */}
        <div className="space-y-4">
          <div className="bg-dark p-4 rounded border border-brand/40">
            <h4 className="font-bold text-white mb-4 border-b border-gray-700 pb-2">Desglose Anual</h4>
            
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Sueldo ({sueldoMensual.toLocaleString()} × 12):</span>
              <span className="text-green-400">+{sueldoAnual.toLocaleString()} ₡</span>
            </div>
            
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Extras / Feudo:</span>
              <span className="text-green-400">+{feudoLimpio.toLocaleString()} ₡</span>
            </div>
            
            <div className="flex justify-between text-sm mb-3 pt-2 border-t border-gray-700/50">
              <span className="font-bold text-gray-300">Ingreso Bruto Total:</span>
              <span className="font-bold text-white">{ingresosBrutosAnuales.toLocaleString()} ₡</span>
            </div>

            {deudaNivel > 0 && (
              <div className="flex justify-between text-sm mb-3 text-red-400">
                <span>Retención Deuda ({deudaNivel}%):</span>
                <span>-{retencionDeudaAnual.toLocaleString()} ₡</span>
              </div>
            )}

            <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-brand/50">
              <span className="text-brand">Beneficio Neto Anual:</span>
              <span className="text-brand">{beneficioNetoAnual.toLocaleString()} ₡</span>
            </div>
          </div>

          <div className="bg-brand/10 p-4 rounded border border-brand/50">
             <h4 className="font-bold text-white mb-3">Proyección en el Tiempo</h4>
             <div className="flex items-center gap-3 mb-4">
               <label className="text-sm text-gray-300">Años acumulados:</label>
               <input 
                  type="number" min={1} max={50} 
                  value={añosPasados} 
                  onChange={e => setAñosPasados(parseInt(e.target.value)||1)} 
                  className="w-20 bg-dark border border-brand/50 rounded px-2 py-1 text-white text-center" 
                />
             </div>
             
             <div className="text-center mb-4">
                <div className="text-sm text-gray-400 uppercase tracking-widest mb-1">Gran Total</div>
                <div className="text-3xl font-black text-brand drop-shadow-md">
                  {totalAcumulado.toLocaleString()} <span className="text-xl">₡</span>
                </div>
             </div>

             <button 
                onClick={handleApply}
                className="w-full bg-brand text-dark font-bold uppercase tracking-wider py-2 rounded hover:bg-white transition-colors"
             >
                Sumar al Patrimonio
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
