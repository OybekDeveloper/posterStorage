import TableExportRow from "./components/TableExportRow";

export default async function page({
  searchParams,
}: {
  searchParams: { code: string };
}) {
  const code = searchParams?.code || "";

  return (
    <section className="container flex flex-col p-12 min-h-screen text-base">
      <TableExportRow code={code} />
    </section>
  );
}
