export type Role = 'admin' | 'editor' | 'manager' | 'customer'
export type AuthUser = { id: string; email: string; name: string; company: string | null; phone: string | null; role: Role; isActive: boolean }

export const roleLabels: Record<Role, string> = { admin: 'Администратор', editor: 'Редактор', manager: 'Менеджер', customer: 'Клиент' }
/** Сотрудник: любая роль, кроме клиента. */
export const isStaff = (u: AuthUser | null) => !!u && u.role !== 'customer'
export const hasRole = (u: AuthUser | null, ...roles: Role[]) => !!u && (u.role === 'admin' || roles.includes(u.role))
