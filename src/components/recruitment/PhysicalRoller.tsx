// Datos físicos: 1d6 ajuste, altura/peso (IMC 28), pelo/sexo/ojos.
import type { PhysicalData, CampaignSetting } from '@/lib/recruitment/types';

const HAIRS = ['Rubio', 'Pelirrojo', 'Castaño', 'Negro', 'Calvo'];
const SEXES = ['Hombre', 'Mujer'];
const EYES = ['Verdes', 'Azules', 'Grises', 'Marrones', 'Negros'];

function rndInt(min: number, max: number) { return min + Math.floor(Math.random() * (max - min + 1)); }

export function PhysicalRoller({
  physical, campaign, onChange,
}: {
  physical: PhysicalData;
  campaign: CampaignSetting;
  onChange: (p: PhysicalData) => void;
}) {
  const rollAge = () => {
    const roll = rndInt(1, 6);
    const birth = campaign.baseDecade + campaign.yearDigit + roll;
    onChange({ ...physical, ageAdjustmentRoll: roll, birthYear: birth });
  };
  const rollHeightWeight = () => {
    const h = rndInt(165, 200);
    const w = Math.round(((h / 100) ** 2) * 28 * 10) / 10;
    onChange({ ...physical, heightCm: h, weightKg: w });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-secondary/70">Ajuste año (1d6)</span>
        <div className="flex gap-1">
          <button onClick={rollAge} className="px-2 py-1 border border-amber-500/60 text-amber-400 hover:bg-amber-500/10">🎲</button>
          <input
            readOnly
            value={physical.ageAdjustmentRoll ?? ''}
            placeholder="—"
            className="flex-1 bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-cream"
          />
        </div>
        {physical.birthYear && (
          <span className="font-mono text-[9px] text-secondary/60">Año nacimiento: {physical.birthYear}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-secondary/70">Altura / Peso (IMC 28)</span>
        <div className="flex gap-1">
          <button onClick={rollHeightWeight} className="px-2 py-1 border border-amber-500/60 text-amber-400 hover:bg-amber-500/10">🎲</button>
          <input
            value={physical.heightCm ?? ''}
            onChange={e => onChange({ ...physical, heightCm: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="cm"
            className="w-16 bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-cream"
          />
          <input
            value={physical.weightKg ?? ''}
            onChange={e => onChange({ ...physical, weightKg: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="kg"
            className="w-16 bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-cream"
          />
        </div>
      </div>

      <PhysicalSelect label="Pelo"  value={physical.hair} options={HAIRS} onChange={v => onChange({ ...physical, hair: v })} />
      <PhysicalSelect label="Sexo"  value={physical.sex}  options={SEXES} onChange={v => onChange({ ...physical, sex: v })} />
      <PhysicalSelect label="Ojos"  value={physical.eyes} options={EYES}  onChange={v => onChange({ ...physical, eyes: v })} />
    </div>
  );
}

function PhysicalSelect({ label, value, options, onChange }: {
  label: string; value: string | null; options: string[]; onChange: (v: string | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[9px] uppercase tracking-widest text-secondary/70">{label}</span>
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value || null)}
        className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-cream"
      >
        <option value="">--</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
