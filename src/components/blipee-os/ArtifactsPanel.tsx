"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Maximize2,
  Minimize2,
  Copy,
  Download,
  FileText,
  BarChart3,
  CheckCircle,
  ExternalLink,
  MoreVertical,
  Image as ImageIcon,
  File,
  Table,
} from "lucide-react";

export interface Artifact {
  id: string;
  type: "document" | "chart" | "table" | "image" | "file";
  title: string;
  content: string | React.ReactNode;
  timestamp: Date;
  fileUrl?: string;
  mimeType?: string;
  size?: number;
}

interface ArtifactsPanelProps {
  artifacts: Artifact[];
  currentArtifactId?: string;
  onSelectArtifact: (id: string) => void;
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function ArtifactsPanel({
  artifacts,
  currentArtifactId,
  onSelectArtifact,
  onClose,
  isExpanded = false,
  onToggleExpand,
}: ArtifactsPanelProps) {
  const [copied, setCopied] = useState(false);
  const currentArtifact = artifacts.find((a) => a.id === currentArtifactId);

  const getIcon = (type: Artifact["type"]) => {
    switch (type) {
      case "document":
        return <FileText className="w-4 h-4" />;
      case "chart":
        return <BarChart3 className="w-4 h-4" />;
      case "table":
        return <Table className="w-4 h-4" />;
      case "image":
        return <ImageIcon className="w-4 h-4" />;
      case "file":
        return <File className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleCopy = () => {
    if (currentArtifact && typeof currentArtifact.content === "string") {
      navigator.clipboard.writeText(currentArtifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (currentArtifact && typeof currentArtifact.content === "string") {
      const blob = new Blob([currentArtifact.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentArtifact.title.replace(/\s+/g, "-").toLowerCase()}.${
        currentArtifact.language || "txt"
      }`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: isExpanded ? "100%" : "50%", opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`h-full bg-white dark:bg-[#111111] border-l border-gray-200 dark:border-white/[0.05] flex flex-col ${
        isExpanded ? "fixed inset-0 z-50" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/[0.05]">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentArtifact?.title || "Artifacts"}
          </h2>
          {currentArtifact?.language && (
            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-[#212121] text-gray-600 dark:text-gray-400 rounded">
              {currentArtifact.language}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#212121] rounded-lg transition-all"
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          
          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#212121] rounded-lg transition-all"
            title="Download"
          >
            <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          {/* Open External */}
          <button
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#212121] rounded-lg transition-all"
            title="Open in new window"
          >
            <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          {/* Expand/Collapse */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#212121] rounded-lg transition-all"
              title={isExpanded ? "Minimize" : "Maximize"}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#212121] rounded-lg transition-all"
            title="Close"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Tabs for multiple artifacts */}
      {artifacts.length > 1 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-white/[0.05] overflow-x-auto">
          {artifacts.map((artifact) => (
            <button
              key={artifact.id}
              onClick={() => onSelectArtifact(artifact.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                currentArtifactId === artifact.id
                  ? "bg-gray-100 dark:bg-[#212121] text-gray-900 dark:text-white"
                  : "hover:bg-gray-50 dark:hover:bg-[#212121]/50 text-gray-600 dark:text-gray-400"
              }`}
            >
              {getIcon(artifact.type)}
              <span className="text-sm">{artifact.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {currentArtifact ? (
          <div className="h-full">
            {currentArtifact.type === "document" ? (
              <div className="p-6 prose prose-gray dark:prose-invert max-w-none">
                {typeof currentArtifact.content === "string" ? (
                  <div dangerouslySetInnerHTML={{ __html: currentArtifact.content }} />
                ) : (
                  currentArtifact.content
                )}
              </div>
            ) : currentArtifact.type === "chart" ? (
              <div className="p-6">
                {typeof currentArtifact.content === "string" ? (
                  <div dangerouslySetInnerHTML={{ __html: currentArtifact.content }} />
                ) : (
                  currentArtifact.content
                )}
              </div>
            ) : currentArtifact.type === "image" && currentArtifact.fileUrl ? (
              <div className="flex items-center justify-center h-full p-6">
                <img 
                  src={currentArtifact.fileUrl} 
                  alt={currentArtifact.title}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="p-6">
                {typeof currentArtifact.content === "string" ? (
                  <pre className="whitespace-pre-wrap">{currentArtifact.content}</pre>
                ) : (
                  currentArtifact.content
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No artifacts to display</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with artifact info */}
      {currentArtifact && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-white/[0.05] text-xs text-gray-500 dark:text-gray-400">
          Generated {new Date(currentArtifact.timestamp).toLocaleTimeString()}
        </div>
      )}
    </motion.div>
  );
}