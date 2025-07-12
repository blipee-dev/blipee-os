import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';

interface ImportResult {
  success: boolean;
  processed: number;
  errors: Array<{ row: number; error: string }>;
  data?: any[];
}

interface Props {
  organizationId: string;
  onSuccess?: (result: ImportResult) => void;
}

export function BulkDataImport({ organizationId, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'emissions' | 'energy' | 'water' | 'waste' | 'targets'>('emissions');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const downloadTemplate = () => {
    const templates = {
      emissions: [
        ['facility_name', 'period_start', 'period_end', 'scope', 'source_category', 'activity_value', 'activity_unit', 'emission_factor', 'emission_factor_unit', 'co2e_tonnes', 'data_quality', 'activity_description', 'notes'],
        ['Main Office', '2024-01-01', '2024-01-31', 'scope_1', 'stationary_combustion', '1000', 'm3', '2.02', 'kgCO2e/m3', '2.020', 'measured', 'Natural gas for heating', 'Monthly gas consumption'],
        ['Warehouse', '2024-01-01', '2024-01-31', 'scope_2', 'purchased_electricity', '5000', 'kWh', '0.433', 'kgCO2e/kWh', '2.165', 'calculated', 'Grid electricity', 'Monthly electricity consumption']
      ],
      energy: [
        ['facility_name', 'period_start', 'period_end', 'energy_type', 'consumption_value', 'consumption_unit', 'consumption_kwh', 'cost', 'currency', 'renewable_percentage', 'grid_mix_percentage', 'notes'],
        ['Main Office', '2024-01-01', '2024-01-31', 'electricity', '5000', 'kWh', '5000', '750', 'USD', '25', '75', 'Monthly electricity bill'],
        ['Warehouse', '2024-01-01', '2024-01-31', 'natural_gas', '1000', 'm3', '10550', '800', 'USD', '0', '0', 'Monthly gas bill']
      ],
      water: [
        ['facility_name', 'period_start', 'period_end', 'water_source', 'consumption_m3', 'cost_amount', 'cost_currency', 'water_stress_area', 'recycled_percentage', 'notes'],
        ['Main Office', '2024-01-01', '2024-01-31', 'municipal', '100', '250', 'USD', 'medium', '0', 'Monthly water bill'],
        ['Warehouse', '2024-01-01', '2024-01-31', 'municipal', '50', '125', 'USD', 'low', '0', 'Monthly water bill']
      ],
      waste: [
        ['facility_name', 'period_start', 'period_end', 'waste_type', 'quantity_tonnes', 'disposal_method', 'recovery_rate', 'hazardous', 'notes'],
        ['Main Office', '2024-01-01', '2024-01-31', 'msw', '0.5', 'landfill', '0', 'false', 'Monthly waste pickup'],
        ['Warehouse', '2024-01-01', '2024-01-31', 'cardboard', '0.2', 'recycling', '100', 'false', 'Monthly recycling']
      ],
      targets: [
        ['target_name', 'target_type', 'baseline_year', 'baseline_value', 'target_year', 'target_value', 'target_unit', 'scope_coverage', 'is_science_based', 'is_approved', 'notes'],
        ['Net Zero Target', 'absolute_reduction', '2023', '10000', '2030', '0', 'tCO2e', 'scope_1,scope_2,scope_3', 'true', 'true', 'Science-based target aligned with 1.5°C'],
        ['Renewable Energy', 'intensity_target', '2023', '25', '2030', '100', '%', 'scope_2', 'false', 'true', 'RE100 commitment']
      ]
    };

    const template = templates[importType];
    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, importType);
    XLSX.writeFile(wb, `${importType}_template.xlsx`);
  };

  const processFile = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(0);

    try {
      // Read file
      const arrayBuffer = await file.arrayBuffer();
      let data: any[][] = [];

      if (file.name.endsWith('.csv')) {
        const text = new TextDecoder().decode(arrayBuffer);
        const rows = text.split('\n').map(row => row.split(','));
        data = rows;
      } else {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      }

      // Process data
      const headers = data[0];
      const rows = data.slice(1).filter(row => row.length > 0);
      
      const processedData = [];
      const errors: Array<{ row: number; error: string }> = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowData: any = {};
        
        // Map headers to row data
        headers.forEach((header, index) => {
          rowData[header] = row[index];
        });

        // Add organization_id
        rowData.organization_id = organizationId;

        // Validate required fields based on import type
        const validationResult = validateRow(rowData, importType, i + 2);
        if (!validationResult.valid) {
          errors.push({ row: i + 2, error: validationResult.error });
          continue;
        }

        processedData.push(rowData);
        setProgress(Math.round((i / rows.length) * 50));
      }

      // Import to database
      const importResult = await importToDatabase(processedData, importType);
      
      setResult({
        success: importResult.success,
        processed: processedData.length,
        errors: [...errors, ...importResult.errors],
        data: processedData
      });

      if (importResult.success) {
        toast({
          title: "Import Successful!",
          description: `${processedData.length} records imported successfully`,
        });
        onSuccess?.({
          success: true,
          processed: processedData.length,
          errors: [...errors, ...importResult.errors]
        });
      }

      setProgress(100);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "An error occurred while processing the file",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const validateRow = (row: any, type: string, rowNumber: number): { valid: boolean; error: string } => {
    const requiredFields = {
      emissions: ['facility_name', 'period_start', 'period_end', 'scope', 'activity_value', 'activity_unit'],
      energy: ['facility_name', 'period_start', 'period_end', 'energy_type', 'consumption_value'],
      water: ['facility_name', 'period_start', 'period_end', 'water_source', 'consumption_m3'],
      waste: ['facility_name', 'period_start', 'period_end', 'waste_type', 'quantity_tonnes'],
      targets: ['target_name', 'target_type', 'baseline_year', 'baseline_value', 'target_year', 'target_value']
    };

    const required = requiredFields[type as keyof typeof requiredFields];
    for (const field of required) {
      if (!row[field] || row[field] === '') {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    // Type-specific validations
    if (type === 'emissions') {
      if (!['scope_1', 'scope_2', 'scope_3'].includes(row.scope)) {
        return { valid: false, error: 'Invalid scope value' };
      }
      if (isNaN(parseFloat(row.activity_value))) {
        return { valid: false, error: 'Activity value must be a number' };
      }
    }

    return { valid: true, error: '' };
  };

  const importToDatabase = async (data: any[], type: string) => {
    const endpoints = {
      emissions: '/api/emissions/bulk',
      energy: '/api/energy/bulk',
      water: '/api/water/bulk',
      waste: '/api/waste/bulk',
      targets: '/api/targets/bulk'
    };

    try {
      const response = await fetch(endpoints[type as keyof typeof endpoints], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, errors: result.errors || [] };
    } catch (error) {
      console.error('Database import error:', error);
      return { success: false, errors: [{ row: 0, error: 'Database import failed' }] };
    }
  };

  const importTypeOptions = [
    { value: 'emissions', label: 'Emissions Data' },
    { value: 'energy', label: 'Energy Consumption' },
    { value: 'water', label: 'Water Consumption' },
    { value: 'waste', label: 'Waste Generation' },
    { value: 'targets', label: 'Sustainability Targets' }
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Bulk Data Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Import Type Selection */}
        <div className="space-y-2">
          <Label>Import Type</Label>
          <Select value={importType} onValueChange={(value: any) => setImportType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select import type" />
            </SelectTrigger>
            <SelectContent>
              {importTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template Download */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <span className="text-sm text-muted-foreground">
            Download a template file to see the required format
          </span>
        </div>

        {/* File Upload */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
          {file ? (
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium">Drop your file here, or click to browse</p>
              <p className="text-sm text-muted-foreground">
                Supports CSV, XLS, and XLSX files
              </p>
            </div>
          )}
        </div>

        {/* Progress */}
        {processing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Processing...</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">
                  {result.success ? 'Import Completed' : 'Import Failed'}
                </span>
              </div>
              <p className="text-sm">
                {result.processed} records processed successfully
              </p>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">Errors ({result.errors.length})</span>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <p key={index} className="text-sm text-yellow-800">
                      Row {error.row}: {error.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Process Button */}
        <div className="flex justify-end">
          <Button
            onClick={processFile}
            disabled={!file || processing}
            className="min-w-32"
          >
            {processing ? 'Processing...' : 'Import Data'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}