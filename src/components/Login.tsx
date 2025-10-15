import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, Lock, Mail, User, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName);
      }
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTQgMTZ2Mmgydi0yaC0yem00LTR2Mmgydi0yaC0yem00LTR2Mmgydi0yaC0yem00LTR2Mmgydi0yaC0yem00LTR2Mmgydi0yaC0yem0tMTYgMHYyaDJ2LTJoLTJ6bS00IDR2Mmgydi0yaC0yem0tNCA0djJoMnYtMmgtMnptLTQgNHYyaDJ2LTJoLTJ6bS00IDR2Mmgydi0yaC0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="text-white space-y-8 lg:pr-12">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-full px-4 py-2 border border-white border-opacity-20">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium">Plataforma de Pagos Empresariales</span>
              </div>

              <h1 className="text-6xl font-bold leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                  TOBB
                </span>
                <br />
                <span className="text-white">Pay</span>
              </h1>

              <p className="text-xl text-blue-200 leading-relaxed">
                La solución completa para gestión de cobros electrónicos y pagos recurrentes
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Seguro y Confiable</h3>
                  <p className="text-blue-200 text-sm">Integración directa con Kushki para máxima seguridad</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Procesamiento Rápido</h3>
                  <p className="text-blue-200 text-sm">Carga masiva y ejecución automática de cobros</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Gestión Completa</h3>
                  <p className="text-blue-200 text-sm">Dashboard con métricas en tiempo real y reportes detallados</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <p className="text-3xl font-bold">99.9%</p>
                <p className="text-sm text-blue-300">Uptime</p>
              </div>
              <div className="w-px h-12 bg-white bg-opacity-20"></div>
              <div className="text-center">
                <p className="text-3xl font-bold">24/7</p>
                <p className="text-sm text-blue-300">Soporte</p>
              </div>
              <div className="w-px h-12 bg-white bg-opacity-20"></div>
              <div className="text-center">
                <p className="text-3xl font-bold">SSL</p>
                <p className="text-sm text-blue-300">Encriptado</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>

            <div className="relative bg-white bg-opacity-10 backdrop-blur-xl rounded-3xl p-8 border border-white border-opacity-20 shadow-2xl">
              <div className="mb-8">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-white text-center mb-2">
                  {isLogin ? 'Bienvenido' : 'Crear Cuenta'}
                </h2>
                <p className="text-blue-200 text-center text-sm">
                  {isLogin ? 'Ingresa tus credenciales para continuar' : 'Completa el formulario para empezar'}
                </p>
              </div>

              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    isLogin
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-white bg-opacity-10 text-blue-200 hover:bg-opacity-20'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    !isLogin
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-white bg-opacity-10 text-blue-200 hover:bg-opacity-20'
                  }`}
                >
                  Registrarse
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="group">
                    <label className="block text-sm font-medium text-blue-100 mb-2">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Juan Pérez"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                <div className="group">
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 p-3 rounded-xl text-sm backdrop-blur-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-blue-200">
                  {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                  {' '}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-white font-semibold hover:underline"
                  >
                    {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
