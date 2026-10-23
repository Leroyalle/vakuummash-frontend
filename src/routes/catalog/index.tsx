import { createFileRoute } from '@tanstack/react-router'
import { CatalogView } from '@/components/catalog/CatalogView'
import { catalogSearchSchema } from '@/lib/catalogSearch'

export const Route = createFileRoute('/catalog/')({
  validateSearch: catalogSearchSchema,
  component: CatalogIndex,
})

function CatalogIndex() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    return (
      <CatalogView
        search={search}
        onChange={(patch) => void navigate({ search: (prev) => ({ ...prev, ...patch }) })}
        onReset={() => void navigate({ search: {} })}
      />
    )
}