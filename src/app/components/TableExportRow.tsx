"use client";

import { useEffect, useState, useTransition } from "react";
import { format, set, subDays, subMonths } from "date-fns";
import { is, ru } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import * as XLSX from "xlsx";
import { fetchExportData, fetchPosterApi } from "../actions/poster";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatCustomDate, formatSupplySum } from "../lib/functions";

const today = new Date();
const MAX_ROWS = 30000;

const quickRanges = {
  today: { label: "Сегодня", from: today, to: today },
  yesterday: { label: "Вчера", from: subDays(today, 1), to: subDays(today, 1) },
  last7Days: { label: "Последняя неделя", from: subDays(today, 6), to: today },
  last30Days: { label: "Последний месяц", from: subDays(today, 29), to: today },
};

const safePostMessage = (message: any, targetOrigin: string = "*") => {
  if (typeof window !== "undefined" && window.top && window.top !== window) {
    try {
      window.top.postMessage(message, targetOrigin);
    } catch (error) {
      console.warn("PostMessage failed:", error);
    }
  }
};

export default function TableExportRow({ code }: { code: string }) {
  const [range, setRange] = useState<DateRange>();
  const [showCalendar, setShowCalendar] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [token, setToken] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [productsData, setProductsData] = useState<any[]>([]);
  const [ingredientsData, setIngredientsData] = useState<any[]>([]);
  const [storesData, setStoresData] = useState<any[]>([]);

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

    // Xavfsiz load event handler
    const handleLoad = () => {
      safePostMessage({ hideSpinner: true });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("load", handleLoad, false);

      // Agar sahifa allaqachon yuklangan bo'lsa
      if (document.readyState === "complete") {
        handleLoad();
      }
    }

    const getToken = async () => {
      try {
        const res = await fetch(`/api/token?code=${code}`);
        const data = await res.json();
        console.log("Token fetch response:", data);
        setToken(data.token);
      } catch (err) {
        toast.error("Ошибка при получении токена");
      }
    };

    if (code) getToken();
    // Cleanup
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("load", handleLoad, false);
      }
    };
  }, [code]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        const [productsResponse, ingredientsResponse, storesData] =
          await Promise.all([
            fetchPosterApi(token, "menu.getProducts"),
            fetchPosterApi(token, "menu.getIngredients"),
            fetchPosterApi(token, "storage.getStorages"),
          ]);

        setProductsData(productsResponse.response || []);
        setIngredientsData(ingredientsResponse.response || []);
        setStoresData(storesData.response || []);
      } catch (err) {
        toast.error("Ошибка при получении данных");
        console.error(err);
      }
    };
    fetchData();
  }, [token]);

  const handleExport = async () => {
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

    
      try {
        setIsPending(true);
        let { suppliesData, movesData, wastesData } = await fetchExportData(
          token,
          fromDate,
          toDate
        );

        console.log({ suppliesData, movesData, wastesData });
        suppliesData = await Promise.all(
          suppliesData.map(async (item: any) => {
            const dataFetch = await fetchPosterApi(token, "storage.getSupply", {
              supply_id: item.supply_id,
            });

            const fullSupply = {
              ...dataFetch.response,
              storage_name: item.storage_name,
            };
            const ingredients = fullSupply.ingredients;

            if (!Array.isArray(ingredients)) {
              console.warn("ingredients is not array:", ingredients);
              return [];
            }

            return ingredients.map((element: any) => {
              let findRest;
              const findStore = storesData.find(
                (store: any) => store.storage_id == fullSupply.storage_id
              );
              if (element?.type == "10") {
                findRest = ingredientsData.find(
                  (ingredient: any) =>
                    ingredient.ingredient_id == element.ingredient_id
                );
                return {
                  ...fullSupply,
                  ...element,
                  ...findRest,
                  ingredient_unit:
                    element?.ingredient_unit == "kg"
                      ? "кг"
                      : element?.ingredient_unit == "p"
                      ? "шт"
                      : "л",
                  storage_name: findStore?.storage_name,
                };
              } else {
                findRest = productsData.find(
                  (product: any) => product.product_id == element.product_id
                );
                const findIngredient = ingredientsData.find(
                  (ing: any) => ing.ingredient_id == element?.ingredient_id
                );
                return {
                  ...element,
                  ...findRest,
                  ...fullSupply,
                  ...findIngredient,
                  ingredient_unit:
                    element?.ingredient_unit == "kg"
                      ? "кг"
                      : element?.ingredient_unit == "p"
                      ? "шт"
                      : "л",
                };
              }
            });
          })
        );
        suppliesData = suppliesData.flat();

        movesData = await Promise.all(
          movesData.map(async (item: any) => {
            const dataFetch = await fetchPosterApi(token, "storage.getMove", {
              move_id: item.moving_id,
            });

            const fullMoves = dataFetch.response[0];
            const ingredients = fullMoves.ingredients;

            if (!Array.isArray(ingredients)) {
              console.warn("ingredients is not array:", ingredients);
              return [];
            }

            return ingredients.map((element: any) => {
              let findRest;
              const findStore = storesData.find(
                (store: any) => store.storage_id == fullMoves.storage_id
              );
              if (element?.type == "10") {
                findRest = ingredientsData.find(
                  (ingredient: any) =>
                    ingredient.ingredient_id == element.ingredient_id
                );
                return {
                  ...fullMoves,
                  ...element,
                  ...findRest,
                  ingredient_unit:
                    findRest?.ingredient_unit == "kg"
                      ? "кг"
                      : findRest?.ingredient_unit == "p"
                      ? "шт"
                      : "л",
                  storage_name: findStore?.storage_name,
                };
              } else {
                findRest = productsData.find(
                  (product: any) => product.product_id == element.product_id
                );
                const findIngredient = ingredientsData.find(
                  (ing: any) => ing.ingredient_id == element?.ingredient_id
                );
                return {
                  ...element,
                  ...findRest,
                  ...fullMoves,
                  ...findIngredient,
                  ingredient_unit:
                    findIngredient?.unit == "kg"
                      ? "кг"
                      : findIngredient?.unit == "p"
                      ? "шт"
                      : "л",
                };
              }
            });
          })
        );

        movesData = movesData.flat();

        wastesData = await Promise.all(
          wastesData.map(async (item: any) => {
            const dataFetch = await fetchPosterApi(token, "storage.getWaste", {
              waste_id: item.waste_id,
            });
            const fullWastes = dataFetch.response;
            const elements = fullWastes.elements;

            if (!Array.isArray(elements)) {
              console.warn("elements is not array:", elements);
              return [];
            }
            return elements.map((element: any) => {
              let findRest;
              const findStore = storesData.find(
                (store: any) => store.storage_id == fullWastes.storage_id
              );
              if (element?.type == "10") {
                findRest = ingredientsData.find(
                  (ingredient: any) =>
                    ingredient.ingredient_id == element.ingredient_id
                );
                return {
                  ...fullWastes,
                  ...element,
                  ...findRest,
                  ingredient_unit:
                    findRest?.ingredient_unit == "kg"
                      ? "кг"
                      : findRest?.ingredient_unit == "p"
                      ? "шт"
                      : "л",
                  storage_name: findStore?.storage_name,
                };
              } else {
                findRest = productsData.find(
                  (product: any) => product.product_id == element.product_id
                );
                const findIngredient = ingredientsData.find(
                  (ing: any) =>
                    ing.ingredient_id == element.ingredients[0]?.ingredient_id
                );
                return {
                  ...element,
                  ...findRest,
                  ...fullWastes,
                  ...findIngredient,
                  ingredient_unit:
                    findIngredient?.unit == "kg"
                      ? "кг"
                      : findIngredient?.unit == "p"
                      ? "шт"
                      : "л",
                };
              }
            });
          })
        );

        wastesData = wastesData.flat();

        console.log({ suppliesData, movesData, wastesData });

        const exportChunks = [
          {
            name: "Поставки",
            headers: [
              "№",
              "Дата",
              "Поставщик",
              "Товар",
              "Кол-во",
              "Ед. изм.",
              "Сумма без НДС",
              "Склад",
              "Счёт",
              "Сотрудник",
            ],
            data: suppliesData?.map((item: any) => [
              item.supply_id,
              formatCustomDate(String(item.date)),
              item.supplier_name,
              item?.ingredient_name,
              item?.supply_ingredient_num,
              item?.ingredient_unit,
              formatSupplySum(Number(item?.supply_ingredient_sum_netto)) +
                " СУМ",
              item.storage_name,
              item.account_id,
              "",
            ]),
          },
          {
            name: "Перемещения",
            headers: [
              "Дата",
              "Наименование",
              "Кол-во",
              "Ед. изм.",
              "Сумма без НДС",
              "Комментарий",
              "Склад отгрузки",
              "Склад приемки",
              "Сотрудник",
            ],
            data: movesData.map((item: any) => [
              formatCustomDate(String(item.date)),
              item?.type == 10 ? item?.ingredient_name : item?.product_name,
              item?.ingredient_num,
              item?.ingredient_unit,
              formatSupplySum(Number(item?.ingredient_sum_netto)) + " СУМ",
              "",
              item.to_storage_name,
              item.from_storage_name,
              item.user_name,
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
            name: "Списания",
            headers: [
              "Дата",
              "Склад",
              "Что списывается",
              "Кол-во",
              "Ед-ца измерения",
              "Сумма без НДС",
              // "Сотрудник",
              "Причина",
            ],
            data: wastesData.map((item: any) => [
              formatCustomDate(String(item.date)),
              item.storage_name,
              item?.type == 10 ? item?.ingredient_name : item?.product_name,
              item?.type == 10 ? item?.ingredient_left : item?.count,
              item?.ingredient_unit,
              item?.type == 10
                ? formatSupplySum(Number(item?.total_sum_netto)) + " СУМ"
                : formatSupplySum(Number(item?.cost_netto)) + " СУМ",
              // item.user_id,
              item.reason_name,
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
        setIsPending(false);
        toast.error("Ошибка при экспорте данных");
        setErrorMessage("Ошибка при экспорте данных");
        console.error(err);
      }finally{
        setIsPending(false);
      }
  };

  return (
    <div className="flex flex-col gap-4 border-b py-4 relative">
      {isPending && (
        <div className="z-[999] h-screen absolute top-0 left-0 w-screen flex justify-center items-center backdrop-blur-[3px]">
          <div className="spinner center">
            <div className="spinner-blade"></div>
            <div className="spinner-blade"></div>
            <div className="spinner-blade"></div>
            <div className="spinner-blade"></div>
            <div className="spinner-blade"></div>
            <div className="spinner-blade"></div>
            <div className="spinner-blade"></div>
            <div className="spinner-blade"></div>
            <div className="spinner-blade"></div>
            <div className="spinner-blade"></div>
            <div className="spinner-blade"></div>
            <div className="spinner-blade"></div>
          </div>
          <h1 className="pt-10">
            Пожалуйста, подождите, идет загрузка данных...
          </h1>
        </div>
      )}
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