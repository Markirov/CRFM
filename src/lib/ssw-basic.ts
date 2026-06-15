// ══════════════════════════════════════════════════════════════
//  ssw-basic.ts — Parser ligero de SSW (BattleTech mech files).
//  Solo extrae campos básicos para TRO/Hangar/Compra.
//  Para parser completo (MechState/MechSession) usar parsers.ts.
// ══════════════════════════════════════════════════════════════

export interface ParsedSSWBasic {
  chassis:      string | null;
  model:        string | null;
  tons:         number | null;
  era:          string | null;
  engineType:   string | null;
  engineRating: number | null;
  walkMP:       number | null;
  jumpMP:       number | null;
  armorType:    string | null;
  armorTotal:   number | null;
  heatSinks:    number | null;
  heatSinkType: string | null;
  weapons:      string[];
  cost:         number | null;
}

export function parseSSWBasic(text: string): ParsedSSWBasic {
  const get = (tag: string) => {
    const m = text.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'));
    return m ? m[1].trim() : null;
  };
  const getNum = (tag: string) => {
    const v = get(tag);
    if (v == null) return null;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  };
  // Atributos del root <mech name="X" model="Y" tons="N" ...>
  const getAttr = (attr: string) => {
    const m = text.match(new RegExp(`<mech\\b[^>]*\\s${attr}="([^"]*)"`, 'i'));
    return m ? m[1].trim() : null;
  };
  const getAttrNum = (attr: string) => {
    const v = getAttr(attr);
    if (v == null) return null;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  };

  const weapons: string[] = [];
  const wMatches = text.matchAll(/<weapon>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?(<location>([^<]+)<\/location>)?[\s\S]*?<\/weapon>/g);
  for (const m of wMatches) {
    const loc = m[3] ? ` [${m[3]}]` : '';
    weapons.push(`${m[1]}${loc}`);
  }

  return {
    chassis:      get('chassis') || getAttr('name'),
    model:        get('model')   || getAttr('model'),
    tons:         getNum('tons') || getNum('mass') || getAttrNum('tons') || getAttrNum('mass'),
    era:          get('era') || get('year') || get('introyear'),
    engineType:   get('enginetype') || get('engine'),
    engineRating: getNum('rating') || getNum('enginerating'),
    walkMP:       getNum('walkmp') || getNum('walk'),
    jumpMP:       getNum('jumpmp') || getNum('jump'),
    armorType:    get('armortype'),
    armorTotal:   getNum('armortotal') || getNum('armorpoints'),
    heatSinks:    getNum('heatsinks') || getNum('numheatsinks'),
    heatSinkType: get('heatsinktype') || get('hstype'),
    weapons:      weapons.slice(0, 40),
    cost:         getNum('cost'),
  };
}
