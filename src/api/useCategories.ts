import { useQuery } from '@tanstack/react-query'
import { q } from './queries'

/** Категории нужны шапке, подвалу и фильтрам; пока грузятся — пустой список. */
export function useCategories() {
  const query = useQuery(q.categories())
  return { categories: query.data ?? [], isPending: query.isPending, query }
}
