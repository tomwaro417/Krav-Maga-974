export default function AdminHome() {
  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Admin</h1>
      <p className="text-zinc-700">
        MVP : endpoints admin disponibles (import, belts, belt-contents, liaison vidéos). UI admin à construire ici.
      </p>
      <ul className="list-disc pl-5 text-zinc-700">
        <li><code>/api/admin/import</code> (POST)</li>
        <li><code>/api/admin/belts</code> (GET/POST)</li>
        <li><code>/api/admin/belt-contents</code> (POST)</li>
        <li><code>/api/videos/link-coach</code> (POST)</li>
      </ul>
      <p className="text-sm text-zinc-500">
        En dev, passe l’en-tête <code className="rounded bg-zinc-100 px-1">x-user-email: admin@example.com</code>.
      </p>
    </main>
  );
}
