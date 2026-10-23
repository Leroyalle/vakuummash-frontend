import { createFileRoute, notFound } from '@tanstack/react-router'
import { CatalogView } from '@/components/catalog/CatalogView'
import { categories } from '@/data'
import { catalogSearchSchema } from '@/lib/catalogSearch'

export const Route = createFileRoute('/catalog/$category/')({
  validateSearch: catalogSearchSchema,
  beforeLoad: ({ params }) => {
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
        onReset={() => void navigate({ search: {} })}
      />
    )
}