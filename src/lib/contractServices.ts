import { Contract, Service } from '@/types';

export function contractServiceIds(contract: Contract): string[] {
  if (contract.serviceIds?.length) return contract.serviceIds;
  if (contract.serviceId) return [contract.serviceId];
  return [];
}

export function formatContractServices(contract: Contract, catalog: Service[] = []): string {
  const ids = contractServiceIds(contract);
  if (ids.length === 0) return '—';
  const names = ids.map((id) => catalog.find((s) => s.id === id)?.name ?? id);
  return names.join(', ');
}
