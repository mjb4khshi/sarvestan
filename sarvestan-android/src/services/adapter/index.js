import { kntuAdapter } from './kntu';
import { sbuAdapter } from './sbu';
import { getSelectedUniversity } from '../behestan/session';

export { kntuAdapter } from './kntu';
export { sbuAdapter } from './sbu';

export const adapters = {
  [kntuAdapter.id]: kntuAdapter,
  [sbuAdapter.id]: sbuAdapter,
  kntu: kntuAdapter,
  sbu: sbuAdapter,
};

export function getAdapter(id) {
  const targetId = id || (getSelectedUniversity() === 'sbu' ? 'sbu-behestan' : 'kntu-behestan');
  return adapters[targetId] || kntuAdapter;
}
