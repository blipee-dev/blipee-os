'use client'

/**
 * Create SBTi Target Modal
 * Uses BlipeeMultiStepModal for consistent UX
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BlipeeMultiStepModal } from '@/components/ui/BlipeeMultiStepModal'
import type { Step } from '@/components/ui/BlipeeStepIndicator'
import {
  validateSBTITarget,
  calculateSBTIPathway,
  createSBTITarget,
  prefillFromGRI,
} from '@/app/actions/sbti'
import { getOrganizationSBTiSector } from '@/app/actions/sbti/sector'
import type {
  TargetInput,
  ValidationResult,
  PathwayCalculation,
} from '@/lib/sbti/calculator'
import type { SBTiSector } from '@/lib/sbti/sector-mapping'
import styles from '@/styles/settings-layout.module.css'

// ============================================================================
// TYPES
// ============================================================================

interface EmissionsFormData {
  baseYear: number
  scope1: number
  scope2_location: number
  scope2_market: number
  scope3: number
  biogenic_net: number
}

interface ConfigurationFormData {
  targetType: 'near_term' | 'long_term'
  scope: 'scope1_2' | 'scope3' | 'scope1_2_3'
  method: 'absolute' | 'intensity'
  targetYear: number
  ambition: '1.5C' | '2C' | 'well_below_2C'
  sector?: SBTiSector
}

interface CreateSBTITargetModalProps {
  isOpen: boolean
  onClose: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateSBTITargetModal({ isOpen, onClose }: CreateSBTITargetModalProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [targetType, setTargetType] = useState<'near_term' | 'long_term'>('near_term')
  const [emissionsData, setEmissionsData] = useState<EmissionsFormData>({
    baseYear: new Date().getFullYear() - 1,
    scope1: 0,
    scope2_location: 0,
    scope2_market: 0,
    scope3: 0,
    biogenic_net: 0,
  })
  const [configuration, setConfiguration] = useState<ConfigurationFormData>({
    targetType: 'near_term',
    scope: 'scope1_2',
    method: 'absolute',
    targetYear: new Date().getFullYear() + 5,
    ambition: '1.5C',
  })
  const [detectedSector, setDetectedSector] = useState<SBTiSector | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [pathway, setPathway] = useState<PathwayCalculation | null>(null)

  // Wizard steps
  const steps: Step[] = [
    { number: 1, title: 'Tipo de Objetivo', icon: '🎯' },
    { number: 2, title: 'Emissões', icon: '📊' },
    { number: 3, title: 'Configuração', icon: '⚙️' },
    { number: 4, title: 'Validação', icon: '✓' },
  ]

  // Auto-detect sector on mount
  useEffect(() => {
    if (!isOpen) return

    async function detectSector() {
      const result = await getOrganizationSBTiSector()
      if (result.data) {
        setDetectedSector(result.data.sector)
        setConfiguration((prev) => ({ ...prev, sector: result.data.sector }))
      }
    }
    detectSector()
  }, [isOpen])

  // Prefill from GRI
  const handlePrefillFromGRI = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await prefillFromGRI()
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setEmissionsData({
          baseYear: result.data.baseYear,
          scope1: result.data.scope1,
          scope2_location: result.data.scope2_location,
          scope2_market: result.data.scope2_market,
          scope3: result.data.scope3,
          biogenic_net: result.data.biogenic_net,
        })
      }
    } catch (err) {
      setError('Erro ao preencher dados do GRI')
    } finally {
      setIsLoading(false)
    }
  }

  // Perform validation (Step 4)
  const performValidation = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const input: TargetInput = {
        targetType: configuration.targetType,
        baseYear: emissionsData.baseYear,
        targetYear: configuration.targetYear,
        scope1: emissionsData.scope1,
        scope2_location: emissionsData.scope2_location,
        scope2_market: emissionsData.scope2_market,
        scope3: emissionsData.scope3,
        biogenic_net: emissionsData.biogenic_net,
        scope: configuration.scope,
        method: configuration.method,
        ambition: configuration.ambition,
        sector: configuration.sector,
      }

      const [validationResult, pathwayResult] = await Promise.all([
        validateSBTITarget(input),
        calculateSBTIPathway(input),
      ])

      if (validationResult.error) {
        setError(validationResult.error)
      } else {
        setValidation(validationResult.data!)
      }

      if (pathwayResult.data) {
        setPathway(pathwayResult.data)
      }
    } catch (err) {
      setError('Erro ao validar objetivo')
    } finally {
      setIsLoading(false)
    }
  }

  // Create target (final step)
  const handleCreateTarget = async () => {
    if (!validation?.is_valid) return

    setIsLoading(true)
    setError(null)

    try {
      const input: TargetInput = {
        targetType: configuration.targetType,
        baseYear: emissionsData.baseYear,
        targetYear: configuration.targetYear,
        scope1: emissionsData.scope1,
        scope2_location: emissionsData.scope2_location,
        scope2_market: emissionsData.scope2_market,
        scope3: emissionsData.scope3,
        biogenic_net: emissionsData.biogenic_net,
        scope: configuration.scope,
        method: configuration.method,
        ambition: configuration.ambition,
        sector: configuration.sector,
      }

      const result = await createSBTITarget(input)

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        onClose()
        router.push(`/dashboard/sbti/${result.data.id}`)
      }
    } catch (err) {
      setError('Erro ao criar objetivo')
    } finally {
      setIsLoading(false)
    }
  }

  // Navigation handlers
  const handleNext = async () => {
    setError(null)

    // Validate before moving to next step
    if (currentStep === 1) {
      setConfiguration((prev) => ({ ...prev, targetType }))
      setCurrentStep(2)
    } else if (currentStep === 2) {
      // Validate emissions data
      if (emissionsData.scope1 <= 0 && emissionsData.scope2_location <= 0 && emissionsData.scope2_market <= 0) {
        setError('Pelo menos um valor de Âmbito 1 ou 2 deve ser maior que zero')
        return
      }
      setCurrentStep(3)
    } else if (currentStep === 3) {
      // Move to validation step and perform validation
      setCurrentStep(4)
      await performValidation()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const handleCancel = () => {
    // Reset state
    setCurrentStep(1)
    setTargetType('near_term')
    setEmissionsData({
      baseYear: new Date().getFullYear() - 1,
      scope1: 0,
      scope2_location: 0,
      scope2_market: 0,
      scope3: 0,
      biogenic_net: 0,
    })
    setConfiguration({
      targetType: 'near_term',
      scope: 'scope1_2',
      method: 'absolute',
      targetYear: new Date().getFullYear() + 5,
      ambition: '1.5C',
    })
    setValidation(null)
    setPathway(null)
    setError(null)
    onClose()
  }

  return (
    <BlipeeMultiStepModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Criar Objetivo SBTi"
      subtitle="Assistente de criação de objetivos baseados em ciência"
      steps={steps}
      currentStep={currentStep}
      isEditing={true}
      onPrevious={handlePrevious}
      onNext={currentStep < 4 ? handleNext : handleCreateTarget}
      onCancel={handleCancel}
      onSave={handleCreateTarget}
      isSaving={isLoading}
      saveLabel={currentStep === 4 ? '✓ Criar Objetivo' : 'Próximo →'}
      maxWidth="900px"
    >
      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            marginBottom: '1.5rem',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* Step 1: Target Type */}
      {currentStep === 1 && (
        <div className={styles.form}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Selecione o Tipo de Objetivo
          </h3>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
            Escolha entre objetivo de curto prazo (5-10 anos) ou longo prazo (Net-Zero até 2050)
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div
              onClick={() => setTargetType('near_term')}
              style={{
                padding: '1.5rem',
                background: targetType === 'near_term' ? 'rgba(16, 185, 129, 0.1)' : 'var(--glass-bg)',
                border: `2px solid ${targetType === 'near_term' ? 'var(--green)' : 'var(--glass-border)'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>🎯 Curto Prazo</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: 0 }}>
                Objetivos de 5-10 anos alinhados com reduzir emissões rapidamente
              </p>
            </div>

            <div
              onClick={() => setTargetType('long_term')}
              style={{
                padding: '1.5rem',
                background: targetType === 'long_term' ? 'rgba(16, 185, 129, 0.1)' : 'var(--glass-bg)',
                border: `2px solid ${targetType === 'long_term' ? 'var(--green)' : 'var(--glass-border)'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>🌍 Longo Prazo (Net-Zero)</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: 0 }}>
                Compromisso de atingir emissões zero líquidas até 2050
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Emissions Data */}
      {currentStep === 2 && (
        <div className={styles.form}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Dados de Emissões Ano-Base
              </h3>
              <p style={{ color: 'var(--text-tertiary)', margin: 0 }}>
                Insira as emissões do ano-base para calcular os objetivos
              </p>
            </div>
            <button
              onClick={handlePrefillFromGRI}
              disabled={isLoading}
              className={styles.button}
              style={{
                background: 'var(--purple)',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
              }}
            >
              {isLoading ? 'Carregando...' : '📊 Preencher do GRI'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Ano-Base <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                required
                value={emissionsData.baseYear}
                onChange={(e) =>
                  setEmissionsData({ ...emissionsData, baseYear: parseInt(e.target.value) || 0 })
                }
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Âmbito 1 (tCO₂e)</label>
              <input
                type="number"
                step="0.01"
                value={emissionsData.scope1}
                onChange={(e) =>
                  setEmissionsData({ ...emissionsData, scope1: parseFloat(e.target.value) || 0 })
                }
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Âmbito 2 - Location-based (tCO₂e)</label>
              <input
                type="number"
                step="0.01"
                value={emissionsData.scope2_location}
                onChange={(e) =>
                  setEmissionsData({ ...emissionsData, scope2_location: parseFloat(e.target.value) || 0 })
                }
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Âmbito 2 - Market-based (tCO₂e)</label>
              <input
                type="number"
                step="0.01"
                value={emissionsData.scope2_market}
                onChange={(e) =>
                  setEmissionsData({ ...emissionsData, scope2_market: parseFloat(e.target.value) || 0 })
                }
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Âmbito 3 (tCO₂e)</label>
              <input
                type="number"
                step="0.01"
                value={emissionsData.scope3}
                onChange={(e) =>
                  setEmissionsData({ ...emissionsData, scope3: parseFloat(e.target.value) || 0 })
                }
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Biogénico Líquido (tCO₂e)</label>
              <input
                type="number"
                step="0.01"
                value={emissionsData.biogenic_net}
                onChange={(e) =>
                  setEmissionsData({ ...emissionsData, biogenic_net: parseFloat(e.target.value) || 0 })
                }
                className={styles.input}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Configuration */}
      {currentStep === 3 && (
        <div className={styles.form}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Configuração do Objetivo
          </h3>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
            Defina os parâmetros do seu objetivo SBTi
          </p>

          {detectedSector && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid var(--green)',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>✓</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--green)' }}>
                Sector detetado: <strong>{detectedSector}</strong>
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Âmbitos Cobertos <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                required
                value={configuration.scope}
                onChange={(e) =>
                  setConfiguration({ ...configuration, scope: e.target.value as any })
                }
                className={styles.select}
              >
                <option value="scope1_2">Âmbitos 1 & 2</option>
                <option value="scope3">Âmbito 3</option>
                <option value="scope1_2_3">Âmbitos 1, 2 & 3</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Método <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                required
                value={configuration.method}
                onChange={(e) =>
                  setConfiguration({ ...configuration, method: e.target.value as any })
                }
                className={styles.select}
              >
                <option value="absolute">Absoluto</option>
                <option value="intensity">Intensidade</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Ano Alvo <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                required
                value={configuration.targetYear}
                onChange={(e) =>
                  setConfiguration({ ...configuration, targetYear: parseInt(e.target.value) || 0 })
                }
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Nível de Ambição <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                required
                value={configuration.ambition}
                onChange={(e) =>
                  setConfiguration({ ...configuration, ambition: e.target.value as any })
                }
                className={styles.select}
              >
                <option value="1.5C">1.5°C</option>
                <option value="well_below_2C">Bem Abaixo de 2°C</option>
                <option value="2C">2°C</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Validation */}
      {currentStep === 4 && (
        <div className={styles.form}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
            Resultado da Validação
          </h3>

          {isLoading && !validation && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid var(--glass-border)',
                  borderTopColor: 'var(--green)',
                  borderRadius: '50%',
                  margin: '0 auto',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <p style={{ marginTop: '1rem', color: 'var(--text-tertiary)' }}>Validando objetivo...</p>
            </div>
          )}

          {validation && (
            <div
              style={{
                padding: '1.5rem',
                background: validation.is_valid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${validation.is_valid ? 'var(--green)' : '#ef4444'}`,
                borderRadius: '12px',
              }}
            >
              <h4
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  color: validation.is_valid ? 'var(--green)' : '#ef4444',
                }}
              >
                {validation.is_valid ? '✓ Objetivo Válido' : '✗ Objetivo Inválido'}
              </h4>

              {validation.is_valid ? (
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    O seu objetivo está alinhado com os critérios SBTi:
                  </p>
                  <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
                    <li>Redução necessária: <strong>{validation.reduction_percentage?.toFixed(1)}%</strong></li>
                    <li>Ambição: <strong>{configuration.ambition}</strong></li>
                    <li>
                      Período: <strong>{emissionsData.baseYear} → {configuration.targetYear}</strong>
                    </li>
                  </ul>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#ef4444', marginBottom: '0.75rem' }}>
                    O objetivo não cumpre os critérios SBTi:
                  </p>
                  {validation.errors && (
                    <ul style={{ fontSize: '0.875rem', color: '#ef4444', paddingLeft: '1.5rem' }}>
                      {validation.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </BlipeeMultiStepModal>
  )
}
