import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { T } from '@/lib/theme';
import { JumpCalculator } from '@/features/jumpCalculator/JumpCalculator';
import { commitLibroEntryAndTreasury } from '@/lib/firebase-service';
import { genId } from '@/pages/FinanzasPage';
import { sendTelegramNotif } from '@/lib/telegram-service';

export function ViajesTab() {
  const { campaign, roster } = useAppStore();
  const [cubiertoPorContrato, setCubiertoPorContrato] = useState(false);
  
  // Basic travel costs state
  const [collars, setCollars] = useState(1);
  const [jumps, setJumps] = useState(1);
  const costPerCollarPerJump = 50000;
  
  const [dropshipTons, setDropshipTons] = useState(0);
  const [dropshipDays, setDropshipDays] = useState(0);
  const costPerDropshipTonDay = 100; // rough generic estimation

  const jumpCost = collars * jumps * costPerCollarPerJump;
  const dropCost = dropshipTons * dropshipDays * costPerDropshipTonDay;
  const subtotal = jumpCost + dropCost;
  const total = cubiertoPorContrato ? 0 : subtotal;

  const [committing, setCommitting] = useState(false);

  const handleRegistrar = async () => {
    setCommitting(true);
    try {
      const todayISO = new Date().toISOString().split('T')[0];
      const concepto = `Tarifas de transporte (${jumps} saltos, ${collars} collar/es)` + (cubiertoPorContrato ? ' [CUBIERTO POR CONTRATO]' : '');
      
      await commitLibroEntryAndTreasury({
        id: genId('lm'),
        fecha: todayISO,
        concepto,
        cantidad: total,
        tipo: 'gasto',
        categoria: 'transporte',
        nota: `Cálculo de coste: ${collars} collares × ${jumps} saltos. ${cubiertoPorContrato ? 'Pagado por el empleador (Límite de Carga).' : ''}`,
        jugador: '',
      });

      if (total > 0) {
        sendTelegramNotif('libro_mayor_relevante', {
          concepto,
          cantidad: total,
          tipo: 'gasto',
          categoria: 'transporte',
        });
      }

      alert('Coste registrado en el Libro Mayor.');
    } catch (err: any) {
      alert(`Error al registrar coste: ${err.message}`);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div style={{ padding: '0 24px', fontFamily: 'Inter, sans-serif', color: T.cream }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        
        {/* Izquierda: Calculadora principal de saltos */}
        <div style={{ background: T.surfaceLow, padding: 16, border: `1px solid ${T.outlineV}`, borderRadius: 4 }}>
          <JumpCalculator />
        </div>

        {/* Derecha: Presupuesto y Costes de Transporte */}
        <div style={{ background: T.surfaceLow, padding: 16, border: `1px solid ${T.outlineV}`, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, fontFamily: '"Space Grotesk", sans-serif', fontSize: 16, color: T.gold, textTransform: 'uppercase', letterSpacing: 1 }}>
            Gestión de Costes
          </h3>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', background: cubiertoPorContrato ? `${T.gold}15` : T.void, border: `1px solid ${cubiertoPorContrato ? T.gold : T.outlineV}`, cursor: 'pointer', borderRadius: 4 }}>
              <input 
                type="checkbox" 
                checked={cubiertoPorContrato} 
                onChange={(e) => setCubiertoPorContrato(e.target.checked)}
                style={{ accentColor: T.gold, width: 16, height: 16 }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: cubiertoPorContrato ? T.gold : T.cream, letterSpacing: 0.5 }}>
                SOPORTE CUBIERTO POR CONTRATO (Límite de Carga)
              </span>
            </label>
            <div style={{ marginTop: 6, fontSize: 11, color: T.outline }}>
              Si el contrato cubre el transporte (hasta el límite de carga), el coste final para la unidad será de 0 ₡.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: `1px solid ${T.outlineV}`, paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: T.bone }}>Collares Jumpship</span>
              <input type="number" min={1} value={collars} onChange={e => setCollars(parseInt(e.target.value) || 0)} style={{ width: 60, padding: '4px 8px', background: T.void, border: `1px solid ${T.outlineV}`, color: T.cream, fontFamily: '"Share Tech Mono", monospace' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: T.bone }}>Saltos requeridos</span>
              <input type="number" min={1} value={jumps} onChange={e => setJumps(parseInt(e.target.value) || 0)} style={{ width: 60, padding: '4px 8px', background: T.void, border: `1px solid ${T.outlineV}`, color: T.cream, fontFamily: '"Share Tech Mono", monospace' }} />
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${T.outlineV}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.outline }}>
              <span>Subtotal Coste:</span>
              <span style={{ fontFamily: '"Share Tech Mono", monospace' }}>{subtotal.toLocaleString()} ₡</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: cubiertoPorContrato ? '#0f0' : T.bloodLight }}>
              <span>TOTAL:</span>
              <span style={{ fontFamily: '"Share Tech Mono", monospace' }}>{total.toLocaleString()} ₡</span>
            </div>
          </div>

          <button
            onClick={handleRegistrar}
            disabled={committing || total < 0}
            style={{
              padding: '10px',
              background: committing ? T.outline : T.gold,
              color: T.void,
              border: 'none',
              borderRadius: 4,
              fontFamily: '"Share Tech Mono", monospace',
              fontSize: 14,
              fontWeight: 700,
              cursor: committing ? 'not-allowed' : 'pointer',
              marginTop: 8
            }}
          >
            {committing ? 'Registrando...' : 'REGISTRAR EN LIBRO MAYOR'}
          </button>
        </div>
      </div>
    </div>
  );
}
