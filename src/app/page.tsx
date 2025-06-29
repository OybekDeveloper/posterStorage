import TableExportRow from "./components/TableExportRow";

export default async function page({
  searchParams,
}: {
  searchParams: { token: string };
}) {
  const token= searchParams.token || null;
  return (
    <section className="container flex flex-col p-12 min-h-screen text-base">
      <TableExportRow token={token} table="Data export exl" />
    </section>
  );
}
