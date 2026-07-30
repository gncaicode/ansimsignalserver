import { CloseButton } from "./CloseButton";

type LegalDoc = {
  title: string;
  effectiveDate: string;
  articles: { heading: string; paragraphs: string[] }[];
  footer: string[];
  close: string;
};

export function LegalDocPage({ doc }: { doc: LegalDoc }) {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-8">
          <h1 className="text-xl font-bold text-slate-900">{doc.title}</h1>
          <p className="mt-1 text-xs text-slate-400">{doc.effectiveDate}</p>

          <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-700">
            {doc.articles.map((article) => (
              <section key={article.heading}>
                <h2 className="font-semibold text-slate-900 mb-1.5">{article.heading}</h2>
                <div className="space-y-1">
                  {article.paragraphs.map((p, i) => (
                    <p key={i} className="whitespace-pre-line">{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <hr className="my-6 border-slate-100" />

          <div className="space-y-0.5 text-xs text-slate-500">
            {doc.footer.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          <CloseButton label={doc.close} />
        </div>
      </div>
    </div>
  );
}
