/** Perfil de acesso: Consumidor, Nutricionista ou Administrador */
export type Role = 'consumer' | 'nutritionist' | 'admin'

export type Restriction = 'gluten' | 'lactose' | 'sugar' | 'sodium'
export type Goal = 'reduce_sugar' | 'reduce_sodium' | 'eat_better' | 'avoid_ultra'
export type Grade = 'a' | 'b' | 'c' | 'd' | 'e'
export type Severity = 'critical' | 'attention' | 'positive'
export type AlertKind =
  | 'gluten'
  | 'gluten_traces'
  | 'lactose'
  | 'lactose_traces'
  | 'sugar'
  | 'daily_sugar'
  | 'sat_fat'
  | 'sodium'
  | 'additives'
  | 'good_choice'

export interface AccessibilityPrefs {
  largeText?: boolean
  highContrast?: boolean
  voice?: boolean
  reduceMotion?: boolean
  simpleLanguage?: boolean
}

export interface Profile {
  id: string
  name: string | null
  email: string | null
  restrictions: Restriction[]
  goal: Goal
  sugar_limit_g: number
  sodium_limit_mg: number
  realtime_alerts: boolean
  notifications: boolean
  accessibility: AccessibilityPrefs
  plan: string
  /** ausente quando o banco ainda não recebeu a migration 002 (vale como consumer) */
  role?: Role
  created_at: string
}

/** Dados de produto vindos do Open Food Facts (apenas os campos usados). */
export interface OffProduct {
  code: string
  product_name?: string
  product_name_pt?: string
  generic_name_pt?: string
  brands?: string
  quantity?: string
  product_quantity?: number | string
  serving_quantity?: number | string
  serving_size?: string
  image_front_small_url?: string
  image_front_url?: string
  nutriscore_grade?: string
  nova_group?: number
  nutriments?: Record<string, number | string | undefined>
  nutrient_levels?: { sugars?: string; salt?: string; fat?: string; 'saturated-fat'?: string }
  allergens_tags?: string[]
  traces_tags?: string[]
  additives_n?: number
  additives_tags?: string[]
  categories_tags?: string[]
  categories_hierarchy?: string[]
  categories?: string
  ingredients_text_pt?: string
  ingredients_text?: string
  popularity_key?: number
  labels_tags?: string[]
  countries_tags?: string[]
}

export interface Scan {
  id: string
  user_id: string
  barcode: string
  product_name: string
  brand: string | null
  quantity: string | null
  image_url: string | null
  nutriscore: Grade | null
  nova_group: number | null
  sugars_100g: number | null
  sat_fat_100g: number | null
  sodium_100g: number | null
  fiber_100g: number | null
  additives_count: number | null
  serving_g: number | null
  category: string | null
  product: OffProduct
  saved: boolean
  favorite: boolean
  replaced_scan_id: string | null
  created_at: string
}

export interface AlertRow {
  id: string
  user_id: string
  scan_id: string | null
  kind: AlertKind
  severity: Severity
  title: string
  description: string
  product_name: string | null
  read: boolean
  created_at: string
}

export interface PointsEvent {
  id: string
  user_id: string
  points: number
  reason: string
  ref: string | null
  created_at: string
}

/** Vínculo paciente ↔ nutricionista, autorizado pelo paciente */
export interface CareLink {
  id: string
  patient_id: string
  nutritionist_id: string
  status: 'active' | 'revoked'
  created_at: string
  revoked_at: string | null
}
