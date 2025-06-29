import TableExportRow from "./components/TableExportRow";

export default async function page() {
  return (
    <section className="container flex flex-col p-12 min-h-screen text-base">
      <TableExportRow code={""} table="Data export exl" />
    </section>
  );
}
