"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUpWithEmail } = useAuth();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      return setError("La contraseña debe tener al menos 6 caracteres.");
    }
    setError("");
    setLoading(true);
    try {
      await signUpWithEmail(email, password, name);
      router.push("/");
    } catch (error) {
      setError("Error al registrar la cuenta. Asegúrate de que el correo no esté en uso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 flex items-center justify-center gap-3 text-center text-2xl font-bold leading-9 tracking-tight text-zinc-900 dark:text-zinc-100">
          <UserPlus className="w-8 h-8 text-blue-600" />
          Crea una cuenta nueva
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleRegister}>
          {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-100">
              Nombre o Apodo
            </label>
            <div className="mt-2">
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-zinc-900 dark:text-white dark:bg-zinc-950 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-800 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

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
              {loading ? "Cargando..." : "Crear Cuenta"}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-zinc-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold leading-6 text-blue-600 hover:text-blue-500">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
