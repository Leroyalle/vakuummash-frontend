import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { EmptyState, ErrorState } from './States'

type Props<T> = {
  query: UseQueryResult<T>
  skeleton: ReactNode
  isEmpty?: (d: T) => boolean
  empty?: ReactNode
  children: (data: T) => ReactNode
}

/** Единая обработка loading / error / empty для запросов. */
export function Async<T>({ query, skeleton, isEmpty, empty, children }: Props<T>) {
  if (query.isPending) return <>{skeleton}</>
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />
  if (isEmpty?.(query.data)) return <>{empty ?? <EmptyState />}</>
  return <>{children(query.data)}</>
}
