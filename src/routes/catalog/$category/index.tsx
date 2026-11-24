import { createFileRoute, notFound } from '@tanstack/react-router'
import { CatalogView } from '@/components/catalog/CatalogView'
import { q } from '@/api/queries'
import { catalogSearchSchema } from '@/lib/catalogSearch'

export const Route = createFileRoute('/catalog/$category/')({
  validateSearch: catalogSearchSchema,
  beforeLoad: async ({ params, context }) => {
    const categories = await context.queryClient.ensureQueryData(q.categories())
    if (!categories.some((c) => c.id === params.category)) throw notFound()
  },
  component: CategoryPage,
})

function CategoryPage() {
    const { category } = Route.useParams()
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    return (
      <CatalogView
        category={category}
        search={search}
        onChange={(patch) => void navigate({ search: (prev) => ({ ...prev, ...patch }) })}
      />
    )
}