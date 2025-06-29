import { type NextRequest } from "next/server";
import * as XLSX from "xlsx";

export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  // const token = "373820:33612612cbfe22576fbd715454ae78d2";
  const token = request.cookies.get("authToken")?.value;
  
  if (!token) {
    return new Response(`Unauthorized: Token required - ${token}`, {
      status: 401,
    });
  }

  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format");

  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(today.getMonth() - 1);

  const dateFrom =
    searchParams.get("dateFrom") || oneMonthAgo.toISOString().split("T")[0];
  const dateTo =
    searchParams.get("dateTo") || today.toISOString().split("T")[0];

  try {
    const { table } = params;
    if (!table) throw new Error("Table name required");

    // Fetch all data
    const [suppliesRes, movesRes, ingredientRes, wastesRes] = await Promise.all(
      [
        fetch(
          `https://joinposter.com/api/storage.getSupplies?token=${token}&date_from=${dateFrom}&date_to=${dateTo}`
        ),
        fetch(
          `https://joinposter.com/api/storage.getSupplies?token=${token}&date_from=${dateFrom}&date_to=${dateTo}`
        ),
        fetch(
          `https://joinposter.com/api/storage.getIngredientWriteOff?token=${token}&date_from=${dateFrom}&date_to=${dateTo}`
        ),
        fetch(
          `https://joinposter.com/api/storage.getWastes?token=${token}&date_from=${dateFrom}&date_to=${dateTo}`
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

    if (!suppliesData?.response) throw new Error("No supplies data found");
    if (!movesData?.response) throw new Error("No moves data found");
    if (!ingredientData?.response) throw new Error("No ingredient data found");
    if (!wastesData?.response) throw new Error("No wastes data found");

    console.log({ suppliesData, movesData, ingredientData, wastesData });
    // ==== SUPPLIES ====
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

    // ==== MOVES ====
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

    // ==== INGREDIENTS ====
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

    // ==== WASTES ====
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
    return new Response((e as Error).message, {
      status: 400,
    });
  }
}
