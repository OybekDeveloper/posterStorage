"use server";

export async function fetchExportData(token: string, from: string, to: string) {
  const base = "https://joinposter.com/api";
  const url = (endpoint: string) =>
    `${base}/${endpoint}?token=${token}&dateFrom=${from}&dateTo=${to}`;

  const [suppliesRes, movesRes, wastesRes] = await Promise.all([
    fetch(url("storage.getSupplies")),
    fetch(url("storage.getMoves")),
    // fetch(url("storage.getIngredientWriteOff")),
    fetch(url("storage.getWastes")),
  ]);

  const [suppliesData, movesData, wastesData] = await Promise.all([
    suppliesRes.json(),
    movesRes.json(),
    // ingredientRes.json(),
    wastesRes.json(),
  ]);

  return {
    suppliesData: suppliesData.response ?? [],
    movesData: movesData.response ?? [],
    // ingredientData: ingredientData.response ?? [],
    wastesData: wastesData.response ?? [],
  };
}

export async function fetchPosterApi(
  token: string,
  endpoint: string,
  params: Record<string, string> = {}
) {
  const base = "https://joinposter.com/api";
  const url = new URL(`${base}/${endpoint}`);
  url.searchParams.set("token", token);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Error fetching data from Poster API: ${response.statusText}`);
  }

  return response.json();
}
