"use client";

import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

const today = new Date();

const predefinedRanges = {
  today: [today, today],
  last7Days: [new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000), today],
  last30Days: [new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000), today],
  last3Months: [
    new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()),
    today,
  ],
  lastYear: [
    new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()),
    today,
  ],
};

export default function TableExportRow({
  code,
  table,
}: {
  code: string;
  table: string;
}) {
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);

  const fromDate = range?.from ? format(range.from, "yyyy-MM-dd") : "";
  const toDate = range?.to ? format(range.to, "yyyy-MM-dd") : "";

  const title =
    range?.from && range?.to
      ? `${format(range.from, "dd.MM.yyyy", { locale: ru })} - ${format(
          range.to,
          "dd.MM.yyyy",
          { locale: ru }
        )}`
      : range?.from
      ? `${format(range.from, "dd.MM.yyyy", { locale: ru })}`
      : "Выберите дату";

  return (
    <div className="flex flex-col gap-4 border-b py-4 relative">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <div className="flex gap-4 flex-wrap items-center">
          <div className="relative">
            {code || ""}
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
                  onSelect={(value) => setRange(value)}
                  numberOfMonths={1}
                  showOutsideDays
                  locale={ru}
                />

                {/* Быстрые диапазоны */}
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
                            last3Months: "Последние 3 месяца",
                            lastYear: "Последний год",
                          }[label]
                        }
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            className="underline text-blue-600 text-sm"
            href={`/api/tables/${table}?format=xlsx&dateFrom=${fromDate}&dateTo=${toDate}&code=${code}`}
          >
            Экспорт XLSX
          </Link>
        </div>
      </div>
    </div>
  );
}
