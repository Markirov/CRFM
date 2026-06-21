import { usePerm } from '@/hooks/usePerm';

export function WikiPage() {
  const { readable, loading } = usePerm('tro'); // Usamos el mismo permiso que el TRO

  if (loading) return null;
  if (!readable) {
    return <div className="p-8 text-center text-red-500">Acceso denegado a la Wiki.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1c1b22' }}>
      <iframe 
        src={import.meta.env.DEV ? 'http://localhost:5174/wiki/' : '/wiki/'} 
        style={{ width: '100%', flex: 1, border: 'none', background: 'transparent' }} 
        title="Wiki de Reglas"
      />
    </div>
  );
}
