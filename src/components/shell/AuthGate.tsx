import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase-config';
import { useAuthRole } from '@/lib/auth-roles';
import { getRoles } from '@/lib/role-service';
import { LogIn, ShieldAlert, Loader } from 'lucide-react';

interface Props { children: ReactNode }

export function AuthGate({ children }: Props) {
  const [user, setUser]               = useState<User | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string>('');
  const [authorized, setAuthorized]   = useState<boolean | null>(null);

  useAuthRole();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Verificar autorización contra Firestore cuando hay usuario
  useEffect(() => {
    if (loading) return;
    if (!user) { setAuthorized(false); return; }
    const email = user.email?.toLowerCase() ?? '';
    getRoles().then(roles => {
      console.log('[AuthGate] email:', email, '| roles en Firestore:', roles.length, '| emails:', roles.map(r => r.email));
      const found = roles.some(r => r.email?.toLowerCase() === email);
      console.log('[AuthGate] found:', found);
      setAuthorized(found);
    }).catch(e => { console.error('[AuthGate] getRoles() error:', e); setAuthorized(false); });
  }, [user, loading]);

  const handleLogin = async () => {
    setError('');
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res?.user) {
        const email = res.user.email?.toLowerCase() ?? '';
        const roles = await getRoles();
        console.log('[AuthGate LOGIN] email:', email, '| roles:', roles.length, '| emails:', roles.map(r => r.email));
        const found = roles.some(r => r.email?.toLowerCase() === email);
        console.log('[AuthGate LOGIN] found:', found);
        if (!found) {
          await signOut(auth);
          setError(`Acceso denegado para ${email}. Pide al admin que te añada en Settings → Roles.`);
        }
      }
    } catch (e: any) {
      console.error('=== ERROR EN LOGIN ===', e);
      if (!error) setError(e?.message ?? 'Error de login');
    }
  };

  // Loading inicial (auth state)
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-on-surface">
        <Loader size={32} className="animate-spin text-primary-container" />
      </div>
    );
  }

  // Loading verificación roles
  if (user && authorized === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-on-surface">
        <Loader size={32} className="animate-spin text-primary-container" />
      </div>
    );
  }

  const email = user?.email?.toLowerCase() ?? '';

  if (!authorized) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-on-surface p-4">
        <div className="bg-surface-container-high border-2 border-primary-container/40 p-8 max-w-md w-full clip-chamfer flex flex-col items-center gap-5">
          <h1 className="font-headline text-2xl font-black tracking-tighter uppercase text-primary-container text-center">
            Comisión de Revisión y Fianza de Mercenarios
          </h1>
          <p className="font-mono text-[10px] text-secondary/60 uppercase tracking-widest text-center">
            Acceso restringido · autenticación requerida
          </p>

          {user && (
            <div className="w-full border border-error/50 bg-error/10 px-3 py-2 flex items-start gap-2 font-mono text-[10px] text-error">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>Cuenta {email} no autorizada. Pide acceso al administrador.</span>
            </div>
          )}

          {error && (
            <div className="w-full border border-error/50 bg-error/10 px-3 py-2 font-mono text-[10px] text-error">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full h-11 flex items-center justify-center gap-2 bg-primary-container/10 hover:bg-primary-container/20 border-2 border-primary-container text-primary-container font-mono text-[11px] uppercase tracking-widest transition-colors"
          >
            <LogIn size={14} /> Iniciar sesión con Google
          </button>

          {user && (
            <button
              onClick={() => signOut(auth)}
              className="font-mono text-[9px] text-outline hover:text-on-surface underline"
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
