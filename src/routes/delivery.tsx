import { createFileRoute } from '@tanstack/react-router'
import { PageContent } from '@/components/sections/PageContent'

export const Route = createFileRoute('/delivery')({ component: () => <PageContent slug="delivery" title="Доставка" /> })
