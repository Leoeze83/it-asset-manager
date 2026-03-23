import React, { useState, useEffect, Component, Suspense } from 'react';
import { 
  LayoutDashboard, 
  Laptop, 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Menu,
  X,
  Download,
  MonitorCheck
} from 'lucide-react';
import { auth, onAuthStateChanged, signInWithRedirect, GoogleAuthProvider, signOut } from './firebaseAuth';
import { Asset, User, AssetType, AssetStatus } from './types';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const DashboardCharts = React.lazy(() => import('./DashboardCharts'));

type FirestoreModule = typeof import('./firebaseDb');
let firestoreModulePromise: Promise<FirestoreModule> | null = null;

function loadFirestoreModule() {
  if (!firestoreModulePromise) {
    firestoreModulePromise = import('./firebaseDb');
  }
  return firestoreModulePromise;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  state: { hasError: boolean; error: Error | null } = { hasError: false, error: null };

  constructor(props: { children: React.ReactNode }) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Ocurrió un error inesperado.";
      try {
        const errorInfo = JSON.parse(this.state.error?.message || "{}");
        if (errorInfo.error && errorInfo.error.includes("Missing or insufficient permissions")) {
          displayMessage = "No tienes permisos suficientes para realizar esta acción o ver estos datos.";
        }
      } catch (e) {
        // Not JSON, use default
      }

      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error de Aplicación</h2>
            <p className="text-zinc-600 mb-6">{displayMessage}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Reintentar
            </Button>
          </Card>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-black text-white hover:bg-zinc-800 shadow-sm',
      secondary: 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 shadow-sm',
      ghost: 'bg-transparent text-zinc-600 hover:bg-zinc-100',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={cn('bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden', className)} {...props}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' | 'info'; className?: string }) => {
  const variants = {
    default: 'bg-zinc-100 text-zinc-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider', variants[variant], className)}>
      {children}
    </span>
  );
};

