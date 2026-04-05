// lib/corpus.ts
export type Region = 'india' | 'uk' | 'usa'

export type DocType =
  | 'building_code'
  | 'planning_policy'
  | 'local_plan'
  | 'zoning_map'
  | 'housing_market'
  | 'contract_standard'
  | 'ppp_concession'
  | 'guidance_manual'
  | 'gis_map'
  | 'tender_procurement'
  | 'other'

export interface CorpusDoc {
  id: number
  title: string
  region: Region
  docType: DocType
  jurisdictionKey?: string
  topics: string[]
  createdAt: string
}

export function normalizeRegion(raw: string): Region {
  const r = raw.toLowerCase()

  if (r.includes('india') || r === 'in') return 'india'
  if (r.includes('uk') || r.includes('united kingdom')) return 'uk'
  // default
  return 'usa'
}

export function classifyDoc(title: string): {
  docType: DocType
  jurisdictionKey?: string
  topics: string[]
} {
  const t = title.toLowerCase()

  // India
  if (t.includes('national building code of india') || t.includes('udcpr') || t.includes('dcpr')) {
    return { docType: 'building_code', jurisdictionKey: 'IN-MH', topics: ['building_code'] }
  }
  if (t.includes('maharashtra regional and town planning act')) {
    return { docType: 'planning_policy', jurisdictionKey: 'IN-MH', topics: ['planning_act'] }
  }
  if (t.includes('rera')) {
    return { docType: 'planning_policy', jurisdictionKey: 'IN', topics: ['real_estate_regulation'] }
  }
  if (t.includes('bhuvan') || t.includes('bhunaksha') || t.includes('slum map')) {
    return { docType: 'gis_map', jurisdictionKey: 'IN-MH', topics: ['gis', 'land_use'] }
  }

  // UK
  if (t.includes('national planning policy framework')) {
    return { docType: 'planning_policy', jurisdictionKey: 'UK-ENG', topics: ['nppf'] }
  }
  if (t.includes('building regulations 2010') || t.includes('approved document l')) {
    return { docType: 'building_code', jurisdictionKey: 'UK-ENG', topics: ['building_regulations'] }
  }
  if (t.includes('local plan') || t.includes('city plan') || t.includes('policies map')) {
    return { docType: 'local_plan', jurisdictionKey: 'UK-ENG-LON', topics: ['local_plan'] }
  }
  if (t.includes('leti') || t.includes('net zero') || t.includes('whole life carbon')) {
    return { docType: 'guidance_manual', jurisdictionKey: 'UK-ENG', topics: ['net_zero', 'carbon'] }
  }

  // USA
  if (t.includes('international building code') || t.includes('ibc')) {
    return { docType: 'building_code', jurisdictionKey: 'US', topics: ['ibc'] }
  }
  if (t.includes('international residential code') || t.includes('irc')) {
    return { docType: 'building_code', jurisdictionKey: 'US', topics: ['irc'] }
  }
  if (t.includes('zoning handbook') || t.includes('zoning regulation') || t.includes('jamaica_zoning')) {
    return { docType: 'local_plan', jurisdictionKey: 'US-NY-NYC', topics: ['zoning'] }
  }
  if (t.includes('fema') || t.includes('flood risk')) {
    return { docType: 'guidance_manual', jurisdictionKey: 'US', topics: ['flood_risk'] }
  }
  if (
    t.includes('fidic') ||
    t.includes('development agreement') ||
    t.includes('general conditions of the contract') ||
    t.includes('public-private partnerships')
  ) {
    return { docType: 'contract_standard', jurisdictionKey: 'global', topics: ['contracts', 'ppp'] }
  }

  return { docType: 'other', topics: [] }
}
