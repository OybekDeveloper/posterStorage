import { type NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import crypto from "crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  // if (!code) {
  //   return new Response("Unauthorized: Token or code required", {
  //     status: 401,
  //   });
  // }

  // const application_id = "4164";
  // const application_secret = "1dde40dbeaf227f70997e183eafa6685";
  // const verifyString = `${application_id}:${application_secret}:${code}`;
  // const verify = crypto.createHash("md5").update(verifyString).digest("hex");

  // const formBody = new URLSearchParams({
  //   application_id: "4164",
  //   application_secret: "1dde40dbeaf227f70997e183eafa6685",
  //   code,
  //   verify,
  // });

  // const authRes = await fetch("https://joinposter.com/api/v2/auth/manage", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/x-www-form-urlencoded",
  //   },
  //   body: formBody.toString(),
  // });

  // const authData = await authRes.json();
  // console.log({ authData });

  // if (!authData.access_token) {
  //   return new Response(
  //     `Unauthorized: Could not get token - ${
  //       authData.message || "Unknown error"
  //     }`,
  //     { status: 401 }
  //   );
  // }

  // const token = authData.access_token && authData.access_token;

  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format");
  const token = searchParams.get("token");
  // const token = "373820:1347846e7da9f15a777be819fca676fc";

  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(today.getMonth() - 1);

  const dateFrom =
    searchParams.get("dateFrom") || oneMonthAgo.toISOString().split("T")[0];
  const dateTo =
    searchParams.get("dateTo") || today.toISOString().split("T")[0];
  console.log({ dateFrom, dateTo });
  try {
    const { table } = params;
    if (!table) throw new Error("Table name required");

    const [suppliesRes, movesRes, ingredientRes, wastesRes] = await Promise.all(
      [
        fetch(
          `https://joinposter.com/api/storage.getSupplies?token=${token}&dateFrom=${dateFrom}&dateTo=${dateTo}`
        ),
        fetch(
          `https://joinposter.com/api/storage.getSupplies?token=${token}&dateFrom=${dateFrom}&dateTo=${dateTo}`
        ),
        fetch(
          `https://joinposter.com/api/storage.getIngredientWriteOff?token=${token}&dateFrom=${dateFrom}&dateTo=${dateTo}`
        ),
        fetch(
          `https://joinposter.com/api/storage.getWastes?token=${token}&dateFrom=${dateFrom}&dateTo=${dateTo}`
        ),
      ]
    );

    const [suppliesData, movesData, ingredientData, wastesData] =
      await Promise.all([
        suppliesRes.json(),
        movesRes.json(),
        ingredientRes.json(),
        wastesRes.json(),
      ]);

    const suppliesHeader = [
      [
        "ID",
        "Склад",
        "Поставщик",
        "Дата",
        "Счёт",
        "Сумма",
        "Нетто",
        "Комментарий",
        "Имя склада",
        "Имя поставщика",
        "Удалено",
      ],
    ];
    const suppliesBody = suppliesData.response.map((item: any) => [
      item.supply_id,
      item.storage_id,
      item.supplier_id,
      item.date,
      item.account_id,
      item.supply_sum,
      item.supply_sum_netto,
      item.supply_comment,
      item.storage_name,
      item.supplier_name,
      item.delete,
    ]);
    const suppliesSheet = XLSX.utils.aoa_to_sheet([
      ...suppliesHeader,
      ...suppliesBody,
    ]);

    const movesHeader = [
      [
        "ID",
        "Дата",
        "Из склада",
        "Имя от",
        "В склад",
        "Имя куда",
        "Польз ID",
        "Имя",
        "Сумма",
        "Нетто",
      ],
    ];
    const movesBody = movesData.response.map((item: any) => [
      item.moving_id,
      item.date,
      item.from_stoarge,
      item.from_storage_name,
      item.to_storge,
      item.to_storage_name,
      item.user_id,
      item.user_name,
      item.sum,
      item.sum_netto,
    ]);
    const movesSheet = XLSX.utils.aoa_to_sheet([...movesHeader, ...movesBody]);

    const ingredientsHeader = [
      [
        "ID",
        "Транзакция",
        "Склад",
        "Куда",
        "Ингр ID",
        "Продукт",
        "Модиф",
        "Полуф",
        "Вес",
        "Ед",
        "Сумма",
        "Нетто",
        "Официант ID",
        "Тип",
        "Время",
        "Дата",
        "Имя продукта",
        "Официант",
      ],
    ];
    const ingredientsBody = ingredientData.response.map((item: any) => [
      item.write_off_id,
      item.transaction_id,
      item.storage_id,
      item.to_storage,
      item.ingredient_id,
      item.product_id,
      item.modificator_id,
      item.prepack_id,
      item.weight,
      item.unit,
      item.cost,
      item.cost_netto,
      item.user_id,
      item.type,
      item.time,
      item.date,
      item.product_name,
      item.name,
    ]);
    const ingredientSheet = XLSX.utils.aoa_to_sheet([
      ...ingredientsHeader,
      ...ingredientsBody,
    ]);

    const wastesHeader = [
      [
        "ID",
        "Сумма",
        "Нетто",
        "Польз ID",
        "Склад",
        "Дата",
        "Причина ID",
        "Причина",
        "Удалено",
      ],
    ];
    const wastesBody = wastesData.response.map((item: any) => [
      item.waste_id,
      item.total_sum,
      item.total_sum_netto,
      item.user_id,
      item.storage_id,
      item.date,
      item.reason_id,
      item.reason_name,
      item.delete,
    ]);
    const wastesSheet = XLSX.utils.aoa_to_sheet([
      ...wastesHeader,
      ...wastesBody,
    ]);

    if (format === "xlsx") {
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, suppliesSheet, "Поставки");
      XLSX.utils.book_append_sheet(workbook, movesSheet, "Перемещения");
      XLSX.utils.book_append_sheet(workbook, ingredientSheet, "Списания");
      XLSX.utils.book_append_sheet(workbook, wastesSheet, "Потери");

      const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new Response(buf, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="${dateFrom}-${dateTo}.xlsx"`,
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    return new Response("Unsupported format", { status: 400 });
  } catch (e) {
    console.error(e);
    return new Response((e as Error).message, { status: 400 });
  }
}
