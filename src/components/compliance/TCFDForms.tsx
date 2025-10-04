'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  children: React.ReactNode;
  saving?: boolean;
}

function FormModal({ isOpen, onClose, onSave, title, children, saving }: FormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#111827] rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-[#111827] border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Governance Form (Pillar 1)
interface GovernanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  saving?: boolean;
}

export function GovernanceForm({ isOpen, onClose, onSave, initialData, saving }: GovernanceFormProps) {
  const [boardFrequency, setBoardFrequency] = useState(initialData?.board_oversight?.frequency || '');
  const [boardCommittee, setBoardCommittee] = useState(initialData?.board_oversight?.committee || '');
  const [boardResponsibilities, setBoardResponsibilities] = useState<string[]>(
    initialData?.board_oversight?.responsibilities || ['']
  );
  const [managementPositions, setManagementPositions] = useState<Array<{ title: string; responsibilities: string }>>(
    initialData?.management_role?.positions || [{ title: '', responsibilities: '' }]
  );
  const [managementIntegration, setManagementIntegration] = useState(
    initialData?.management_role?.integration || ''
  );

  const handleSave = () => {
    onSave({
      governance_oversight: {
        board_oversight: {
          frequency: boardFrequency,
          committee: boardCommittee,
          responsibilities: boardResponsibilities.filter(r => r.trim())
        },
        management_role: {
          positions: managementPositions.filter(p => p.title.trim()),
          integration: managementIntegration
        }
      }
    });
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSave={handleSave} title="TCFD Pillar 1: Governance" saving={saving}>
      <div className="space-y-6">
        {/* Board Oversight Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Board Oversight</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Review Frequency
              </label>
              <select
                value={boardFrequency}
                onChange={(e) => setBoardFrequency(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">Select frequency...</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Bi-annually">Bi-annually</option>
                <option value="Annually">Annually</option>
                <option value="Ad-hoc">Ad-hoc</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Responsible Committee
              </label>
              <input
                type="text"
                value={boardCommittee}
                onChange={(e) => setBoardCommittee(e.target.value)}
                placeholder="e.g., Audit & Risk Committee, Sustainability Committee"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Board Responsibilities
              </label>
              {boardResponsibilities.map((resp, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={resp}
                    onChange={(e) => {
                      const newResp = [...boardResponsibilities];
                      newResp[index] = e.target.value;
                      setBoardResponsibilities(newResp);
                    }}
                    placeholder="e.g., Review climate strategy and targets"
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => setBoardResponsibilities(boardResponsibilities.filter((_, i) => i !== index))}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setBoardResponsibilities([...boardResponsibilities, ''])}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add responsibility
              </button>
            </div>
          </div>
        </div>

        {/* Management Role Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Management's Role</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Key Positions
              </label>
              {managementPositions.map((pos, index) => (
                <div key={index} className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Position {index + 1}</span>
                    {managementPositions.length > 1 && (
                      <button
                        onClick={() => setManagementPositions(managementPositions.filter((_, i) => i !== index))}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={pos.title}
                    onChange={(e) => {
                      const newPos = [...managementPositions];
                      newPos[index].title = e.target.value;
                      setManagementPositions(newPos);
                    }}
                    placeholder="Title (e.g., Chief Sustainability Officer)"
                    className="w-full px-3 py-2 mb-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                  <textarea
                    value={pos.responsibilities}
                    onChange={(e) => {
                      const newPos = [...managementPositions];
                      newPos[index].responsibilities = e.target.value;
                      setManagementPositions(newPos);
                    }}
                    placeholder="Responsibilities..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              ))}
              <button
                onClick={() => setManagementPositions([...managementPositions, { title: '', responsibilities: '' }])}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add position
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Integration with Business Strategy
              </label>
              <textarea
                value={managementIntegration}
                onChange={(e) => setManagementIntegration(e.target.value)}
                rows={3}
                placeholder="Describe how climate considerations are integrated into business strategy and planning..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </FormModal>
  );
}

// Strategy Form (Pillar 2)
interface StrategyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  saving?: boolean;
}

export function StrategyForm({ isOpen, onClose, onSave, initialData, saving }: StrategyFormProps) {
  const [risks, setRisks] = useState<Array<{
    risk: string;
    type: 'physical' | 'transition';
    timeframe: string;
    impact: string;
    description: string;
  }>>(initialData?.risks || [{ risk: '', type: 'physical', timeframe: 'short', impact: 'low', description: '' }]);

  const [opportunities, setOpportunities] = useState<Array<{
    opportunity: string;
    type: string;
    description: string;
  }>>(initialData?.opportunities || [{ opportunity: '', type: '', description: '' }]);

  const [scenarios, setScenarios] = useState<string[]>(initialData?.scenarios?.scenarios_used || ['']);
  const [scenarioMethodology, setScenarioMethodology] = useState(initialData?.scenarios?.methodology || '');
  const [scenarioFindings, setScenarioFindings] = useState(initialData?.scenarios?.findings || '');
  const [resilience, setResilience] = useState(initialData?.resilience || '');

  const handleSave = () => {
    onSave({
      strategy_risks: risks.filter(r => r.risk.trim()),
      strategy_opportunities: opportunities.filter(o => o.opportunity.trim()),
      strategy_scenarios: {
        scenarios_used: scenarios.filter(s => s.trim()),
        methodology: scenarioMethodology,
        findings: scenarioFindings
      },
      strategy_resilience: resilience
    });
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSave={handleSave} title="TCFD Pillar 2: Strategy" saving={saving}>
      <div className="space-y-6">
        {/* Climate Risks */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Climate-Related Risks</h4>

          {risks.map((risk, index) => (
            <div key={index} className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk {index + 1}</span>
                {risks.length > 1 && (
                  <button
                    onClick={() => setRisks(risks.filter((_, i) => i !== index))}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={risk.risk}
                  onChange={(e) => {
                    const newRisks = [...risks];
                    newRisks[index].risk = e.target.value;
                    setRisks(newRisks);
                  }}
                  placeholder="Risk name..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />

                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={risk.type}
                    onChange={(e) => {
                      const newRisks = [...risks];
                      newRisks[index].type = e.target.value as 'physical' | 'transition';
                      setRisks(newRisks);
                    }}
                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
                  >
                    <option value="physical">Physical</option>
                    <option value="transition">Transition</option>
                  </select>

                  <select
                    value={risk.timeframe}
                    onChange={(e) => {
                      const newRisks = [...risks];
                      newRisks[index].timeframe = e.target.value;
                      setRisks(newRisks);
                    }}
                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
                  >
                    <option value="short">Short (0-3y)</option>
                    <option value="medium">Medium (3-10y)</option>
                    <option value="long">Long (10y+)</option>
                  </select>

                  <select
                    value={risk.impact}
                    onChange={(e) => {
                      const newRisks = [...risks];
                      newRisks[index].impact = e.target.value;
                      setRisks(newRisks);
                    }}
                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
                  >
                    <option value="low">Low Impact</option>
                    <option value="medium">Medium Impact</option>
                    <option value="high">High Impact</option>
                  </select>
                </div>

                <textarea
                  value={risk.description}
                  onChange={(e) => {
                    const newRisks = [...risks];
                    newRisks[index].description = e.target.value;
                    setRisks(newRisks);
                  }}
                  placeholder="Risk description..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          ))}

          <button
            onClick={() => setRisks([...risks, { risk: '', type: 'physical', timeframe: 'short', impact: 'low', description: '' }])}
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add risk
          </button>
        </div>

        {/* Climate Opportunities */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Climate-Related Opportunities</h4>

          {opportunities.map((opp, index) => (
            <div key={index} className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Opportunity {index + 1}</span>
                {opportunities.length > 1 && (
                  <button
                    onClick={() => setOpportunities(opportunities.filter((_, i) => i !== index))}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={opp.opportunity}
                  onChange={(e) => {
                    const newOpps = [...opportunities];
                    newOpps[index].opportunity = e.target.value;
                    setOpportunities(newOpps);
                  }}
                  placeholder="Opportunity name..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />

                <input
                  type="text"
                  value={opp.type}
                  onChange={(e) => {
                    const newOpps = [...opportunities];
                    newOpps[index].type = e.target.value;
                    setOpportunities(newOpps);
                  }}
                  placeholder="Type (e.g., Energy efficiency, New markets)"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />

                <textarea
                  value={opp.description}
                  onChange={(e) => {
                    const newOpps = [...opportunities];
                    newOpps[index].description = e.target.value;
                    setOpportunities(newOpps);
                  }}
                  placeholder="Opportunity description..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          ))}

          <button
            onClick={() => setOpportunities([...opportunities, { opportunity: '', type: '', description: '' }])}
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add opportunity
          </button>
        </div>

        {/* Scenario Analysis */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Climate Scenario Analysis</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Scenarios Analyzed
              </label>
              {scenarios.map((scenario, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={scenario}
                    onChange={(e) => {
                      const newScenarios = [...scenarios];
                      newScenarios[index] = e.target.value;
                      setScenarios(newScenarios);
                    }}
                    placeholder="e.g., IEA NZE 2050, RCP 8.5, 1.5°C pathway"
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => setScenarios(scenarios.filter((_, i) => i !== index))}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setScenarios([...scenarios, ''])}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add scenario
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Methodology
              </label>
              <textarea
                value={scenarioMethodology}
                onChange={(e) => setScenarioMethodology(e.target.value)}
                rows={3}
                placeholder="Describe the methodology used for scenario analysis..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Key Findings
              </label>
              <textarea
                value={scenarioFindings}
                onChange={(e) => setScenarioFindings(e.target.value)}
                rows={3}
                placeholder="Summarize key findings from scenario analysis..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Strategic Resilience */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Strategic Resilience</h4>
          <textarea
            value={resilience}
            onChange={(e) => setResilience(e.target.value)}
            rows={4}
            placeholder="Describe how your strategy is resilient to different climate scenarios..."
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </FormModal>
  );
}

// Risk Management Form (Pillar 3)
interface RiskManagementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  saving?: boolean;
}

export function RiskManagementForm({ isOpen, onClose, onSave, initialData, saving }: RiskManagementFormProps) {
  const [identification, setIdentification] = useState(initialData?.risk_identification || '');
  const [assessment, setAssessment] = useState(initialData?.risk_assessment || '');
  const [management, setManagement] = useState(initialData?.risk_management_process || '');
  const [integration, setIntegration] = useState(initialData?.risk_integration || '');

  const handleSave = () => {
    onSave({
      risk_identification: identification,
      risk_assessment: assessment,
      risk_management_process: management,
      risk_integration: integration
    });
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSave={handleSave} title="TCFD Pillar 3: Risk Management" saving={saving}>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Risk Identification Process
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Describe how your organization identifies climate-related risks
          </p>
          <textarea
            value={identification}
            onChange={(e) => setIdentification(e.target.value)}
            rows={4}
            placeholder="e.g., Annual risk assessment, stakeholder engagement, scenario analysis workshops..."
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Risk Assessment Process
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Describe how your organization assesses climate-related risks
          </p>
          <textarea
            value={assessment}
            onChange={(e) => setAssessment(e.target.value)}
            rows={4}
            placeholder="e.g., Risk matrix (likelihood x impact), quantitative financial modeling, materiality assessment..."
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Risk Management Process
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Describe how your organization manages climate-related risks
          </p>
          <textarea
            value={management}
            onChange={(e) => setManagement(e.target.value)}
            rows={4}
            placeholder="e.g., Risk mitigation strategies, adaptation measures, contingency planning..."
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Integration with Overall Risk Management
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Describe how climate risks are integrated into your enterprise risk management
          </p>
          <textarea
            value={integration}
            onChange={(e) => setIntegration(e.target.value)}
            rows={4}
            placeholder="e.g., Climate risks reviewed in quarterly ERM meetings, integrated into corporate risk register..."
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </FormModal>
  );
}

// Metrics Description Form (Pillar 4 - qualitative part)
interface MetricsDescriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  saving?: boolean;
}

export function MetricsDescriptionForm({ isOpen, onClose, onSave, initialData, saving }: MetricsDescriptionFormProps) {
  const [description, setDescription] = useState(initialData?.metrics_description || '');
  const [methodology, setMethodology] = useState(initialData?.metrics_scope123_methodology || '');

  const handleSave = () => {
    onSave({
      metrics_description: description,
      metrics_scope123_methodology: methodology
    });
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSave={handleSave} title="TCFD Pillar 4: Metrics Methodology" saving={saving}>
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> GHG emissions metrics and targets are automatically populated from your data.
            Use this form to provide additional context about your methodology and metrics selection.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Climate-Related Metrics Description
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Describe the climate-related metrics you use to assess risks and opportunities
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="e.g., We track energy consumption, renewable energy percentage, carbon intensity, water usage..."
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Scope 1, 2, 3 Calculation Methodology
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Describe how you calculate Scope 1, 2, and 3 GHG emissions
          </p>
          <textarea
            value={methodology}
            onChange={(e) => setMethodology(e.target.value)}
            rows={5}
            placeholder="e.g., We follow the GHG Protocol Corporate Standard. Scope 1 calculated using fuel consumption data and emission factors from... Scope 2 uses location-based and market-based methods... Scope 3 includes categories 1, 3, 4, 6, 7..."
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </FormModal>
  );
}
