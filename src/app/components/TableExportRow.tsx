"use client";

import { useEffect, useState, useTransition } from "react";
import { format, set, subDays, subMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import * as XLSX from "xlsx";
import { fetchExportData } from "../actions/poster";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const today = new Date();
const MAX_ROWS = 30000;

const quickRanges = {
  today: { label: "Сегодня", from: today, to: today },
  yesterday: { label: "Вчера", from: subDays(today, 1), to: subDays(today, 1) },
  last7Days: { label: "Последняя неделя", from: subDays(today, 6), to: today },
  last30Days: { label: "Последний месяц", from: subDays(today, 29), to: today },
};

export default function TableExportRow({ code }: { code: string }) {
  const [range, setRange] = useState<DateRange>();
  const [showCalendar, setShowCalendar] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [token, setToken] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fromDate = range?.from ? format(range.from, "yyyy-MM-dd") : "";
  const toDate = range?.to ? format(range.to, "yyyy-MM-dd") : "";

  const title =
    range?.from && range?.to
      ? `${format(range.from, "dd.MM.yyyy", { locale: ru })} - ${format(
          range.to,
          "dd.MM.yyyy",
          { locale: ru }
        )}`
      : "Выберите дату";

  useEffect(() => {
    setToken("619530:145315755b9c1405fce29e66060cd2a4");

    const getToken = async () => {
      try {
        const res = await fetch(`/api/token?code=${code}`);
        const data = await res.json();
        setToken(data.token);
      } catch (err) {
        toast.error("Ошибка при получении токена");
      }
    };
    if (code) getToken();
  }, [code]);

  const splitAndAppendSheets = (
    wb: XLSX.WorkBook,
    data: any[],
    headers: string[],
    name: string
  ) => {
    for (let i = 0; i < data.length; i += MAX_ROWS) {
      const chunk = data.slice(i, i + MAX_ROWS);
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...chunk]);
      XLSX.utils.book_append_sheet(
        wb,
        sheet,
        `${name}_${Math.floor(i / MAX_ROWS) + 1}`
      );
    }
  };
  const handleExport = () => {
    if (!token || !fromDate || !toDate) {
      toast.error("Пожалуйста, выберите дату");
      setErrorMessage("Пожалуйста, выберите дату");
      return;
    }

    const fromTime = new Date(fromDate).getTime();
    const toTime = new Date(toDate).getTime();
    const dayDiff = (toTime - fromTime) / (1000 * 60 * 60 * 24);

    if (dayDiff > 31) {
      toast.error("Максимальный интервал — 1 месяц");
      setErrorMessage("Максимальный интервал — 1 месяц");
      return;
    }
    setErrorMessage("");

    startTransition(async () => {
      try {
        const { suppliesData, movesData, wastesData } =
          await fetchExportData(token, fromDate, toDate);

        console.log({ suppliesData, movesData, wastesData });

        const exportChunks = [
          {
            name: "Поставки",
            headers: [
              "Имя склада",
              "Склад",
              "Поставщик",
              "Дата",
              "Счёт",
              "Сумма",
              "Нетто",
              "Комментарий",
              "Имя поставщика",
              "Удалено",
            ],
            data: suppliesData.map((item: any) => [
              item.storage_name,
              item.storage_id,
              item.supplier_id,
              item.date,
              item.account_id,
              item.supply_sum,
              item.supply_sum_netto,
              item.supply_comment,
              item.supplier_name,
              item.delete,
            ]),
          },
          {
            name: "Списания",
            headers: [
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
            data: movesData.map((item: any) => [
              item.date,
              item.from_storage, // ✅ to‘g‘rilandi
              item.from_storage_name,
              item.to_storage, // ✅ to‘g‘rilandi
              item.to_storage_name,
              item.user_id,
              item.user_name,
              item.sum,
              item.sum_netto,
            ]),
          },
          // {
          //   name: "Списания",
          //   headers: [
          //     "ID",
          //     "Транзакция",
          //     "Склад",
          //     "Куда",
          //     "Ингр ID",
          //     "Продукт",
          //     "Модиф",
          //     "Полуф",
          //     "Вес",
          //     "Ед",
          //     "Сумма",
          //     "Нетто",
          //     "Официант ID",
          //     "Тип",
          //     "Время",
          //     "Дата",
          //     "Имя продукта",
          //     "Официант",
          //   ],
          //   data: ingredientData.map((item: any) => [
          //     item.write_off_id,
          //     item.transaction_id,
          //     item.storage_id,
          //     item.to_storage,
          //     item.ingredient_id,
          //     item.product_id,
          //     item.modificator_id,
          //     item.prepack_id,
          //     item.weight,
          //     item.unit,
          //     item.cost,
          //     item.cost_netto,
          //     item.user_id,
          //     item.type,
          //     item.time,
          //     item.date,
          //     item.product_name,
          //     item.name,
          //   ]),
          // },
          {
            name: "Потери",
            headers: [
              "Причина",
              "Сумма",
              "Нетто",
              "Польз ID",
              "Склад",
              "Дата",
              "Причина ID",
              "Удалено",
            ],
            data: wastesData.map((item: any) => [
              item.reason_name,
              item.total_sum,
              item.total_sum_netto,
              item.user_id,
              item.storage_id,
              item.date,
              item.reason_id,
              item.delete,
            ]),
          },
        ];

        const combinedWorkbook = XLSX.utils.book_new();
        let hasCombined = false;

        for (const { name, headers, data } of exportChunks) {
          if (data.length <= 10000) {
            const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
            XLSX.utils.book_append_sheet(combinedWorkbook, sheet, name);
            hasCombined = true;
          } else {
            for (let i = 0; i < data.length; i += MAX_ROWS) {
              const chunk = data.slice(i, i + MAX_ROWS);
              const wb = XLSX.utils.book_new();
              const sheet = XLSX.utils.aoa_to_sheet([headers, ...chunk]);
              XLSX.utils.book_append_sheet(wb, sheet, name);

              const index = Math.floor(i / MAX_ROWS) + 1;
              const arrayBuffer = XLSX.write(wb, {
                type: "array",
                bookType: "xlsx",
              });
              const blob = new Blob([arrayBuffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${fromDate}-${toDate}-${name}_${index}.xlsx`;
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            }
          }
        }

        if (hasCombined) {
          const arrayBuffer = XLSX.write(combinedWorkbook, {
            type: "array",
            bookType: "xlsx",
          });
          const blob = new Blob([arrayBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${fromDate}-${toDate}-Комбинированный.xlsx`;
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }

        toast.success("Файлы успешно скачаны!");
      } catch (err) {
        toast.error("Ошибка при экспорте данных");
        setErrorMessage("Ошибка при экспорте данных");
        console.error(err);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 border-b py-4 relative">
      <div className="flex flex-col justify-center items-center gap-4">
        {errorMessage && (
          <p className="text-center text-red-600 text-sm">{errorMessage}</p>
        )}
        <div className="flex gap-4 flex-wrap items-center">
          <div className="relative">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="border px-3 py-1 rounded bg-white hover:bg-gray-100 text-sm"
            >
              📅 {title}
            </button>

            {showCalendar && (
              <div className="absolute top-10 z-10 bg-white shadow-md border rounded p-2 min-w-[300px]">
                <DayPicker
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={1}
                  showOutsideDays
                  locale={ru}
                />
                <div className="flex flex-wrap gap-2 mt-2 justify-start">
                  {Object.entries(quickRanges).map(
                    ([key, { label, from, to }]) => (
                      <button
                        key={key}
                        onClick={() => setRange({ from, to })}
                        className="bg-gray-100 hover:bg-gray-200 text-xs px-2 py-1 rounded border"
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            disabled={isPending}
            className="flex items-center gap-2 underline text-blue-600 text-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" /> Загрузка...
              </>
            ) : (
              "Экспорт XLSX"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
