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
      <h1 className="mt-2 text-xl font-semibold text-an-100">{title}</h1>
      <div className="mt-8 flex items-center justify-center rounded-md border border-border-gray p-16">
        <p className="text-an-60">
          Diese Seite ist noch nicht implementiert.
        </p>
      </div>
    </div>
  );
}
