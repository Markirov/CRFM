export interface MechEditorState {
  armor: {
    HD: number;
    CTf: number; CTr: number;
    LTf: number; LTr: number;
    RTf: number; RTr: number;
    LA: number; RA: number;
    LL: number; RL: number;
  };
  armorType: string;
  heatsinks: {
    count: number;
    type: string;
    locations: { loc: string; count: number }[];
  };
  equipment: {
    name: string;
    type: string;
    location: string;
  }[];
}

export function serializeSSW(originalSsw: string, state: MechEditorState): string {
  const doc = new DOMParser().parseFromString(originalSsw, 'text/xml');
  const root = doc.querySelector('mech');
  if (!root) throw new Error('No <mech> element found in original SSW');

  // 1. Armor
  const armorEl = root.querySelector('armor');
  if (armorEl) {
    const locs = { hd: state.armor.HD, ct: state.armor.CTf, ctr: state.armor.CTr, lt: state.armor.LTf, ltr: state.armor.LTr, rt: state.armor.RTf, rtr: state.armor.RTr, la: state.armor.LA, ra: state.armor.RA, ll: state.armor.LL, rl: state.armor.RL };
    for (const [key, val] of Object.entries(locs)) {
      const el = armorEl.querySelector(key);
      if (el) el.textContent = val.toString();
    }
  }

  // 2. Heatsinks
  const hsEl = root.querySelector('heatsinks');
  if (hsEl) {
    hsEl.setAttribute('number', state.heatsinks.count.toString());
    const typeEl = hsEl.querySelector('type');
    if (typeEl) typeEl.textContent = state.heatsinks.type;
    
    Array.from(hsEl.querySelectorAll('location')).forEach(n => n.remove());
    
    state.heatsinks.locations.forEach((loc) => {
      for (let i = 0; i < loc.count; i++) {
        const locNode = doc.createElement('location');
        locNode.textContent = loc.loc;
        hsEl.appendChild(locNode);
      }
    });
  }

  // 3. Equipment
  const existingEquipment = root.querySelectorAll(':scope > equipment');
  existingEquipment.forEach(n => n.remove());
  const baseLoadout = root.querySelector(':scope > baseloadout');
  if (baseLoadout) {
    baseLoadout.querySelectorAll('equipment').forEach(n => n.remove());
  }

  const targetForEquipment = baseLoadout || root;

  state.equipment.forEach(eq => {
    const eqNode = doc.createElement('equipment');
    const nameNode = doc.createElement('name');
    nameNode.setAttribute('manufacturer', '');
    nameNode.textContent = eq.name;
    const typeNode = doc.createElement('type');
    typeNode.textContent = eq.type;
    const locNode = doc.createElement('location');
    locNode.textContent = eq.location;

    eqNode.appendChild(nameNode);
    eqNode.appendChild(typeNode);
    eqNode.appendChild(locNode);

    targetForEquipment.appendChild(eqNode);
  });

  return new XMLSerializer().serializeToString(doc);
}
