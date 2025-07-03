"use server";

export async function fetchExportData(token: string, from: string, to: string) {
  const base = "https://joinposter.com/api";
  const url = (endpoint: string) =>
    `${base}/${endpoint}?token=${token}&dateFrom=${from}&dateTo=${to}`;

  const [suppliesRes, movesRes, ingredientRes, wastesRes] = await Promise.all([
    fetch(url("storage.getSupplies")),
    fetch(url("storage.getSupplies")),
    fetch(url("storage.getIngredientWriteOff")),
    fetch(url("storage.getWastes")),
  ]);

  const [suppliesData, movesData, ingredientData, wastesData] =
    await Promise.all([
      suppliesRes.json(),
      movesRes.json(),
      ingredientRes.json(),
      wastesRes.json(),
    ]);

  return {
    suppliesData: suppliesData.response ?? [],
    movesData: movesData.response ?? [],
    ingredientData: ingredientData.response ?? [],
    wastesData: wastesData.response ?? [],
  };
}
