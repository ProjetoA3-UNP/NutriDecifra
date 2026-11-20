// Ícones da interface. Usamos a biblioteca Lucide (SVG, traço de 2px) em todo o app.
// Colher e saleiro não existem na Lucide, então foram desenhados aqui no mesmo estilo.
import { createElement, type SVGProps } from 'react'
import {
  Apple,
  Ban,
  Banana,
  Beef,
  Beer,
  CakeSlice,
  Candy,
  Carrot,
  CircleCheck,
  Coffee,
  Cookie,
  CookingPot,
  Croissant,
  CupSoda,
  Droplet,
  Fish,
  FlaskConical,
  IceCreamCone,
  Milk,
  Nut,
  Salad,
  Sandwich,
  ShoppingBasket,
  Soup,
  TriangleExclamationPoint,
  Wheat,
  Wine,
  type LucideProps,
} from 'lucide-react'
import type { AlertKind, OffProduct, Severity } from '../lib/types'

type IconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }

function Svg({ size = 24, strokeWidth = 2, children, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

/** Colher de chá (medida usada no cálculo de açúcar) */
export function SpoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="16.5" cy="7.5" rx="3.5" ry="4.5" transform="rotate(45 16.5 7.5)" />
      <path d="m13.5 10.5-9.2 9.2a1.4 1.4 0 0 0 2 2l9.2-9.2" />
    </Svg>
  )
}

/** Saleiro (sódio) */
export function SaltIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 8a4 4 0 0 1 8 0" />
      <path d="M7 8h10l-1.2 12.1a1 1 0 0 1-1 .9H9.2a1 1 0 0 1-1-.9Z" />
      <path d="M11 4.5v-.5M13 4.5v-.5M12 2.5v0" />
    </Svg>
  )
}

type AnyIcon = React.ComponentType<IconProps>

// ---------------------------------------------------------------------------
// Ícone da categoria do produto (mostrado quando o produto não tem foto)
// ---------------------------------------------------------------------------
const CATEGORY_ICON: [RegExp, AnyIcon][] = [
  [/biscuit|cookie|wafer/, Cookie as AnyIcon],
  [/chocolate|cocoa|candies|confectioner|candy|bonbon/, Candy as AnyIcon],
  [/juice|nectar|soda|soft-drink|carbonated/, CupSoda as AnyIcon],
  [/water/, Droplet as AnyIcon],
  [/coffee|tea\b|teas/, Coffee as AnyIcon],
  [/milk|dairy-drink|yogurt|yoghurt|cheese/, Milk as AnyIcon],
  [/bread|toast|croissant/, Croissant as AnyIcon],
  [/cereal|granola|muesli|oat|flour|wheat/, Wheat as AnyIcon],
  [/nut|peanut|almond|cashew/, Nut as AnyIcon],
  [/chips|crisps|snack/, Sandwich as AnyIcon],
  [/banana/, Banana as AnyIcon],
  [/apple|fruit/, Apple as AnyIcon],
  [/vegetable|salad/, Salad as AnyIcon],
  [/carrot/, Carrot as AnyIcon],
  [/pasta|noodle|rice|bean|legume/, CookingPot as AnyIcon],
  [/soup/, Soup as AnyIcon],
  [/meat|sausage|ham|chicken/, Beef as AnyIcon],
  [/fish|tuna|sardine/, Fish as AnyIcon],
  [/ice-cream/, IceCreamCone as AnyIcon],
  [/cake|pastr/, CakeSlice as AnyIcon],
  [/beer/, Beer as AnyIcon],
  [/wine|alcohol/, Wine as AnyIcon],
]

function productIcon(p: Pick<OffProduct, 'categories_tags' | 'categories_hierarchy'>): AnyIcon {
  const cats = (p.categories_hierarchy ?? p.categories_tags ?? []).join(' ').toLowerCase()
  for (const [re, icon] of CATEGORY_ICON) if (re.test(cats)) return icon
  return ShoppingBasket
}

export function ProductIcon({
  product,
  size = 24,
  className,
}: {
  product: Pick<OffProduct, 'categories_tags' | 'categories_hierarchy'>
  size?: number
  className?: string
}) {
  return createElement(productIcon(product), { size, strokeWidth: 1.8, className, 'aria-hidden': true })
}

// ---------------------------------------------------------------------------
// Ícone de cada tipo de alerta
// ---------------------------------------------------------------------------
function alertIcon(kind: AlertKind, severity: Severity): AnyIcon {
  if (severity === 'positive') return CircleCheck
  switch (kind) {
    case 'gluten':
    case 'lactose':
      return Ban
    case 'sugar':
    case 'daily_sugar':
      return Candy
    case 'sodium':
      return SaltIcon
    case 'additives':
      return FlaskConical
    default:
      return TriangleExclamationPoint
  }
}

export function AlertIcon({ kind, severity, ...rest }: { kind: AlertKind; severity: Severity } & LucideProps) {
  return createElement(alertIcon(kind, severity), { 'aria-hidden': true, ...(rest as IconProps) })
}
