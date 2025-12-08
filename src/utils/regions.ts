import WHOSubRegions from "../data/WHORegions.json" with { type: "json" };

type SubregionRow = {
  country: string;
  country_name: string;
  subregion: string;
}

export const getSubregionFromCountry = (iso3: string) => {
  return WHOSubRegions.find((r: SubregionRow) => r.country === iso3)?.subregion || "";
};

export const getCountryName = (iso3: string) => {
  return WHOSubRegions.find((r: SubregionRow) => r.country === iso3)?.country_name || "";
}
