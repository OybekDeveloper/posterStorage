import TableExportRow from "../components/TableExportRow";

export default async function page({ params }: { params: { code: string } }) {
  const code = params?.code || "";
  const token = await fetch(`https://poster-storage.vercel.app/api/token?code=${code}`);
  const tokenData = await token.json();

  return (
    <section className="container flex flex-col p-12 min-h-screen text-base">
      <TableExportRow
        token={""}
        code={params?.code}
        table="Data export exl"
      />
    </section>
  );
}
