import { contacts } from '@/data'

/** "show" — показывать цену, если она опубликована; "request" — всегда «Запросить цену». На старом сайте цен нет, поэтому товары без цены работают как "request". */
export type PriceMode = 'show' | 'request'
export const PRICE_MODE: PriceMode = 'show'

export const COMPANY = {
  name: 'ВАКУУММАШ-ЭЛЕКТРО',
  legal: contacts.legalName,
  phone: contacts.phone,
  email: contacts.email,
  address: `${contacts.postcode}, ${contacts.address}`,
}
