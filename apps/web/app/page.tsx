export default function Home() {
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">FEKM — Suivi des connaissances techniques</h1>
      <p className="text-zinc-700">
        Ceci est un starter MVP. Pour tester l’API en dev, envoie l’en-tête <code className="rounded bg-zinc-100 px-1">x-user-email</code>.
      </p>
      <ul className="list-disc pl-5 text-zinc-700">
        <li><a href="/app">Aller à l’app</a></li>
        <li><a href="/admin">Aller à l’admin</a></li>
      </ul>
      <p className="text-sm text-zinc-500">
        Exemple : <code className="rounded bg-zinc-100 px-1">demo@example.com</code> (USER) /{" "}
        <code className="rounded bg-zinc-100 px-1">admin@example.com</code> (ADMIN)
      </p>
    </main>
  );
}
