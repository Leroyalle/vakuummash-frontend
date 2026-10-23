import type { ButtonHTMLAttributes } from 'react'
import { buttonClass } from './buttonStyles'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Parameters<typeof buttonClass>[0]
  size?: Parameters<typeof buttonClass>[1]
}

export function Button({ variant, size, className, type = 'button', ...rest }: Props) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />
}
