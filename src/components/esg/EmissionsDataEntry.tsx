import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus, Save, AlertCircle } from 'lucide-react';

interface EmissionSource {
  id: string;
  name: string;
  category: string;
  default_unit: string;
  default_factor: number;
}

interface EmissionFormData {
  facility_id: string;
  source_id: string; // Changed from emission_source_id
  period_start: string; // Changed from emission_date
  period_end: string; // Added period_end
  scope: 'scope_1' | 'scope_2' | 'scope_3';
  source_category: string;
  activity_value: number; // Changed from activity_data
  activity_unit: string;
  activity_description: string; // Added
  emission_factor: number;
  emission_factor_source: string;
  emission_factor_unit: string; // Added
  co2e_tonnes: number; // Changed from co2_equivalent
  data_quality: 'measured' | 'calculated' | 'estimated' | 'default' | 'unknown';
  verification_status: 'unverified' | 'self_verified' | 'third_party_verified';
  notes: string;
}

interface Props {
  organizationId: string;
  onSuccess?: () => void;
}

export function EmissionsDataEntry({ organizationId, onSuccess }: Props) {
  const [formData, setFormData] = useState<EmissionFormData>({
    facility_id: '',
    source_id: '',
    period_start: new Date().toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    scope: 'scope_1',
    source_category: '',
    activity_value: 0,
    activity_unit: '',
    activity_description: '',
    emission_factor: 0,
    emission_factor_source: '',
    emission_factor_unit: 'kgCO2e/unit',
    co2e_tonnes: 0,
    data_quality: 'measured',
    verification_status: 'unverified',
    notes: ''
  });

  const [facilities, setFacilities] = useState<any[]>([]);
  const [emissionSources, setEmissionSources] = useState<EmissionSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadFacilities();
    loadEmissionSources();
  }, [organizationId, loadFacilities, loadEmissionSources]);

  const loadFacilities = async () => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('id, name, facility_type')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;
      setFacilities(data || []);
    } catch (error) {
      console.error('Error loading facilities:', error);
      toast({
        title: "Error",
        description: "Failed to load facilities",
        variant: "destructive",
      });
    }
  };

  const loadEmissionSources = async () => {
    try {
      const { data, error } = await supabase
        .from('emission_sources')
        .select('id, name, category, default_unit, default_factor')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;
      setEmissionSources(data || []);
    } catch (error) {
      console.error('Error loading emission sources:', error);
      toast({
        title: "Error",
        description: "Failed to load emission sources",
        variant: "destructive",
      });
    }
  };

  const handleSourceChange = (sourceId: string) => {
    const source = emissionSources.find(s => s.id === sourceId);
    if (source) {
      setFormData(prev => ({
        ...prev,
        source_id: sourceId,
        source_category: source.category,
        activity_unit: source.default_unit,
        emission_factor: source.default_factor,
        emission_factor_unit: 'kgCO2e/' + source.default_unit
      }));
    }
  };

  const calculateEmissions = () => {
    // Calculate in kg then convert to tonnes
    const co2e_kg = formData.activity_value * formData.emission_factor;
    const co2e_tonnes = co2e_kg / 1000; // Convert kg to tonnes
    setFormData(prev => ({
      ...prev,
      co2e_tonnes
    }));
  };

  useEffect(() => {
    if (formData.activity_value > 0 && formData.emission_factor > 0) {
      calculateEmissions();
    }
  }, [formData.activity_value, formData.emission_factor, calculateEmissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('emissions')
        .insert([{
          ...formData,
          organization_id: organizationId,
          created_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Emission record created successfully",
      });

      // Reset form
      setFormData({
        facility_id: '',
        source_id: '',
        period_start: new Date().toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        scope: 'scope_1',
        source_category: '',
        activity_value: 0,
        activity_unit: '',
        activity_description: '',
        emission_factor: 0,
        emission_factor_source: '',
        emission_factor_unit: 'kgCO2e/unit',
        co2e_tonnes: 0,
        data_quality: 'measured',
        verification_status: 'unverified',
        notes: ''
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error creating emission record:', error);
      toast({
        title: "Error",
        description: "Failed to create emission record",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const scopeOptions = [
    { value: 'scope_1', label: 'Scope 1 - Direct Emissions' },
    { value: 'scope_2', label: 'Scope 2 - Indirect Energy' },
    { value: 'scope_3', label: 'Scope 3 - Value Chain' }
  ];

  const dataQualityOptions = [
    { value: 'measured', label: 'Measured - Direct measurement' },
    { value: 'calculated', label: 'Calculated - Based on data' },
    { value: 'estimated', label: 'Estimated - Approximation' },
    { value: 'default', label: 'Default - Standard factor' },
    { value: 'unknown', label: 'Unknown - No information' }
  ];

  const verificationOptions = [
    { value: 'unverified', label: 'Unverified' },
    { value: 'self_verified', label: 'Self Verified' },
    { value: 'third_party_verified', label: 'Third Party Verified' }
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Emission Record
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facility">Facility *</Label>
              <Select value={formData.facility_id} onValueChange={(value) => setFormData(prev => ({ ...prev, facility_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select facility" />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name} ({facility.facility_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emission_source">Emission Source *</Label>
              <Select value={formData.source_id} onValueChange={handleSourceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select emission source" />
                </SelectTrigger>
                <SelectContent>
                  {emissionSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name} ({source.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period_start">Period Start *</Label>
              <Input
                type="date"
                value={formData.period_start}
                onChange={(e) => setFormData(prev => ({ ...prev, period_start: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period_end">Period End *</Label>
              <Input
                type="date"
                value={formData.period_end}
                onChange={(e) => setFormData(prev => ({ ...prev, period_end: e.target.value }))}
                min={formData.period_start}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Scope *</Label>
              <Select value={formData.scope} onValueChange={(value: 'scope_1' | 'scope_2' | 'scope_3') => setFormData(prev => ({ ...prev, scope: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  {scopeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Activity Data */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activity_value">Activity Value *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.activity_value}
                onChange={(e) => setFormData(prev => ({ ...prev, activity_value: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter activity value"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity_unit">Unit *</Label>
              <Input
                value={formData.activity_unit}
                onChange={(e) => setFormData(prev => ({ ...prev, activity_unit: e.target.value }))}
                placeholder="e.g., kWh, liters, kg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emission_factor">Emission Factor *</Label>
              <Input
                type="number"
                step="0.000001"
                value={formData.emission_factor}
                onChange={(e) => setFormData(prev => ({ ...prev, emission_factor: parseFloat(e.target.value) || 0 }))}
                placeholder="kgCO2e per unit"
                required
              />
            </div>
          </div>

          {/* Calculated Result */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-blue-900">Calculated Emissions</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {formData.co2e_tonnes.toLocaleString(undefined, { maximumFractionDigits: 3 })} tonnes CO2e
            </div>
            <div className="text-sm text-blue-600">
              ({(formData.co2e_tonnes * 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} kg CO2e)
            </div>
          </div>

          {/* Data Quality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_quality">Data Quality *</Label>
              <Select value={formData.data_quality} onValueChange={(value: 'measured' | 'calculated' | 'estimated') => setFormData(prev => ({ ...prev, data_quality: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data quality" />
                </SelectTrigger>
                <SelectContent>
                  {dataQualityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification_status">Verification Status</Label>
              <Select value={formData.verification_status} onValueChange={(value: 'unverified' | 'self_verified' | 'third_party_verified') => setFormData(prev => ({ ...prev, verification_status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select verification status" />
                </SelectTrigger>
                <SelectContent>
                  {verificationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emission_factor_source">Emission Factor Source</Label>
              <Input
                value={formData.emission_factor_source}
                onChange={(e) => setFormData(prev => ({ ...prev, emission_factor_source: e.target.value }))}
                placeholder="e.g., EPA, DEFRA, IEA"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="activity_description">Activity Description</Label>
              <Input
                value={formData.activity_description}
                onChange={(e) => setFormData(prev => ({ ...prev, activity_description: e.target.value }))}
                placeholder="e.g., Natural gas for building heating"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or comments"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting} className="min-w-32">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Emission Record
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}