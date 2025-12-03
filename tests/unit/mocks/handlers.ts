import { dataDir } from '@/utils/loadData'
import { http, HttpResponse } from 'msw'
import summaryTableDeathsDiseaseCountry from '../../../public/data/json/summary_table_deaths_disease_country.json'
import summaryTableDeathsDiseaseSubregion from '../../../public/data/json/summary_table_deaths_disease_subregion.json'

export const handlers = [
  http.get(`${dataDir}/summary_table_deaths_disease_country.json`, () => {
    return HttpResponse.json(summaryTableDeathsDiseaseCountry);
  }),
  http.get(`${dataDir}/summary_table_deaths_disease_subregion.json`, () => {
    return HttpResponse.json(summaryTableDeathsDiseaseSubregion);
  }),
]
