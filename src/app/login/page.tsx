"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      router.push("/");
    } catch (err: any) {
      setError("Credenciales incorrectas o usuario no encontrado.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (err) {
      setError("Error al iniciar sesión con Google.");
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 flex items-center justify-center gap-3 text-center text-2xl font-bold leading-9 tracking-tight text-zinc-900 dark:text-zinc-100">
          <LogIn className="w-8 h-8 text-blue-600" />
          Inicia sesión en tu cuenta
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleLogin}>
          {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-100">
              Correo electrónico
            </label>
            <div className="mt-2">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-zinc-900 dark:text-white dark:bg-zinc-950 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-800 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-100">
              Contraseña
            </label>
            <div className="mt-2">
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-zinc-900 dark:text-white dark:bg-zinc-950 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-800 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition"
            >
              {loading ? "Cargando..." : "Ingresar"}
            </button>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-center gap-4">
           <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
           <span className="text-sm text-zinc-500">O continúa con</span>
           <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
        </div>
        
        <button
           onClick={handleGoogle}
           className="mt-6 flex w-full justify-center items-center gap-3 rounded-md bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm font-semibold leading-6 text-zinc-900 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25C22.56 11.47 22.49 10.71 22.36 9.98H12V14.27H17.92C17.66 15.65 16.88 16.82 15.71 17.6V20.39H19.28C21.36 18.47 22.56 15.61 22.56 12.25Z" fill="#4285F4"/>
            <path d="M12 23C14.97 23 17.46 22.02 19.28 20.39L15.71 17.6C14.73 18.26 13.48 18.66 12 18.66C9.13 18.66 6.71 16.73 5.83 14.12H2.15V16.97C3.97 20.59 7.7 23 12 23Z" fill="#34A853"/>
            <path d="M5.83 14.12C5.61 13.46 5.48 12.75 5.48 12C5.48 11.25 5.61 10.54 5.83 9.88V7.03H2.15C1.4 8.52 0.98 10.21 0.98 12C0.98 13.79 1.4 15.48 2.15 16.97L5.83 14.12Z" fill="#FBBC05"/>
            <path d="M12 5.34C13.62 5.34 15.06 5.89 16.2 6.98L19.38 3.8C17.45 2.01 14.96 1 12 1C7.7 1 3.97 3.41 2.15 7.03L5.83 9.88C6.71 7.27 9.13 5.34 12 5.34Z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <p className="mt-10 text-center text-sm text-zinc-500">
          ¿No tienes una cuenta?{" "}
          <Link href="/register" className="font-semibold leading-6 text-blue-600 hover:text-blue-500">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
