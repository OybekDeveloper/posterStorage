"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { fetchExportData } from "../actions/poster";

const today = new Date();
const predefinedRanges = {
  today: [today, today],
  last7Days: [new Date(today.getTime() - 6 * 86400000), today],
  last30Days: [new Date(today.getTime() - 29 * 86400000), today],
};

export default function TableExportRow({ code }: { code: string }) {
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [token, setToken] = useState("");

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
    const getToken = async () => {
      try {
        const res = await fetch(`/api/token?code=${code}`);
        const data = await res.json();
        setToken(data.token);
      } catch (err) {
        console.error("Token olishda xatolik:", err);
      }
    };
    if (code) getToken();
  }, [code]);

  const handleExport = () => {
    if (!token || !fromDate || !toDate) {
      console.log({ token, fromDate, toDate });
      console.error("Token yoki sana tanlanmagan");
      return;
    }

    startTransition(async () => {
      const data = await fetchExportData(token, fromDate, toDate);

      const res = await fetch("/api/export-xlsx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          dateFrom: fromDate,
          dateTo: toDate,
        }),
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fromDate}-${toDate}.xlsx`;
      a.click();
      a.remove();
    });
  };

  return (
    <div className="flex flex-col gap-4 border-b py-4 relative">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
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
                  {Object.entries(predefinedRanges).map(
                    ([label, [from, to]]) => (
                      <button
                        key={label}
                        onClick={() => setRange({ from, to })}
                        className="bg-gray-100 hover:bg-gray-200 text-xs px-2 py-1 rounded border"
                      >
                        {
                          {
                            today: "Сегодня",
                            last7Days: "Последняя неделя",
                            last30Days: "Последний месяц",
                          }[label]
                        }
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
            className="underline text-blue-600 text-sm"
          >
            {isPending ? "Загрузка..." : "Экспорт XLSX"}
          </button>
        </div>
      </div>
    </div>
  );
}
