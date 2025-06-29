import TableExportRow from "../components/TableExportRow";

export default async function page({ params }: { params: { code: string } }) {
  return (
    <section className="container flex flex-col p-12 min-h-screen text-base">
      <TableExportRow code={params?.code} table="Data export exl" />
    </section>
  );
}
