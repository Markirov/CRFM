// ═══════════════════════════════════════════════════════════════
// scripts/set-role.ts — Asigna Custom Claims de rol a un usuario
//
// Uso: npx tsx scripts/set-role.ts email@ejemplo.com admin|dm|pj
//
// Requiere GOOGLE_APPLICATION_CREDENTIALS apuntando al JSON
// de service account (el mismo que usas para backup-firestore).
// ═══════════════════════════════════════════════════════════════

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const VALID_ROLES = ['admin', 'dm', 'pj'] as const;
type Role = typeof VALID_ROLES[number];

async function main() {
  const [,, email, role] = process.argv;

  if (!email || !role) {
    console.error('Uso: npx tsx scripts/set-role.ts <email> <admin|dm|pj>');
    process.exit(1);
  }

  if (!VALID_ROLES.includes(role as Role)) {
    console.error(`Rol inválido: "${role}". Debe ser: admin, dm o pj`);
    process.exit(1);
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Falta GOOGLE_APPLICATION_CREDENTIALS en el entorno.');
    process.exit(1);
  }

  if (!getApps().length) {
    initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) });
  }

  const auth = getAuth();

  try {
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, { role });
    console.log(`✅ ${email} → rol: ${role}`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   El usuario debe cerrar sesión y volver a entrar para que el claim se active.`);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.error(`❌ Usuario no encontrado: ${email}`);
    } else {
      console.error('❌ Error:', err.message);
    }
    process.exit(1);
  }
}

main();
