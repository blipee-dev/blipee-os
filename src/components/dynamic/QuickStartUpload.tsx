"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { 
  Upload,
  FileSpreadsheet,
  FileText,
  Receipt,
  Building,
  TrendingUp,
  Sparkles
} from "lucide-react";

interface QuickStartUploadProps {
  onFileUpload?: (files: FileList) => void;
}

export function QuickStartUpload({ onFileUpload }: QuickStartUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload?.(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload?.(e.target.files);
    }
  };

  const fileTypes = [
    {
      icon: <FileSpreadsheet className="w-8 h-8" />,
      title: "Excel/CSV Files",
      description: "Energy consumption, emissions data",
      color: "text-green-400"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Sustainability Reports",
      description: "PDF reports, ESG documents",
      color: "text-blue-400"
    },
    {
      icon: <Receipt className="w-8 h-8" />,
      title: "Utility Bills",
      description: "Electricity, gas, water bills",
      color: "text-yellow-400"
    },
    {
      icon: <Building className="w-8 h-8" />,
      title: "Building Data",
      description: "Floor plans, equipment lists",
      color: "text-purple-400"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-500/[0.05] to-blue-500/[0.05] backdrop-blur-xl rounded-2xl p-8 border border-white/[0.05]"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-3">
          Quick Start with Your Existing Data
        </h2>
        <p className="text-gray-400 text-lg">
          Already have your data? Perfect! I can import it automatically.
        </p>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-white/[0.2] rounded-2xl p-12 text-center hover:border-purple-500/50 hover:bg-white/[0.02] transition-all cursor-pointer"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Drag & Drop Your Files Here
        </h3>
        <p className="text-gray-400 mb-4">
          or click to browse from your computer
        </p>
        
        <div className="flex flex-wrap gap-3 justify-center text-sm">
          <span className="px-3 py-1 bg-white/[0.05] rounded-full text-gray-400">
            .xlsx
          </span>
          <span className="px-3 py-1 bg-white/[0.05] rounded-full text-gray-400">
            .csv
          </span>
          <span className="px-3 py-1 bg-white/[0.05] rounded-full text-gray-400">
            .pdf
          </span>
          <span className="px-3 py-1 bg-white/[0.05] rounded-full text-gray-400">
            .png/.jpg
          </span>
        </div>
      </div>

      {/* Supported File Types */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        {fileTypes.map((type, index) => (
          <motion.div
            key={type.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.05]"
          >
            <div className={`${type.color} mb-3`}>
              {type.icon}
            </div>
            <h4 className="font-medium text-white mb-1">{type.title}</h4>
            <p className="text-sm text-gray-400">{type.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Benefits */}
      <div className="mt-8 p-6 bg-gradient-to-r from-green-500/[0.1] to-emerald-500/[0.1] rounded-xl border border-green-500/[0.2]">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-white mb-2">
              What happens when you upload?
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start">
                <TrendingUp className="w-4 h-4 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Automatic data extraction and validation</span>
              </li>
              <li className="flex items-start">
                <TrendingUp className="w-4 h-4 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Instant baseline establishment</span>
              </li>
              <li className="flex items-start">
                <TrendingUp className="w-4 h-4 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>AI-powered insights and recommendations</span>
              </li>
              <li className="flex items-start">
                <TrendingUp className="w-4 h-4 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Automatic report generation</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}