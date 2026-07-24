import { policySections, LAST_UPDATED } from "@/lib/policies";

export const metadata = {
  title: "Terms, Privacy & Policies",
  description:
    "Buzzora's Terms & Conditions, Privacy Policy, Refund & Cancellation Policy, Return Policy and Shipping Policy.",
};

function Todo({ note }) {
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-0.5 align-middle text-[11px] font-semibold text-accent-700">
      To be confirmed
      <span className="sr-only">{note}</span>
    </span>
  );
}

function Para({ item }) {
  if (typeof item === "string") {
    return <p className="text-sm leading-relaxed text-charcoal-mute">{item}</p>;
  }
  const text = item.text.replace("TODO_COMPANY_NAME", "[business name]").replace("TODO_JURISDICTION", "[jurisdiction]");
  return (
    <p className="text-sm leading-relaxed text-charcoal-mute">
      {text}
      <Todo note={item.todo} />
    </p>
  );
}

export default function PoliciesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6 md:pt-32">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">Terms, Privacy &amp; Policies</h1>
      <p className="mt-3 text-sm text-charcoal-mute">Last updated {LAST_UPDATED}</p>

      <div className="mt-6 rounded-2xl border border-accent-200 bg-accent-50 px-5 py-4 text-sm leading-relaxed text-charcoal-soft">
        <strong className="text-accent-700">A few fields below are placeholders</strong> carried
        over from the source policy document — marked{" "}
        <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[11px] font-semibold text-accent-700">
          To be confirmed
        </span>{" "}
        — including the registered business name, dispute jurisdiction, and the Grievance
        Officer's contact details. These should be filled in with accurate information before
        this page is relied on for compliance.
      </div>

      {/* section nav */}
      <nav className="mt-8 flex flex-wrap gap-2 border-b border-charcoal/10 pb-6">
        {policySections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-charcoal/15 px-3.5 py-1.5 text-xs font-semibold text-charcoal-soft transition hover:border-charcoal hover:text-charcoal"
          >
            {s.nav}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-16">
        {policySections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="font-display text-3xl">{section.title}</h2>

            {section.intro && (
              <div className="mt-4 space-y-4">
                {section.intro.map((p, i) => (
                  <Para key={i} item={p} />
                ))}
              </div>
            )}

            {section.listIntro && (
              <p className="mt-4 text-sm font-semibold text-charcoal">{section.listIntro}</p>
            )}

            {section.list && (
              <ol className="mt-4 list-decimal space-y-3 pl-5">
                {section.list.map((item, i) => (
                  <li key={i}>
                    <Para item={item} />
                  </li>
                ))}
              </ol>
            )}

            {section.subsections && (
              <div className="mt-4 space-y-6">
                {section.subsections.map((sub) => (
                  <div key={sub.heading}>
                    <h3 className="font-display text-xl">{sub.heading}</h3>
                    <div className="mt-2 space-y-3">
                      {sub.paragraphs.map((p, i) =>
                        typeof p === "string" ? (
                          <p key={i} className="text-sm leading-relaxed text-charcoal-mute">
                            {p}
                          </p>
                        ) : (
                          <p key={i} className="text-sm leading-relaxed text-charcoal-mute">
                            {p.text}
                            <Todo note={p.todo} />
                          </p>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section.grievanceOfficer && (
              <div className="mt-8 rounded-3xl border border-charcoal/10 bg-white p-6">
                <h3 className="font-display text-xl">Grievance Officer</h3>
                <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  {[
                    ["Name", null],
                    ["Designation", null],
                    ["Company name & address", null],
                    ["Contact email", null],
                    ["Phone", null],
                  ].map(([label]) => (
                    <div key={label}>
                      <dt className="text-xs font-semibold uppercase tracking-wider2 text-charcoal-mute">
                        {label}
                      </dt>
                      <dd className="mt-1 text-charcoal-soft">
                        <Todo note={`${label} — not provided in the source document.`} />
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-xs text-charcoal-mute">
                  Hours: Monday–Friday, 9:00–18:00
                </p>
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
