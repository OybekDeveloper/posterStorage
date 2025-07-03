import { NextRequest } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const {
      suppliesData = [],
      movesData = [],
      ingredientData = [],
      wastesData = [],
      dateFrom,
      dateTo,
    } = await req.json();

    const wb = XLSX.utils.book_new();

    const makeSheet = (data: any[], headers: string[], sheetName: string) => {
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
      XLSX.utils.book_append_sheet(wb, sheet, sheetName);
    };

    makeSheet(
      suppliesData.map((item: any) => [
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
      ]),
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
      "Поставки"
    );

    makeSheet(
      movesData.map((item: any) => [
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
      ]),
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
      "Перемещения"
    );

    makeSheet(
      ingredientData.map((item: any) => [
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
      ]),
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
      "Списания"
    );

    makeSheet(
      wastesData.map((item: any) => [
        item.waste_id,
        item.total_sum,
        item.total_sum_netto,
        item.user_id,
        item.storage_id,
        item.date,
        item.reason_id,
        item.reason_name,
        item.delete,
      ]),
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
      "Потери"
    );

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${dateFrom}-${dateTo}.xlsx"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (e) {
    console.error(e);
    return new Response("Xatolik: " + (e as Error).message, { status: 500 });
  }
}