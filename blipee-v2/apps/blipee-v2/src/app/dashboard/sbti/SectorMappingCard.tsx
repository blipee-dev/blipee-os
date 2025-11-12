/* eslint-disable react/no-unescaped-entities */
'use client'

import { useEffect, useState } from 'react'
import { getOrganizationSBTiSector } from '@/app/actions/sbti/sector'
import type { SBTiSector } from '@/lib/sbti/sector-mapping'
import styles from './sbti.module.css'

interface SectorInfo {
  sector: SBTiSector
  displayName: string
  confidence: 'high' | 'medium' | 'low'
  method: 'gri' | 'naics' | 'keyword' | 'default'
  availableScenarios: string[]
  yearRange: { from: number; to: number }
  alternatives?: Array<{ sector: SBTiSector; reason: string }>
}

export function SectorMappingCard() {
  const [sectorInfo, setSectorInfo] = useState<SectorInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAlternatives, setShowAlternatives] = useState(false)

  useEffect(() => {
    async function fetchSector() {
      setLoading(true)
      const result = await getOrganizationSBTiSector()

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setSectorInfo(result.data)
      }

      setLoading(false)
    }

    fetchSector()
  }, [])

  if (loading) {
    return (
      <div className={styles.sectorCard}>
        <div className={styles.loading}>A carregar informação do setor...</div>
      </div>
    )
  }

  if (error || !sectorInfo) {
    return (
      <div className={styles.sectorCard}>
        <div className={styles.error}>Erro ao carregar setor: {error}</div>
      </div>
    )
  }

  const confidenceColor = {
    high: '#10b981',
    medium: '#f59e0b',
    low: '#ef4444',
  }[sectorInfo.confidence]

  const confidenceLabel = {
    high: 'Alta Confiança',
    medium: 'Confiança Média',
    low: 'Baixa Confiança',
  }[sectorInfo.confidence]

  const methodLabel = {
    gri: 'Baseado no código GRI da organização',
    naics: 'Baseado no código NAICS',
    keyword: 'Baseado nas palavras-chave da indústria',
    default: 'Setor genérico (cross-sector)',
  }[sectorInfo.method]

  return (
    <div className={styles.sectorCard}>
      <div className={styles.sectorHeader}>
        <h3>Setor SBTi da Organização</h3>
        <span className={styles.confidenceBadge} style={{ borderColor: confidenceColor, color: confidenceColor }}>
          {confidenceLabel}
        </span>
      </div>

      <div className={styles.sectorContent}>
        <div className={styles.sectorMain}>
          <div className={styles.sectorName}>{sectorInfo.displayName}</div>
          <div className={styles.sectorMethod}>{methodLabel}</div>
        </div>

        <div className={styles.sectorDetails}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Cenários disponíveis:</span>
            <div className={styles.scenarioTags}>
              {sectorInfo.availableScenarios.map((scenario) => (
                <span key={scenario} className={styles.scenarioTag}>
                  {scenario === 'SBTi_1.5C' ? '1.5°C' : scenario}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Cobertura temporal:</span>
            <span className={styles.detailValue}>
              {sectorInfo.yearRange.from} - {sectorInfo.yearRange.to}
            </span>
          </div>
        </div>

        {sectorInfo.alternatives && sectorInfo.alternatives.length > 0 && (
          <div className={styles.sectorAlternatives}>
            <button
              className={styles.alternativesToggle}
              onClick={() => setShowAlternatives(!showAlternatives)}
            >
              {showAlternatives ? '▼' : '▶'} Sugestões de setores alternativos
            </button>

            {showAlternatives && (
              <div className={styles.alternativesList}>
                <p className={styles.alternativesNote}>
                  O setor atual foi selecionado automaticamente como "cross-sector" porque não
                  conseguimos determinar um setor específico. Considere atualizar a informação da
                  sua organização se algum destes setores for mais apropriado:
                </p>
                {sectorInfo.alternatives.map((alt) => (
                  <div key={alt.sector} className={styles.alternativeItem}>
                    <strong>{alt.sector}</strong>
                    <p>{alt.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {sectorInfo.confidence === 'low' && (
          <div className={styles.sectorWarning}>
            ⚠️ Confiança baixa na seleção automática do setor. Recomendamos configurar o setor GRI
            ou NAICS da sua organização nas definições para obter recomendações mais precisas.
          </div>
        )}
      </div>
    </div>
  )
}
