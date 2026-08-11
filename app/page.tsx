import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-[#f7faf8]">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
          <span className="inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm font-medium text-emerald-800 shadow-sm">
            Built on Kenya&apos;s Green Finance Taxonomy (KGFT)
          </span>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Score loans for green alignment and climate risk in seconds
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Paste in loan details and get an instant risk classification, green
            taxonomy alignment, and a plain-language explanation your compliance
            team can actually use.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
  <Link
  href="/demo"
  className="bg-green-700 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-green-800 transition"
>
  Try the scorer - free, no signup
</Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800"
            >
              Create an account
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-5">
            <p className="text-sm font-medium text-slate-500">
              Sample classification
            </p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold text-slate-950">
                  Low risk
                </p>
                <p className="mt-1 text-sm text-emerald-700">
                  Green-aligned project
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                91%
              </span>
            </div>
          </div>
          <dl className="mt-5 grid gap-4">
            <Metric label="Sector" value="Renewable energy" />
            <Metric label="County" value="Nakuru" />
            <Metric
              label="Signal"
              value="Solar irrigation with low hazard exposure"
            />
          </dl>
        </div>
      </section>

      <section className="border-t border-emerald-100 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <Feature
            title="Sector-aware"
            body="Classification follows KGFT sector rules for energy, agriculture, transport, and more."
          />
          <Feature
            title="Climate-risk adjusted"
            body="County-level hazard exposure is factored directly into each risk score."
          />
          <Feature
            title="Explainable"
            body="Every score comes with a plain-language reason, not just a number."
          />
        </div>
      </section>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-slate-50 px-4 py-3">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-semibold text-slate-900">
        {value}
      </dd>
    </div>
  );
}
