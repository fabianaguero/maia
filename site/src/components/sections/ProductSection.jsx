import SectionTitle from "../layout/SectionTitle";
import { Activity, AudioWaveform, FolderGit2, Radio } from "lucide-react";
const icons = [FolderGit2, Radio, AudioWaveform, Activity];
export default function ProductSection({ t, theme }) {
  return (
    <section id="product" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <SectionTitle eyebrow={t.product.eyebrow} title={t.product.title} text={t.product.text} classes={{ eyebrow: theme.eyebrow, title: theme.title, body: theme.body }} />
      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {t.product.features.map((item, idx) => {
          const Icon = icons[idx];
          return (
            <div key={item.title} className={`rounded-[1.8rem] border p-6 backdrop-blur-sm transition hover:border-cyan-300/30 ${theme.card}`}>
              <div className={`mb-4 inline-flex rounded-2xl border p-3 ${theme.soft}`}>
                <Icon className="h-5 w-5 text-cyan-300" />
              </div>
              <h3 className={`text-lg font-semibold ${theme.title}`}>{item.title}</h3>
              <p className={`mt-3 text-sm leading-7 ${theme.body}`}>{item.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