const UserAvatar = ({ name, photoURL, className }: { name: string; photoURL?: string; className?: string }) => {
  const initials = name
    .split(' ')
    .map(part => part[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (photoURL) {
    return <img src={photoURL} className={cn("rounded-full object-cover", className)} alt={name} referrerPolicy="no-referrer" />;
  }

  return (
    <div className={cn("rounded-full bg-zinc-900 text-white flex items-center justify-center font-semibold", className)}>
      {initials || 'U'}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'users' | 'settings' | 'agent'>('dashboard');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const isAdmin = user?.role === 'Admin';

  const handleAddAsset = async (data: Partial<Asset>) => {
    if (!isAdmin) {
      throw new Error('Only administrators can modify assets.');
    }

    try {
      const { db, firestore } = await loadFirestoreModule();
      const { addDoc, updateDoc, doc, collection, serverTimestamp } = firestore;
      const { id, ...cleanData } = data as any;
      if (editingAsset) {
        await updateDoc(doc(db, 'assets', editingAsset.id), {
          ...cleanData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'assets'), {
          ...cleanData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsFormOpen(false);
      setEditingAsset(null);
    } catch (error) {
      handleFirestoreError(error, editingAsset ? OperationType.UPDATE : OperationType.CREATE, editingAsset ? `assets/${editingAsset.id}` : 'assets');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const { db, firestore } = await loadFirestoreModule();
          const { doc, getDoc, setDoc } = firestore;
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ id: userDoc.id, ...userDoc.data() } as User);
          } else {
            const { id, ...userData } = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: 'Staff',
              photoURL: firebaseUser.photoURL || undefined,
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
            setUser({ id, ...userData } as User);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    let unsubAssets = () => {};
    let unsubUsers = () => {};
    let isDisposed = false;

    (async () => {
      try {
        const { db, firestore } = await loadFirestoreModule();
        if (isDisposed) {
          return;
        }

        const { collection, query, onSnapshot } = firestore;

        const qAssets = query(collection(db, 'assets'));
        unsubAssets = onSnapshot(qAssets, (snapshot) => {
          setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset)));
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'assets');
        });

        if (user.role === 'Admin') {
          const qUsers = query(collection(db, 'users'));
          unsubUsers = onSnapshot(qUsers, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
          }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'users');
          });
        } else {
          setUsers([]);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'assets');
      }
    })();

    return () => {
      isDisposed = true;
      unsubAssets();
      unsubUsers();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'Admin' && (activeTab === 'users' || activeTab === 'agent')) {
      setActiveTab('dashboard');
    }
  }, [activeTab, user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setLoginError(null);
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      const authError = error as { code?: string; message?: string };
      const code = authError.code ?? 'auth/unknown';
      const message = authError.message ?? 'Unknown authentication error';
      console.error('Login error:', { code, message, error });
      setLoginError(`No se pudo iniciar sesion (${code}).`);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-black rounded-2xl">
              <Laptop className="h-10 w-10 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">IT Asset Manager</h1>
            <p className="mt-2 text-zinc-600">Gestión profesional de activos informáticos</p>
          </div>
          <Card className="p-8">
            <Button onClick={handleLogin} className="w-full h-12 text-lg">
              Iniciar Sesión con Google
            </Button>
            {loginError && (
              <p className="mt-3 text-xs text-red-600" role="alert">
                {loginError}
              </p>
            )}
            <p className="mt-4 text-xs text-zinc-400">
              Acceso restringido para personal autorizado del área IT.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-zinc-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-zinc-200 transition-all duration-300 flex flex-col",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg shrink-0">
            <Laptop className="h-5 w-5 text-white" />
          </div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight truncate">AssetFlow</span>}
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('dashboard')}
          />
          <NavItem 
            icon={<Laptop size={20} />} 
            label="Inventario" 
            active={activeTab === 'inventory'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('inventory')}
          />
          {isAdmin && (
            <NavItem 
              icon={<Users size={20} />} 
              label="Usuarios" 
              active={activeTab === 'users'} 
              collapsed={!isSidebarOpen}
              onClick={() => setActiveTab('users')}
            />
          )}
          <NavItem 
            icon={<Settings size={20} />} 
            label="Configuración" 
            active={activeTab === 'settings'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('settings')}
          />
          {isAdmin && (
            <NavItem 
              icon={<MonitorCheck size={20} />} 
              label="Agente Seguro" 
              active={activeTab === 'agent'} 
              collapsed={!isSidebarOpen}
              onClick={() => setActiveTab('agent')}
            />
          )}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <div className={cn("flex items-center gap-3 p-2 rounded-lg", !isSidebarOpen && "justify-center")}>
            <UserAvatar name={user.name} photoURL={user.photoURL} className="h-8 w-8 border border-zinc-200" />
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{user.name}</p>
                <p className="text-xs text-zinc-500 truncate">{user.role}</p>
              </div>
            )}
            {isSidebarOpen && (
              <button onClick={handleLogout} className="p-1 text-zinc-400 hover:text-red-600 transition-colors">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg">
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-semibold text-zinc-900 capitalize">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar activos..." 
                className="pl-10 pr-4 py-2 bg-zinc-100 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-black transition-all w-64"
              />
            </div>
            {user.role === 'Admin' && (
              <Button onClick={() => { setActiveTab('inventory'); setIsFormOpen(true); }} className="gap-2">
                <Plus size={18} />
                <span className="hidden sm:inline">Nuevo Activo</span>
              </Button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && <Dashboard assets={assets} users={users} />}
          {activeTab === 'inventory' && (
            <Inventory 
              assets={assets} 
              users={users} 
              user={user} 
              onEdit={(asset) => { setEditingAsset(asset); setIsFormOpen(true); }}
              onNew={() => { setEditingAsset(null); setIsFormOpen(true); }}
            />
          )}
          {isAdmin && activeTab === 'users' && <UserManagement users={users} />}
          {activeTab === 'settings' && <SettingsPage user={user} />}
          {isAdmin && activeTab === 'agent' && <AgentPage />}
        </div>

        {isFormOpen && (
          <AssetForm 
            asset={editingAsset} 
            users={users} 
            onClose={() => setIsFormOpen(false)} 
            onSubmit={handleAddAsset} 
          />
        )}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, collapsed, onClick }: { icon: React.ReactNode, label: string, active: boolean, collapsed: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
        active 
          ? "bg-zinc-900 text-white shadow-md" 
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
        collapsed && "justify-center px-0"
      )}
    >
      <span className={cn("shrink-0", active ? "text-white" : "text-zinc-400 group-hover:text-zinc-900")}>
        {icon}
      </span>
      {!collapsed && <span className="font-medium text-sm">{label}</span>}
    </button>
  );
}

