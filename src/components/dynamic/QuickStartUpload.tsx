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
      className="bg-white dark:bg-[#212121] rounded-2xl p-6 border border-gray-200 dark:border-gray-700 my-4"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          Quick Start with Your Existing Data
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-base">
          Already have your data? Perfect! I can import it automatically.
        </p>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-purple-500 dark:hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Drag & Drop Your Files Here
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          or click to browse from your computer
        </p>
        
        <div className="flex flex-wrap gap-2 justify-center text-xs">
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
            .xlsx
          </span>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
            .csv
          </span>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
            .pdf
          </span>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
            .png/.jpg
          </span>
        </div>
      </div>

      {/* Supported File Types */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        {fileTypes.map((type, index) => (
          <motion.div
            key={type.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
          >
            <div className="text-gray-600 dark:text-gray-400 mb-2">
              {type.icon}
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-sm">{type.title}</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">{type.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Benefits */}
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              What happens when you upload?
            </h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Automatic data extraction and validation</span>
              </li>
              <li className="flex items-start">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Instant baseline establishment</span>
              </li>
              <li className="flex items-start">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>AI-powered insights and recommendations</span>
              </li>
              <li className="flex items-start">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Automatic report generation</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}