export function Admin2faNagBanner({ locale }: { locale: string }) {
  return (
    <div className="border-b border-yellow-300 bg-yellow-50 px-6 py-2 text-sm text-yellow-900">
      ⚠️ La double authentification n'est pas activée sur ce compte admin.{" "}
      <a href={`/${locale}/compte/profil#securite`} className="font-medium underline">
        Active-la maintenant
      </a>
      .
    </div>
  );
}
