"use client";

import { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion as _motion, AnimatePresence } from "framer-motion";

interface ReportUploaderProps {
  organizationId: string;
  userId: string;
  onSuccess?: (data: any) => void;
}

export function ReportUploader({
  organizationId,
  userId,
  onSuccess,
}: ReportUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes("pdf")) {
      setError("Please upload a PDF file");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("organizationId", organizationId);
      formData.append("userId", userId);
      formData.append("generateMonthly", "true");

      const response = await fetch("/api/import/sustainability-report", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to import report");
      }

      setUploadResult(result);
      onSuccess?.(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 ${
          isDragging
            ? "border-purple-500 bg-purple-500/10"
            : "border-white/20 hover:border-purple-500/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        <div className="text-center">
          {isUploading ? (
            <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
          ) : (
            <Upload className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          )}

          <h3 className="text-lg font-semibold text-white mb-2">
            {isUploading
              ? "Processing Report..."
              : "Upload Sustainability Report"}
          </h3>
          <p className="text-sm text-white/60">
            Drag and drop your PDF report here, or click to browse
          </p>
          <p className="text-xs text-white/40 mt-2">
            Supports GRI, TCFD, CDP, and other standard formats
          </p>
        </div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Result */}
      <AnimatePresence>
        {uploadResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 space-y-4"
          >
            {/* Success Header */}
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-400 font-medium">
                {uploadResult.message}
              </p>
            </div>

            {/* Extracted Data Summary */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">
                Extracted Data Summary
              </h4>

              <div className="grid grid-cols-2 gap-4">
                {/* Emissions */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h5 className="text-sm font-medium text-white/70 mb-2">
                    Total Emissions
                  </h5>
                  <p className="text-2xl font-bold text-white">
                    {uploadResult.summary.emissions.total?.toLocaleString() ||
                      "0"}
                  </p>
                  <p className="text-xs text-white/50">tonnes CO₂e</p>

                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/50">Scope 1:</span>
                      <span className="text-white/70">
                        {uploadResult.summary.emissions.scope1?.toLocaleString() ||
                          "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Scope 2:</span>
                      <span className="text-white/70">
                        {uploadResult.summary.emissions.scope2?.toLocaleString() ||
                          "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Scope 3:</span>
                      <span className="text-white/70">
                        {uploadResult.summary.emissions.scope3?.toLocaleString() ||
                          "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h5 className="text-sm font-medium text-white/70 mb-2">
                    Key Metrics
                  </h5>
                  <div className="space-y-2">
                    {uploadResult.summary.metrics.renewable && (
                      <div>
                        <p className="text-lg font-semibold text-purple-400">
                          {uploadResult.summary.metrics.renewable}%
                        </p>
                        <p className="text-xs text-white/50">
                          Renewable Energy
                        </p>
                      </div>
                    )}
                    {uploadResult.summary.metrics.waste_diversion && (
                      <div>
                        <p className="text-lg font-semibold text-green-400">
                          {uploadResult.summary.metrics.waste_diversion}%
                        </p>
                        <p className="text-xs text-white/50">Waste Diverted</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Records Created */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-white/70">
                  Created {uploadResult.summary.inserted.emissions} emission
                  records, {uploadResult.summary.inserted.esg_metrics} ESG
                  metrics,
                  {uploadResult.summary.inserted.targets > 0 &&
                    ` ${uploadResult.summary.inserted.targets} targets,`}{" "}
                  and {uploadResult.summary.inserted.compliance} compliance
                  record
                  {uploadResult.summary.inserted.monthly &&
                    ` (plus ${uploadResult.summary.inserted.monthly.emissions + uploadResult.summary.inserted.monthly.metrics} monthly data points)`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
