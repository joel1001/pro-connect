/**
 * Costa Rica location data via `react-select-costarica-location` (official
 * provincias → cantones → distritos). Used client-side for offline cascades.
 */
import { PROVINCIAS } from 'react-select-costarica-location/src/data';

export const COSTA_RICA_COUNTRY_CODE = 'CR';
export const COSTA_RICA_COUNTRY_NAME = 'Costa Rica';

export interface CostaRicaLocationOption {
  id: string;
  name: string;
  children: CostaRicaLocationOption[];
}

const collator = new Intl.Collator('es-CR', { sensitivity: 'base' });

function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => collator.compare(a.name, b.name));
}

export function getCostaRicaProvinces(): CostaRicaLocationOption[] {
  return sortByName(
    Object.entries(PROVINCIAS).map(([provCode, prov]) => ({
      id: `CR-P${provCode}`,
      name: prov.nombre,
      children: sortByName(
        Object.entries(prov.cantones).map(([cantonCode, canton]) => ({
          id: `CR-P${provCode}-C${cantonCode}`,
          name: canton.nombre,
          children: sortByName(
            Object.entries(canton.distritos).map(([distCode, distName]) => ({
              id: `CR-P${provCode}-C${cantonCode}-D${distCode}`,
              name: distName,
              children: [],
            })),
          ),
        })),
      ),
    })),
  );
}
