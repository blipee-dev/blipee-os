'use client'

/**
 * SBTi Target Details View
 * Displays comprehensive information about a science-based target
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSBTITarget, deleteSBTITarget, addSBTIProgress } from '@/app/actions/sbti'
import styles from './target-details.module.css'

// ============================================================================
// TYPES
// ============================================================================

interface TargetDetailsViewProps {
  target: any
  progress: any[]
  organizationId: string
}

interface AddProgressModalProps {
  targetId: string
  targetYear: number
  baseYear: number
  onClose: () => void
  onSuccess: () => void
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TargetDetailsView({ target, progress, organizationId }: TargetDetailsViewProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAddProgress, setShowAddProgress] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este objetivo? Esta ação não pode ser desfeita.')) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const result = await deleteSBTITarget(target.id)

      if (result.error) {
        setError(result.error)
        return
      }

      router.push('/dashboard/sbti')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir objetivo')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExport = () => {
    // TODO: Implement export to PDF/Excel
    alert('Funcionalidade de exportação em desenvolvimento')
  }

  const refreshPage = () => {
    router.refresh()
  }

  // ============================================================================
  // CALCULATIONS
  // ============================================================================

  const totalBaseYear =
    (target.base_year_scope1 || 0) +
    (target.base_year_scope2_location || 0) +
    (target.base_year_scope3 || 0)

  const totalTargetYear =
    (target.target_year_scope1 || 0) +
    (target.target_year_scope2 || 0) +
    (target.target_year_scope3 || 0)

  const reductionPercentage = target.reduction_percentage || 0
  const yearsRemaining = target.target_year - new Date().getFullYear()
  const totalYears = target.target_year - target.base_year
  const progressPercentage = ((totalYears - yearsRemaining) / totalYears) * 100

  // Get latest progress entry
  const latestProgress = progress.length > 0 ? progress[progress.length - 1] : null

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={styles.targetDetails}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <a href="/dashboard/sbti" className={styles.backLink}>
            ← Voltar aos Objetivos
          </a>
          <h1>{getTargetTitle(target)}</h1>
          <div className={styles.targetMeta}>
            <span className={styles.badge} data-type={target.target_type}>
              {target.target_type === 'near_term' ? 'Curto Prazo' : 'Longo Prazo'}
            </span>
            <span className={styles.badge} data-status={target.validation_status}>
              {getStatusLabel(target.validation_status)}
            </span>
            <span className={styles.badge}>
              {target.base_year} → {target.target_year}
            </span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={handleExport}
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            📄 Exportar
          </button>
          {target.validation_status === 'draft' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className={`${styles.button} ${styles.buttonDanger}`}
            >
              {isDeleting ? 'A excluir...' : '🗑️ Excluir'}
            </button>
          )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Summary Cards */}
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryCard__label}>Redução Requerida</div>
          <div className={styles.summaryCard__value}>{reductionPercentage.toFixed(1)}%</div>
          <div className={styles.summaryCard__subtitle}>
            de {totalBaseYear.toFixed(0)} para {totalTargetYear.toFixed(0)} tCO2e
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryCard__label}>Taxa Anual</div>
          <div className={styles.summaryCard__value}>
            {target.annual_reduction_rate?.toFixed(1) || 'N/A'}%
          </div>
          <div className={styles.summaryCard__subtitle}>redução por ano</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryCard__label}>Progresso no Tempo</div>
          <div className={styles.summaryCard__value}>{progressPercentage.toFixed(0)}%</div>
          <div className={styles.summaryCard__subtitle}>
            {yearsRemaining > 0 ? `${yearsRemaining} anos restantes` : 'Objetivo alcançado'}
          </div>
        </div>

        {latestProgress && (
          <div className={styles.summaryCard}>
            <div className={styles.summaryCard__label}>Status Atual</div>
            <div
              className={styles.summaryCard__value}
              style={{
                color: latestProgress.on_track ? 'var(--success-color)' : 'var(--error-color)',
              }}
            >
              {latestProgress.on_track ? '✓' : '✗'}
            </div>
            <div className={styles.summaryCard__subtitle}>
              {latestProgress.on_track ? 'No caminho certo' : 'Fora do caminho'}
            </div>
          </div>
        )}
      </div>

      {/* Target Details */}
      <div className={styles.section}>
        <h2>Detalhes do Objetivo</h2>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Escopos Cobertos</div>
            <div className={styles.detailValue}>{getScopeLabel(target.scope)}</div>
          </div>

          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Método</div>
            <div className={styles.detailValue}>
              {target.method === 'absolute' ? 'Redução Absoluta' : 'Redução de Intensidade'}
            </div>
          </div>

          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Nível de Ambição</div>
            <div className={styles.detailValue}>{target.ambition_level}</div>
          </div>

          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Setor</div>
            <div className={styles.detailValue}>{target.sector_pathway || 'Cross-sector'}</div>
          </div>

          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Cobertura Scope 1+2</div>
            <div className={styles.detailValue}>{target.coverage_scope1_2_pct}%</div>
          </div>

          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Cobertura Scope 3</div>
            <div className={styles.detailValue}>{target.coverage_scope3_pct}%</div>
          </div>
        </div>
      </div>

      {/* Emissions Breakdown */}
      <div className={styles.section}>
        <h2>Emissões</h2>
        <div className={styles.emissionsTable}>
          <table>
            <thead>
              <tr>
                <th>Escopo</th>
                <th>Ano Base ({target.base_year})</th>
                <th>Ano Alvo ({target.target_year})</th>
                <th>Redução</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Scope 1</td>
                <td>{(target.base_year_scope1 || 0).toFixed(0)} tCO2e</td>
                <td>{(target.target_year_scope1 || 0).toFixed(0)} tCO2e</td>
                <td>
                  {target.base_year_scope1 > 0
                    ? (
                        ((target.base_year_scope1 - target.target_year_scope1) /
                          target.base_year_scope1) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </td>
              </tr>
              <tr>
                <td>Scope 2</td>
                <td>{(target.base_year_scope2_location || 0).toFixed(0)} tCO2e</td>
                <td>{(target.target_year_scope2 || 0).toFixed(0)} tCO2e</td>
                <td>
                  {target.base_year_scope2_location > 0
                    ? (
                        ((target.base_year_scope2_location - target.target_year_scope2) /
                          target.base_year_scope2_location) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </td>
              </tr>
              {target.base_year_scope3 > 0 && (
                <tr>
                  <td>Scope 3</td>
                  <td>{(target.base_year_scope3 || 0).toFixed(0)} tCO2e</td>
                  <td>{(target.target_year_scope3 || 0).toFixed(0)} tCO2e</td>
                  <td>
                    {target.base_year_scope3 > 0
                      ? (
                          ((target.base_year_scope3 - target.target_year_scope3) /
                            target.base_year_scope3) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </td>
                </tr>
              )}
              <tr className={styles.totalRow}>
                <td>
                  <strong>Total</strong>
                </td>
                <td>
                  <strong>{totalBaseYear.toFixed(0)} tCO2e</strong>
                </td>
                <td>
                  <strong>{totalTargetYear.toFixed(0)} tCO2e</strong>
                </td>
                <td>
                  <strong>{reductionPercentage.toFixed(1)}%</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Progress Tracking */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Progresso ao Longo do Tempo</h2>
          <button
            type="button"
            onClick={() => setShowAddProgress(true)}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            + Adicionar Progresso
          </button>
        </div>

        {progress.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nenhum dado de progresso registrado ainda.</p>
            <p>Adicione dados de emissões anuais para acompanhar o progresso do objetivo.</p>
          </div>
        ) : (
          <div className={styles.progressTable}>
            <table>
              <thead>
                <tr>
                  <th>Ano</th>
                  <th>Emissões Reais</th>
                  <th>Trajetória Esperada</th>
                  <th>Variância</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {progress.map((entry) => (
                  <tr key={entry.reporting_year}>
                    <td>{entry.reporting_year}</td>
                    <td>{entry.actual_total.toFixed(0)} tCO2e</td>
                    <td>{entry.target_trajectory.toFixed(0)} tCO2e</td>
                    <td
                      style={{
                        color:
                          entry.variance > 0 ? 'var(--error-color)' : 'var(--success-color)',
                      }}
                    >
                      {entry.variance > 0 ? '+' : ''}
                      {entry.variance.toFixed(0)} tCO2e ({entry.variance_percentage.toFixed(1)}%)
                    </td>
                    <td>
                      {entry.on_track ? (
                        <span style={{ color: 'var(--success-color)' }}>✓ No caminho</span>
                      ) : (
                        <span style={{ color: 'var(--error-color)' }}>✗ Fora do caminho</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Validation Results */}
      {target.validation_results && Object.keys(target.validation_results).length > 0 && (
        <div className={styles.section}>
          <h2>Resultados da Validação</h2>
          <div className={styles.validationGrid}>
            {Object.entries(target.validation_results).map(([code, status]) => (
              <div
                key={code}
                className={styles.validationItem}
                data-status={status as string}
              >
                <div className={styles.validationIcon}>
                  {status === 'pass' ? '✓' : status === 'warning' ? '⚠' : '✗'}
                </div>
                <div className={styles.validationCode}>{code}</div>
              </div>
            ))}
          </div>

          {target.validation_warnings && target.validation_warnings.length > 0 && (
            <div className={styles.warningBox}>
              <strong>Avisos:</strong>
              <ul>
                {target.validation_warnings.map((warning: string, i: number) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Add Progress Modal */}
      {showAddProgress && (
        <AddProgressModal
          targetId={target.id}
          targetYear={target.target_year}
          baseYear={target.base_year}
          onClose={() => setShowAddProgress(false)}
          onSuccess={() => {
            setShowAddProgress(false)
            refreshPage()
          }}
        />
      )}
    </div>
  )
}

// ============================================================================
// ADD PROGRESS MODAL
// ============================================================================

function AddProgressModal({ targetId, targetYear, baseYear, onClose, onSuccess }: AddProgressModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    year: new Date().getFullYear() - 1,
    scope1: 0,
    scope2: 0,
    scope3: 0,
    biogenic_net: 0,
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await addSBTIProgress(
        targetId,
        formData.year,
        {
          scope1: formData.scope1,
          scope2: formData.scope2,
          scope3: formData.scope3,
          biogenic_net: formData.biogenic_net,
        },
        formData.notes
      )

      if (result.error) {
        setError(result.error)
        return
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar progresso')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Adicionar Progresso</h3>
          <button type="button" onClick={onClose} className={styles.modalClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor="year">Ano de Reporte</label>
            <input
              type="number"
              id="year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              min={baseYear}
              max={targetYear}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="scope1">Scope 1 (tCO2e)</label>
            <input
              type="number"
              id="scope1"
              value={formData.scope1}
              onChange={(e) => setFormData({ ...formData, scope1: parseFloat(e.target.value) })}
              min={0}
              step={0.01}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="scope2">Scope 2 (tCO2e)</label>
            <input
              type="number"
              id="scope2"
              value={formData.scope2}
              onChange={(e) => setFormData({ ...formData, scope2: parseFloat(e.target.value) })}
              min={0}
              step={0.01}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="scope3">Scope 3 (tCO2e)</label>
            <input
              type="number"
              id="scope3"
              value={formData.scope3}
              onChange={(e) => setFormData({ ...formData, scope3: parseFloat(e.target.value) })}
              min={0}
              step={0.01}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="biogenic">Emissões Biogênicas (tCO2e)</label>
            <input
              type="number"
              id="biogenic"
              value={formData.biogenic_net}
              onChange={(e) =>
                setFormData({ ...formData, biogenic_net: parseFloat(e.target.value) })
              }
              step={0.01}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="notes">Notas (opcional)</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Adicione notas sobre este período..."
            />
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.button} ${styles.buttonSecondary}`}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={isLoading}
            >
              {isLoading ? 'A guardar...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTargetTitle(target: any): string {
  const method = target.method === 'absolute' ? 'Absoluta' : 'Intensidade'
  const scope = getScopeLabel(target.scope)
  return `${method} - ${scope}`
}

function getScopeLabel(scope: string): string {
  switch (scope) {
    case 'scope1_2':
      return 'Scope 1 + 2'
    case 'scope3':
      return 'Scope 3'
    case 'scope1_2_3':
      return 'Scope 1 + 2 + 3'
    default:
      return scope
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Rascunho'
    case 'submitted':
      return 'Submetido'
    case 'validated':
      return 'Validado'
    case 'committed':
      return 'Comprometido'
    default:
      return status
  }
}
