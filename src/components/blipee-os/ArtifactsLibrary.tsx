"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  BarChart3,
  Table,
  Search,
  Filter,
  Clock,
  ArrowLeft,
  Trash2,
  Download,
  Copy,
  MoreVertical,
  Grid3x3,
  List,
  X,
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  FileImage,
} from "lucide-react";
import { format } from "date-fns";

export interface Artifact {
  id: string;
  type: "document" | "chart" | "table" | "image" | "file";
  title: string;
  content: string | React.ReactNode;
  timestamp: Date;
  conversationId?: string;
  preview?: string;
  fileUrl?: string;
  mimeType?: string;
  size?: number;
}

interface ArtifactsLibraryProps {
  artifacts: Artifact[];
  onBack: () => void;
  onSelectArtifact: (artifact: Artifact) => void;
  onDeleteArtifact: (id: string) => void;
}

export function ArtifactsLibrary({
  artifacts,
  onBack,
  onSelectArtifact,
  onDeleteArtifact,
}: ArtifactsLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getIcon = (type: Artifact["type"], mimeType?: string) => {
    switch (type) {
      case "document":
        return <FileText className="w-5 h-5" />;
      case "chart":
        return <BarChart3 className="w-5 h-5" />;
      case "table":
        return <Table className="w-5 h-5" />;
      case "image":
        return <ImageIcon className="w-5 h-5" />;
      case "file":
        if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel")) {
          return <FileSpreadsheet className="w-5 h-5" />;
        } else if (mimeType?.startsWith("image/")) {
          return <FileImage className="w-5 h-5" />;
        }
        return <File className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: Artifact["type"]) => {
    switch (type) {
      case "document":
        return "bg-green-500/10 text-green-500 dark:bg-green-500/20";
      case "chart":
        return "bg-purple-500/10 text-purple-500 dark:bg-purple-500/20";
      case "table":
        return "bg-orange-500/10 text-orange-500 dark:bg-orange-500/20";
      case "image":
        return "bg-pink-500/10 text-pink-500 dark:bg-pink-500/20";
      case "file":
        return "bg-gray-500/10 text-gray-500 dark:bg-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 dark:bg-gray-500/20";
    }
  };

  const filteredArtifacts = artifacts.filter((artifact) => {
    const matchesSearch = artifact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof artifact.content === "string" && artifact.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === "all" || artifact.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleDownload = (artifact: Artifact) => {
    if (typeof artifact.content === "string") {
      const blob = new Blob([artifact.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${artifact.title.replace(/\s+/g, "-").toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#212121]">
      <div className="flex-1 flex flex-col w-full">
        {/* Content Container */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-normal text-gray-900 dark:text-white">
                  Your library
                </h1>
                <button
                  onClick={onBack}
                  className="px-4 py-2 bg-white dark:bg-[#111111] hover:bg-gray-50 dark:hover:bg-[#616161] border border-gray-200 dark:border-white/[0.1] rounded-lg transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  ← Back to chat
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border border-gray-300 dark:border-white/[0.2] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-white/[0.3]"
                />
              </div>

              {/* Library count and filters */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredArtifacts.length} items in your library
                </p>
                <div className="flex items-center gap-4">
                  {/* Type Filter */}
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-1.5 bg-transparent border border-gray-300 dark:border-white/[0.2] rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
                  >
                    <option value="all">All types</option>
                    <option value="document">Documents</option>
                    <option value="chart">Charts</option>
                    <option value="table">Tables</option>
                    <option value="image">Images</option>
                    <option value="file">Files</option>
                  </select>
                  {/* View Toggle */}
                  <button
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#616161] rounded-lg transition-colors"
                  >
                    {viewMode === "grid" ? (
                      <List className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Grid3x3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Content Grid/List */}
            {filteredArtifacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FileText className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">No items found</p>
                <p className="text-sm mt-2">Start a conversation to generate content</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-4 mx-auto w-fit">
              {filteredArtifacts.map((artifact) => (
                <motion.div
                  key={artifact.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => setSelectedArtifact(artifact)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(artifact.type)}`}>
                      {getIcon(artifact.type, artifact.mimeType)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteArtifact(artifact.id);
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-[#616161] rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate">
                    {artifact.title}
                  </h3>
                  

                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(artifact.timestamp), "MMM d, yyyy")}
                  </div>

                  {/* Preview */}
                  {artifact.type === "image" && artifact.fileUrl ? (
                    <div className="mt-3 rounded overflow-hidden bg-gray-50 dark:bg-[#212121]">
                      <img 
                        src={artifact.fileUrl} 
                        alt={artifact.title}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  ) : typeof artifact.content === "string" ? (
                    <div className="mt-3 p-2 bg-gray-50 dark:bg-[#212121] rounded text-xs text-gray-600 dark:text-gray-400 font-mono line-clamp-3">
                      {artifact.content.slice(0, 150)}...
                    </div>
                  ) : artifact.size ? (
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Size: {formatFileSize(artifact.size)}
                    </div>
                  ) : null}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredArtifacts.map((artifact) => (
                <motion.div
                  key={artifact.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedArtifact(artifact)}
                >
                  <div className={`p-2 rounded-lg ${getTypeColor(artifact.type)}`}>
                    {getIcon(artifact.type, artifact.mimeType)}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {artifact.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(artifact.timestamp), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof artifact.content === "string") {
                          handleCopy(artifact.content);
                        }
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-[#616161] rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(artifact);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-[#616161] rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteArtifact(artifact.id);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-[#616161] rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedArtifact && (
        <div className="w-1/2 border-l border-gray-200 dark:border-white/[0.05] bg-white dark:bg-[#111111] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/[0.05]">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedArtifact.title}
              </h2>
            </div>
            <button
              onClick={() => setSelectedArtifact(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#616161] rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {selectedArtifact.type === "image" && selectedArtifact.fileUrl ? (
              <div className="flex items-center justify-center h-full">
                <img 
                  src={selectedArtifact.fileUrl} 
                  alt={selectedArtifact.title}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            ) : selectedArtifact.type === "file" && selectedArtifact.fileUrl ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className={`p-4 rounded-lg ${getTypeColor(selectedArtifact.type)}`}>
                  {getIcon(selectedArtifact.type, selectedArtifact.mimeType)}
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {selectedArtifact.title}
                  </h3>
                  {selectedArtifact.size && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Size: {formatFileSize(selectedArtifact.size)}
                    </p>
                  )}
                  {selectedArtifact.mimeType && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Type: {selectedArtifact.mimeType}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (selectedArtifact.fileUrl) {
                      window.open(selectedArtifact.fileUrl, '_blank');
                    }
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-[#616161] hover:bg-gray-200 dark:hover:bg-[#757575] rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
              </div>
            ) : (
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {typeof selectedArtifact.content === "string" ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedArtifact.content }} />
                ) : (
                  selectedArtifact.content
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-white/[0.05] flex gap-2">
            <button
              onClick={() => {
                if (typeof selectedArtifact.content === "string") {
                  handleCopy(selectedArtifact.content);
                }
              }}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-[#616161] hover:bg-gray-200 dark:hover:bg-[#757575] rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button
              onClick={() => handleDownload(selectedArtifact)}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-[#616161] hover:bg-gray-200 dark:hover:bg-[#757575] rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}