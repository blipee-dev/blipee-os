'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CreateSBTITargetModal } from './CreateSBTITargetModal'
import styles from '../dashboard.module.css'
import cardStyles from './sbti.module.css'

interface SBTIMainContentProps {
  targets: any[]
  organizationId: string
}

export function SBTIMainContent({ targets, organizationId }: SBTIMainContentProps) {
  const router = useRouter()
  const [isWizardOpen, setIsWizardOpen] = useState(false)

  const handleModalClose = () => {
    setIsWizardOpen(false)
  }

  if (targets.length === 0) {
    return (
      <>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '3rem',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <svg style={{ width: '64px', height: '64px', marginBottom: '1.5rem', color: 'var(--green)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v18M3 12h18" />
            <path d="M19.07 4.93l-14.14 14.14M4.93 4.93l14.14 14.14" />
          </svg>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Ainda sem objetivos SBTi
          </h2>
          <p style={{ marginBottom: '2rem', color: 'var(--text-tertiary)', maxWidth: '500px' }}>
            Comece por definir o seu primeiro objetivo baseado em ciência alinhado
            com limitar o aquecimento global a 1.5°C.
          </p>
          <button
            onClick={() => setIsWizardOpen(true)}
            className={styles.filterButton}
            style={{ background: 'var(--green)', color: 'white', borderColor: 'var(--green)' }}
          >
            Criar Primeiro Objetivo
          </button>
        </div>

        <CreateSBTITargetModal
          isOpen={isWizardOpen}
          onClose={handleModalClose}
        />
      </>
    )
  }

  return (
    <>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Objetivos Ativos
        </h2>
        <button
          onClick={() => setIsWizardOpen(true)}
          className={styles.filterButton}
          style={{ background: 'var(--green)', color: 'white', borderColor: 'var(--green)' }}
        >
          + Novo Objetivo
        </button>
      </div>

      <div className={cardStyles.targetsList}>
        {targets.map((target) => (
          <TargetCard key={target.id} target={target} />
        ))}
      </div>

      <CreateSBTITargetModal
        isOpen={isWizardOpen}
        onClose={handleModalClose}
      />
    </>
  )
}

function TargetCard({ target }: { target: any }) {
  const getStatusBadge = (status: string) => {
    const badgeClasses: Record<string, string> = {
      validated: cardStyles['badge--validated'],
      draft: cardStyles['badge--draft'],
      submitted: cardStyles['badge--submitted'],
      rejected: cardStyles['badge--rejected'],
    }

    const statusLabels: Record<string, string> = {
      validated: 'Validado',
      draft: 'Rascunho',
      submitted: 'Submetido',
      rejected: 'Rejeitado',
      needs_recalculation: 'Requer Recálculo',
    }

    return (
      <span className={`${cardStyles.badge} ${badgeClasses[status] || ''}`}>
        {statusLabels[status] || status}
      </span>
    )
  }

  const getScopeLabel = (scope: string) => {
    const labels: Record<string, string> = {
      scope1: 'Âmbito 1',
      scope1_2: 'Âmbitos 1 & 2',
      scope3: 'Âmbito 3',
      scope1_2_3: 'Âmbitos 1, 2 & 3',
    }
    return labels[scope] || scope
  }

  const getTypeLabel = (type: string) => {
    return type === 'near_term' ? 'Curto Prazo' : 'Longo Prazo (Net-Zero)'
  }

  const getAmbitionLabel = (ambition: string) => {
    const labels: Record<string, string> = {
      '1.5C': '1.5°C',
      'well_below_2C': 'Bem Abaixo de 2°C',
      '2C': '2°C',
    }
    return labels[ambition] || ambition
  }

  const calculateProgress = () => {
    const currentYear = new Date().getFullYear()
    const totalYears = target.target_year - target.base_year
    const yearsPassed = currentYear - target.base_year
    return Math.min((yearsPassed / totalYears) * 100, 100)
  }

  const progress = calculateProgress()

  return (
    <Link href={`/dashboard/sbti/${target.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className={cardStyles.targetCard}>
        <div className={cardStyles.targetCard__header}>
          <div>
            <h3 className={cardStyles.targetCard__title}>
              {getTypeLabel(target.target_type)} - {getScopeLabel(target.scope)}
            </h3>
            <p className={cardStyles.targetCard__subtitle}>
              {target.base_year} → {target.target_year} | Ambição: {getAmbitionLabel(target.ambition_level)}
            </p>
          </div>
          {getStatusBadge(target.validation_status)}
        </div>

        <div className={cardStyles.targetCard__metrics}>
          <div className={cardStyles.metric}>
            <span className={cardStyles.metric__label}>Emissões Ano-Base</span>
            <span className={cardStyles.metric__value}>
              {target.base_year_total?.toLocaleString() || 'N/A'} tCO₂e
            </span>
          </div>
          <div className={cardStyles.metric}>
            <span className={cardStyles.metric__label}>Emissões Alvo</span>
            <span className={cardStyles.metric__value}>
              {target.target_year_total?.toLocaleString() || 'N/A'} tCO₂e
            </span>
          </div>
          <div className={cardStyles.metric}>
            <span className={cardStyles.metric__label}>Redução Necessária</span>
            <span className={cardStyles.metric__value}>
              {target.reduction_percentage?.toFixed(1) || 'N/A'}%
            </span>
          </div>
          <div className={cardStyles.metric}>
            <span className={cardStyles.metric__label}>Método</span>
            <span className={cardStyles.metric__value}>
              {target.method === 'absolute_contraction' ? 'Absoluto' : target.method}
            </span>
          </div>
        </div>

        {target.validation_status === 'validated' && (
          <div className={cardStyles.progress}>
            <div className={cardStyles.progress__header}>
              <span className={cardStyles.progress__label}>Progresso da Trajetória</span>
              <span className={cardStyles.progress__value}>{progress.toFixed(0)}%</span>
            </div>
            <div className={cardStyles.progressBar}>
              <div
                className={`${cardStyles.progressBar__fill} ${cardStyles['progressBar__fill--onTrack']}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
