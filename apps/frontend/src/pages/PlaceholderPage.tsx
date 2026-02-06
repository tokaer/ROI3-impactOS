import Breadcrumbs from "../components/Breadcrumbs";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-6">
      <Breadcrumbs
        segments={[
          { label: "Strategie" },
          { label: "ESG Strategy Hub" },
          { label: title },
        ]}
      />
      <h1 className="mt-2 text-xl font-semibold text-text-primary">{title}</h1>
      <div className="mt-8 flex items-center justify-center rounded-xl border border-border-gray p-16">
        <p className="text-text-subtle">
          Diese Seite ist noch nicht implementiert.
        </p>
      </div>
    </div>
  );
}