// --- Dashboard View ---

function Dashboard({ assets, users }: { assets: Asset[], users: User[] }) {
  const stats = [
    { label: 'Total Activos', value: assets.length, icon: <Laptop className="text-blue-600" />, color: 'bg-blue-50' },
    { label: 'En Uso', value: assets.filter(a => a.status === 'Active').length, icon: <Activity className="text-emerald-600" />, color: 'bg-emerald-50' },
    { label: 'En Mantenimiento', value: assets.filter(a => a.status === 'Maintenance').length, icon: <Clock className="text-amber-600" />, color: 'bg-amber-50' },
    { label: 'Retirados', value: assets.filter(a => a.status === 'Retired').length, icon: <AlertCircle className="text-red-600" />, color: 'bg-red-50' },
  ];

  const typeData = [
    { name: 'Laptops', value: assets.filter(a => a.type === 'Laptop').length },
    { name: 'Desktops', value: assets.filter(a => a.type === 'Desktop').length },
    { name: 'Servers', value: assets.filter(a => a.type === 'Server').length },
    { name: 'Monitors', value: assets.filter(a => a.type === 'Monitor').length },
    { name: 'Printers', value: assets.filter(a => a.type === 'Printer').length },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                <p className="text-3xl font-bold text-zinc-900 mt-1">{stat.value}</p>
              </div>
              <div className={cn("p-3 rounded-xl", stat.color)}>
                {React.cloneElement(stat.icon as React.ReactElement, { size: 24 })}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Distribución por Tipo</h3>
              <div className="h-[300px] bg-zinc-100 rounded animate-pulse" />
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Estado de Activos</h3>
              <div className="h-[300px] bg-zinc-100 rounded animate-pulse" />
            </Card>
          </div>
        }
      >
        <DashboardCharts typeData={typeData} statusData={stats.slice(1)} />
      </Suspense>

      <Card>
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Activos Recientes</h3>
          <Button variant="ghost" className="text-xs">Ver todos</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Activo</th>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold">Asignado a</th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {assets.slice(0, 5).map((asset) => (
                <tr key={asset.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-100 rounded-lg">
                        <Laptop size={16} className="text-zinc-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{asset.name}</p>
                        <p className="text-xs text-zinc-500">{asset.serialNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{asset.type}</td>
                  <td className="px-6 py-4">
                    <Badge variant={asset.status === 'Active' ? 'success' : asset.status === 'Maintenance' ? 'warning' : 'default'}>
                      {asset.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">
                    {users.find(u => u.id === asset.assignedTo)?.name || 'Sin asignar'}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {asset.createdAt ? format(asset.createdAt.toDate(), 'dd/MM/yyyy') : '-'}
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 italic">
                    No hay activos registrados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// --- Inventory View ---

function Inventory({ assets, users, user, onEdit, onNew }: { assets: Asset[], users: User[], user: User, onEdit: (asset: Asset) => void, onNew: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Filtrar por nombre, serie..." 
              className="pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-black transition-all w-80"
            />
          </div>
          <Button variant="secondary" className="gap-2">
            <Filter size={16} />
            Filtros
          </Button>
        </div>
        {user.role === 'Admin' && (
          <Button onClick={onNew} className="gap-2">
            <Plus size={18} />
            Nuevo Activo
          </Button>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Activo</th>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold">Ubicación</th>
                <th className="px-6 py-4 font-semibold">Asignado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 italic">
                    No hay activos registrados aún.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 rounded-lg">
                          <Laptop size={16} className="text-zinc-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{asset.name}</p>
                          <p className="text-xs text-zinc-500">{asset.serialNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600">{asset.type}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={asset.status === 'Active' ? 'success' : asset.status === 'Maintenance' ? 'warning' : 'default'}>
                          {asset.status}
                        </Badge>
                        {asset.location === 'Managed Agent' && (
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            asset.lastSeen && (Date.now() - (asset.lastSeen as any).toMillis() < 60000) ? "bg-green-500 animate-pulse" : "bg-zinc-300"
                          )} title="Estado del Agente" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600">{asset.location || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-bold">
                          {users.find(u => u.id === asset.assignedTo)?.name.charAt(0) || '?'}
                        </div>
                        <span className="text-sm text-zinc-600">
                          {users.find(u => u.id === asset.assignedTo)?.name || 'Sin asignar'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.role === 'Admin' && (
                          <button 
                            onClick={() => onEdit(asset)}
                            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                          >
                            <MoreVertical size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AssetForm({ asset, users, onClose, onSubmit }: { asset: Asset | null, users: User[], onClose: () => void, onSubmit: (data: Partial<Asset>) => void }) {
  const [formData, setFormData] = useState<Partial<Asset>>(
    asset ? { ...asset } : {
      name: '',
      type: 'Laptop',
      serialNumber: '',
      status: 'Active',
      assignedTo: '',
      location: '',
      specs: ''
    }
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-xl font-bold">{asset ? 'Editar Activo' : 'Nuevo Activo'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg"><X size={20} /></button>
        </div>
        <form className="p-6 space-y-6" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Nombre del Activo</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black outline-none"
                placeholder="Ej: MacBook Pro IT-01"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Tipo</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as AssetType })}
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black outline-none"
              >
                <option value="Laptop">Laptop</option>
                <option value="Desktop">Desktop</option>
                <option value="Server">Server</option>
                <option value="Monitor">Monitor</option>
                <option value="Printer">Printer</option>
                <option value="Other">Otro</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Número de Serie</label>
              <input 
                required
                type="text" 
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black outline-none"
                placeholder="S/N: 123456789"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Estado</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black outline-none"
              >
                <option value="Active">Activo</option>
                <option value="Maintenance">Mantenimiento</option>
                <option value="In Storage">En Stock</option>
                <option value="Retired">Retirado</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Asignado a</label>
              <select 
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black outline-none"
              >
                <option value="">Sin asignar</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.department || 'Sin depto'})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Ubicación</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black outline-none"
                placeholder="Ej: Oficina 402"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Especificaciones Técnicas</label>
            <textarea 
              value={formData.specs}
              onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black outline-none h-24"
              placeholder="RAM, CPU, Almacenamiento..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{asset ? 'Guardar Cambios' : 'Crear Activo'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// --- User Management View ---

function UserManagement({ users }: { users: User[] }) {
  return (
    <Card>
      <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Directorio de Usuarios</h3>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">Exportar</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Usuario</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Departamento</th>
              <th className="px-6 py-4 font-semibold">Rol</th>
              <th className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={user.name} photoURL={user.photoURL} className="h-8 w-8" />
                    <span className="text-sm font-medium text-zinc-900">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-600">{user.email}</td>
                <td className="px-6 py-4 text-sm text-zinc-600">{user.department || '-'}</td>
                <td className="px-6 py-4">
                  <Badge variant={user.role === 'Admin' ? 'info' : 'default'}>{user.role}</Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-zinc-400 hover:text-zinc-900 rounded-lg">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// --- Agent View ---

function AgentPage() {
  const [packageMessage, setPackageMessage] = useState<string | null>(null);
  const msiPackageUrl = (import.meta.env.VITE_AGENT_MSI_URL as string | undefined)
    || '/downloads/AssetFlow-Agent-Installer.msi';

  const agentScript = `
param(
  [ValidateSet("Install", "Run", "Status", "Uninstall")]
  [string]$Mode = "Install",
  [string]$BootstrapToken,
  [string]$BaseUrl = "${window.location.origin}"
)

$ErrorActionPreference = "Stop"
$installRoot = Join-Path $env:ProgramData "AssetFlow"
$statePath = Join-Path $installRoot "agent-state.json"
$logPath = Join-Path $installRoot "agent.log"
$taskName = "AssetFlowSecureAgent"
$installedScriptPath = Join-Path $installRoot "assetflow-agent.ps1"
$agentVersion = "2.1.0"

function Write-Log([string]$message) {
  $line = "$(Get-Date -Format o) $message"
  Write-Host $line
  if (-not (Test-Path $installRoot)) {
    New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
  }
  Add-Content -Path $logPath -Value $line -Encoding UTF8
}

function Assert-Administrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run PowerShell as Administrator for this operation."
  }
}

function Get-AgentState {
  if (-not (Test-Path $statePath)) {
    return $null
  }

  try {
    return Get-Content $statePath -Raw | ConvertFrom-Json
  } catch {
    Write-Log "Invalid agent state file detected, removing it."
    Remove-Item $statePath -Force -ErrorAction SilentlyContinue
    return $null
  }
}

function Save-AgentState($state) {
  if (-not (Test-Path $installRoot)) {
    New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
  }
  $state | ConvertTo-Json -Depth 4 | Set-Content -Path $statePath -Encoding UTF8
}

function Register-Agent([string]$token) {
  if ([string]::IsNullOrWhiteSpace($token)) {
    throw "Bootstrap token is required for registration."
  }

  $hostname = $env:COMPUTERNAME
  $os = (Get-CimInstance Win32_OperatingSystem).Caption
  $serial = (Get-CimInstance Win32_Bios).SerialNumber
  $cpuName = (Get-CimInstance Win32_Processor | Select-Object -First 1 -ExpandProperty Name)
  $ramGb = [Math]::Round(((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB), 2)

  $body = @{
    hostname = $hostname
    os = $os
    serialNumber = $serial
    type = "Laptop"
    specs = "CPU: $cpuName; RAM: $ramGb GB"
    agentVersion = $agentVersion
  } | ConvertTo-Json

  $headers = @{
    "x-agent-bootstrap-token" = $token
  }

  $response = Invoke-RestMethod -Uri "$BaseUrl/api/agent/register" -Method Post -Headers $headers -Body $body -ContentType "application/json"

  $state = @{
    id = $response.id
    key = $response.agentKey
    intervalSeconds = [Math]::Max([int]$response.intervalSeconds, 30)
    registeredAt = (Get-Date -Format o)
  }

  Save-AgentState $state
  Write-Log "Agent registered successfully with id $($state.id)."
  return $state
}

function Send-Heartbeat($state) {
  $cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
  $totalMemory = [double](Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory
  $freeMemory = [double](Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory * 1KB
  $ramUsed = if ($totalMemory -gt 0) { 100 - (($freeMemory / $totalMemory) * 100) } else { 0 }
  $disk = Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DeviceID -eq "C:" } | Select-Object -First 1
  $diskUsed = if ($disk -and $disk.Size -gt 0) { 100 - (($disk.FreeSpace / $disk.Size) * 100) } else { 0 }

  $body = @{
    id = $state.id
    cpu = [Math]::Round($cpu, 2)
    ram = [Math]::Round($ramUsed, 2)
    disk = [Math]::Round($diskUsed, 2)
  } | ConvertTo-Json

  $headers = @{
    "x-agent-id" = $state.id
    "x-agent-key" = $state.key
  }

  Invoke-RestMethod -Uri "$BaseUrl/api/agent/heartbeat" -Method Post -Headers $headers -Body $body -ContentType "application/json" | Out-Null
}

function Install-Agent {
  Assert-Administrator

  if ([string]::IsNullOrWhiteSpace($BootstrapToken)) {
    $script:BootstrapToken = Read-Host "Bootstrap token"
  }

  $state = Get-AgentState
  if (-not $state) {
    $state = Register-Agent $script:BootstrapToken
  }

  if (-not (Test-Path $installRoot)) {
    New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
  }

  Copy-Item -Path $PSCommandPath -Destination $installedScriptPath -Force

  $actionArgs = '-NoProfile -ExecutionPolicy Bypass -File "' + $installedScriptPath + '" -Mode Run -BaseUrl "' + $BaseUrl + '"'
  $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument $actionArgs
  $trigger = New-ScheduledTaskTrigger -AtStartup
  $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
  $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
  Start-ScheduledTask -TaskName $taskName

  Write-Host "Agent installed successfully."
  Write-Host "Task name: $taskName"
  Write-Host "State file: $statePath"
  Write-Host "Log file: $logPath"
  Write-Host "Registered asset id: $($state.id)"
}

function Run-Agent {
  $state = Get-AgentState
  if (-not $state) {
    if ([string]::IsNullOrWhiteSpace($BootstrapToken)) {
      Write-Log "No registration state found and no bootstrap token provided. Exiting."
      exit 1
    }
    $state = Register-Agent $BootstrapToken
  }

  $intervalSeconds = [Math]::Max([int]$state.intervalSeconds, 30)
  Write-Log "Agent loop started with interval $($intervalSeconds)s."

  while ($true) {
    try {
      Send-Heartbeat $state
      Write-Log "Heartbeat sent for asset $($state.id)."
    } catch {
      $message = $_.Exception.Message
      Write-Log "Heartbeat failed: $message"
      if ($message -match "401|403") {
        Write-Log "Credentials rejected by server. Reinstall the agent to rotate credentials."
      }
    }

    Start-Sleep -Seconds $intervalSeconds
  }
}

function Show-AgentStatus {
  $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  $state = Get-AgentState

  if ($task) {
    $taskInfo = Get-ScheduledTaskInfo -TaskName $taskName
    Write-Host "Task: Installed ($($task.State))"
    Write-Host "LastRunTime: $($taskInfo.LastRunTime)"
    Write-Host "LastTaskResult: $($taskInfo.LastTaskResult)"
  } else {
    Write-Host "Task: Not installed"
  }

  if ($state) {
    Write-Host "Asset ID: $($state.id)"
    Write-Host "Interval: $([Math]::Max([int]$state.intervalSeconds, 30)) seconds"
    Write-Host "RegisteredAt: $($state.registeredAt)"
  } else {
    Write-Host "State: Not registered"
  }

  if (Test-Path $logPath) {
    Write-Host "Log: $logPath"
  }
}

function Uninstall-Agent {
  Assert-Administrator

  if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  }

  if (Test-Path $installRoot) {
    Remove-Item $installRoot -Recurse -Force -ErrorAction SilentlyContinue
  }

  Write-Host "Agent uninstalled."
}

switch ($Mode) {
  "Install" { Install-Agent }
  "Run" { Run-Agent }
  "Status" { Show-AgentStatus }
  "Uninstall" { Uninstall-Agent }
}
  `.trim();

  const downloadScript = () => {
    const blob = new Blob([agentScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'register-agent-secure.ps1';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadMsiPackage = async () => {
    setPackageMessage(null);

    try {
      const response = await fetch(msiPackageUrl, { method: 'HEAD' });
      if (!response.ok) {
        setPackageMessage('El paquete MSI aun no esta publicado. Consulta la guia de release para generarlo.');
        return;
      }

      const a = document.createElement('a');
      a.href = msiPackageUrl;
      a.download = 'AssetFlow-Agent-Installer.msi';
      a.click();
    } catch {
      setPackageMessage('No fue posible descargar el MSI. Verifica conectividad o la variable VITE_AGENT_MSI_URL.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 bg-black rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <MonitorCheck className="text-white h-8 w-8" />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900">Agente Seguro de Inventario</h2>
        <p className="text-zinc-600 max-w-2xl mx-auto">
          Esta versión registra equipos y envía telemetría mínima. No ejecuta comandos remotos, no mantiene WebSockets abiertos y no captura pantallas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-4">Windows (PowerShell)</h3>
            <p className="text-sm text-zinc-500 mb-6">
              Este instalador registra el equipo, guarda estado en ProgramData y crea una tarea programada para enviar heartbeat al iniciar Windows.
            </p>
            <div className="bg-zinc-900 rounded-lg p-4 mb-6 overflow-x-auto">
              <pre className="text-xs text-zinc-300 font-mono">
                {agentScript.split('\n').slice(0, 12).join('\n')}
                {"\n# ..."}
              </pre>
            </div>
          </div>
          <div className="space-y-3">
            <Button onClick={downloadScript} className="w-full gap-2 h-12">
              <Download size={18} />
              Descargar Instalador (.ps1)
            </Button>
            <Button onClick={downloadMsiPackage} variant="secondary" className="w-full gap-2 h-12">
              <Download size={18} />
              Descargar Paquete MSI
            </Button>
            {packageMessage && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2" role="status">
                {packageMessage}
              </p>
            )}
          </div>
        </Card>

        <Card className="p-8 space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-4">Controles aplicados</h3>
            <ul className="space-y-3 text-sm text-zinc-600">
              <li>Registro protegido con `AGENT_BOOTSTRAP_TOKEN` y credenciales emitidas por el servidor.</li>
              <li>Heartbeat autenticado mediante `x-agent-id` y `x-agent-key` con rotación por alta o reinscripción.</li>
              <li>Telemetría mínima: CPU, RAM y disco. Sin captura de pantalla ni ejecución remota.</li>
              <li>Validación estricta, límites de tamaño y rate limiting en endpoints sensibles.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Despliegue recomendado</h3>
            <ul className="space-y-3 text-sm text-zinc-600">
              <li>Instala como administrador: <code className="bg-zinc-100 px-1 rounded">.\assetflow-agent.ps1 -Mode Install</code></li>
              <li>Consulta estado: <code className="bg-zinc-100 px-1 rounded">.\assetflow-agent.ps1 -Mode Status</code></li>
              <li>Desinstala limpio: <code className="bg-zinc-100 px-1 rounded">.\assetflow-agent.ps1 -Mode Uninstall</code></li>
              <li>Publica el MSI en <code className="bg-zinc-100 px-1 rounded">/downloads/AssetFlow-Agent-Installer.msi</code> o define <code className="bg-zinc-100 px-1 rounded">VITE_AGENT_MSI_URL</code>.</li>
              <li>Usa <code className="bg-zinc-100 px-1 rounded">AGENT_BOOTSTRAP_TOKEN</code> por canal interno y rotalo si sospechas exposicion.</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
/*
# Script de Agente Activo (PowerShell)
# Ejecutar como Administrador para persistencia

$baseUrl = "${window.location.origin}"
$wsUrl = "ws://$($baseUrl.Replace("https://", "").Replace("http://", ""))/ws"

function Register-Agent {
    $hostname = $env:COMPUTERNAME
    $os = (Get-WmiObject Win32_OperatingSystem).Caption
    $serial = (Get-WmiObject Win32_Bios).SerialNumber
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" }).IPAddress[0]
    
    $body = @{
        hostname = $hostname
        os = $os
        serialNumber = $serial
        type = "Laptop"
        specs = "CPU: $((Get-WmiObject Win32_Processor).Name), RAM: $((Get-WmiObject Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum).Sum / 1GB)GB, IP: $ip"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/agent/register" -Method Post -Body $body -ContentType "application/json"
    return $response.id
}

function Send-Heartbeat($agentId) {
    $cpu = (Get-WmiObject Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
    $ram = (Get-WmiObject Win32_OperatingSystem).FreePhysicalMemory / (Get-WmiObject Win32_OperatingSystem).TotalVisibleMemorySize * 100
    $ramUsed = 100 - $ram
    $disk = (Get-WmiObject Win32_LogicalDisk | Where-Object { $_.DeviceID -eq "C:" }).FreeSpace / (Get-WmiObject Win32_LogicalDisk | Where-Object { $_.DeviceID -eq "C:" }).Size * 100
    $diskUsed = 100 - $disk

    # Captura de pantalla
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen
    $bitmap = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($screen.Bounds.X, $screen.Bounds.Y, 0, 0, $bitmap.Size)
    $ms = New-Object System.IO.MemoryStream
    $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $base64 = [Convert]::ToBase64String($ms.ToArray())
    $graphics.Dispose()
    $bitmap.Dispose()

    $body = @{
        id = $agentId
        cpu = [Math]::Round($cpu, 2)
        ram = [Math]::Round($ramUsed, 2)
        disk = [Math]::Round($diskUsed, 2)
        screenshot = "data:image/jpeg;base64,$base64"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "$baseUrl/api/agent/heartbeat" -Method Post -Body $body -ContentType "application/json"
}

$agentId = Register-Agent
Write-Host "Agente registrado con ID: $agentId"

# Conexión WebSocket para Comandos
Add-Type -AssemblyName System.Net.Http
$ws = New-Object System.Net.WebSockets.ClientWebSocket
$uri = New-Object System.Uri("$wsUrl?type=agent&agentId=$agentId")
$cts = New-Object System.Threading.CancellationTokenSource

async function Connect-WS {
    try {
        $task = $ws.ConnectAsync($uri, $cts.Token)
        $task.Wait()
        Write-Host "Conectado al WebSocket del servidor."
        
        while ($ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
            $buffer = New-Object byte[] 4096
            $segment = New-Object System.ArraySegment[byte]($buffer)
            $result = $ws.ReceiveAsync($segment, $cts.Token).Result
            
            if ($result.MessageType -eq [System.Net.WebSockets.WebSocketMessageType]::Text) {
                $message = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $result.Count)
                $data = $message | ConvertFrom-Json
                
                if ($data.type -eq "command") {
                    Write-Host "Ejecutando comando: $($data.content)"
                    try {
                        $output = Invoke-Expression $data.content | Out-String
                        $response = @{ type="output"; content=$output; targetId="client" } | ConvertTo-Json
                        $sendBuffer = [System.Text.Encoding]::UTF8.GetBytes($response)
                        $sendSegment = New-Object System.ArraySegment[byte]($sendBuffer)
                        $ws.SendAsync($sendSegment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
                    } catch {
                        $errorMsg = @{ type="output"; content="Error: $($_.Exception.Message)"; targetId="client" } | ConvertTo-Json
                        $sendBuffer = [System.Text.Encoding]::UTF8.GetBytes($errorMsg)
                        $ws.SendAsync($sendSegment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
                    }
                }
            }
        }
    } catch {
        Write-Host "Error en WebSocket: $($_.Exception.Message)"
        Start-Sleep -Seconds 5
        Connect-WS # Reintento
    }
}

# Ejecutar WebSocket en segundo plano
$wsThread = [System.Threading.Tasks.Task]::Run({ Connect-WS })

# Bucle principal de monitoreo
while($true) {
    try {
        Send-Heartbeat $agentId
        Write-Host "Heartbeat enviado..."
    } catch {
        Write-Host "Error enviando heartbeat: $_"
    }
    Start-Sleep -Seconds 30
}
  `.trim();

  const downloadScript = () => {
    const blob = new Blob([agentScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'register-agent.ps1';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 bg-black rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <MonitorCheck className="text-white h-8 w-8" />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900">Agente de Inventario Automático</h2>
        <p className="text-zinc-600 max-w-xl mx-auto">
          Instala el agente en tus dispositivos para que se registren automáticamente en el inventario cada vez que se conecten a internet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-4">Windows (PowerShell)</h3>
            <p className="text-sm text-zinc-500 mb-6">
              Descarga y ejecuta este script en cualquier máquina Windows para registrarla instantáneamente.
            </p>
            <div className="bg-zinc-900 rounded-lg p-4 mb-6 overflow-x-auto">
              <pre className="text-xs text-zinc-300 font-mono">
                {agentScript.split('\n').slice(0, 5).join('\n')}
                {"\n# ..."}
              </pre>
            </div>
          </div>
          <Button onClick={downloadScript} className="w-full gap-2 h-12">
            <Download size={18} />
            Descargar Script (.ps1)
          </Button>
        </Card>

        <Card className="p-8">
          <h3 className="text-xl font-bold mb-4">Instrucciones</h3>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold shrink-0">1</div>
              <p className="text-sm text-zinc-600">Descarga el script de registro en el dispositivo objetivo.</p>
            </li>
            <li className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold shrink-0">2</div>
              <p className="text-sm text-zinc-600">Abre PowerShell como Administrador.</p>
            </li>
            <li className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold shrink-0">3</div>
              <p className="text-sm text-zinc-600">Ejecuta el script: <code className="bg-zinc-100 px-1 rounded">.\register-agent.ps1</code></p>
            </li>
            <li className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold shrink-0">4</div>
              <p className="text-sm text-zinc-600">El dispositivo aparecerá automáticamente en la pestaña de Inventario.</p>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

*/
// --- Settings View ---

function SettingsPage({ user }: { user: User }) {
  return (
    <div className="max-w-2xl space-y-8">
      <Card className="p-8">
        <h3 className="text-xl font-bold mb-6">Perfil de Usuario</h3>
        <div className="flex items-center gap-6 mb-8">
          <UserAvatar name={user.name} photoURL={user.photoURL} className="h-20 w-20 rounded-2xl border-2 border-zinc-100" />
          <div>
            <h4 className="text-lg font-semibold">{user.name}</h4>
            <p className="text-zinc-500">{user.email}</p>
            <Badge variant="info" className="mt-2">{user.role}</Badge>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Departamento</label>
            <input 
              type="text" 
              defaultValue={user.department}
              className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <Button className="w-full">Actualizar Perfil</Button>
        </div>
      </Card>

      <Card className="p-8 border-red-100">
        <h3 className="text-xl font-bold text-red-600 mb-4">Zona de Peligro</h3>
        <p className="text-sm text-zinc-500 mb-6">
          Las acciones realizadas aquí pueden afectar la integridad de los datos de la empresa.
        </p>
        <Button variant="danger" className="w-full">Eliminar Cuenta</Button>
      </Card>
    </div>
  );
}
