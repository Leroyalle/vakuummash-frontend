import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { ResourceAdmin } from '@/components/admin/ResourceAdmin'
import { resources } from '@/components/admin/resources'

export const Route = createFileRoute('/admin/content/$type')({
  validateSearch: z.object({ new: z.boolean().optional().catch(undefined) }),
  beforeLoad: ({ params }) => {
    if (!(params.type in resources)) throw notFound()
  },
  component: ContentAdmin,
})

function ContentAdmin() {
  const { type } = Route.useParams()
  const { new: isNew } = Route.useSearch()
  return <ResourceAdmin key={`${type}:${isNew ? 'new' : ''}`} def={resources[type]} autoNew={isNew} />
}
