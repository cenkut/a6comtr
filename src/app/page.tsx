import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-100">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="text-xl font-semibold tracking-tight">A6</div>
          <Link
            href="/login"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Giriş Yap
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
          a6.com.tr
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          Şirketinizin kalıcı QR dijital kartviziti
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600">
          Bir kez oluşturun, her yere koyun. Kartvizit, mağaza, fatura, fuar
          standı — müşteri QR okuttuğunda mobil şirket profilinize ulaşır.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Hemen Başla
          </Link>
          <a
            href="#ozellikler"
            className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 px-6 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Özellikler
          </a>
        </div>
      </main>

      <section
        id="ozellikler"
        className="border-t border-zinc-100 bg-zinc-50"
      >
        <div className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-16 sm:grid-cols-3">
          {[
            {
              title: "Kalıcı QR",
              body: "QR yalnızca sabit A6 adresini taşır. Şirket bilgisi değişse bile basılı QR çalışmaya devam eder.",
            },
            {
              title: "Mobil şirket profili",
              body: "Ara, WhatsApp, e-posta, yol tarifi ve rehbere kaydet — hepsi tek ekranda.",
            },
            {
              title: "Analitik",
              body: "QR taramaları ve profil etkileşimlerini ölçün. Hangi kanalın çalıştığını görün.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6"
            >
              <h2 className="text-lg font-semibold text-zinc-900">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-100">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 text-sm text-zinc-500">
          <span>A6 QR Dijital Kartvizit</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
