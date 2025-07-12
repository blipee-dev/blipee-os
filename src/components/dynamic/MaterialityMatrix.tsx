import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, Move, Plus, Save } from 'lucide-react';

interface MaterialTopic {
  id: string;
  name: string;
  category: 'environmental' | 'social' | 'governance';
  description?: string;
  businessImpact: number; // 1-5
  stakeholderConcern: number; // 1-5
  examples?: string[];
}

interface MaterialityMatrixProps {
  topics: MaterialTopic[];
  industryContext?: string;
  onUpdate?: (topics: MaterialTopic[]) => void;
  onSave?: (assessment: any) => void;
  interactive?: boolean;
}

export function MaterialityMatrix({ 
  topics: initialTopics, 
  industryContext,
  onUpdate,
  onSave,
  interactive = true
}: MaterialityMatrixProps) {
  const [topics, setTopics] = useState<MaterialTopic[]>(initialTopics);
  const [selectedTopic, setSelectedTopic] = useState<MaterialTopic | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental': return 'bg-green-100 text-green-800';
      case 'social': return 'bg-blue-100 text-blue-800';
      case 'governance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTopicMove = (topic: MaterialTopic, newX: number, newY: number) => {
    const updatedTopics = topics.map(t => 
      t.id === topic.id 
        ? { ...t, businessImpact: newX, stakeholderConcern: newY }
        : t
    );
    setTopics(updatedTopics);
    onUpdate?.(updatedTopics);
  };

  const getTopicPosition = (topic: MaterialTopic) => {
    // Convert 1-5 scale to percentage for positioning
    const x = ((topic.businessImpact - 1) / 4) * 100;
    const y = ((5 - topic.stakeholderConcern) / 4) * 100; // Invert Y axis
    return { x, y };
  };

  const getQuadrant = (businessImpact: number, stakeholderConcern: number) => {
    if (businessImpact >= 3.5 && stakeholderConcern >= 3.5) return 'Critical';
    if (businessImpact >= 3.5 && stakeholderConcern < 3.5) return 'Monitor';
    if (businessImpact < 3.5 && stakeholderConcern >= 3.5) return 'Communicate';
    return 'Low Priority';
  };

  const handleDragStart = (e: React.DragEvent, topic: MaterialTopic) => {
    setIsDragging(true);
    setSelectedTopic(topic);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!selectedTopic || !interactive) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 4 + 1;
    const y = 5 - ((e.clientY - rect.top) / rect.height) * 4;
    
    handleTopicMove(selectedTopic, Math.max(1, Math.min(5, x)), Math.max(1, Math.min(5, y)));
    setSelectedTopic(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSave = () => {
    const assessment = {
      topics,
      completedAt: new Date().toISOString(),
      industryContext,
      criticalTopics: topics.filter(t => getQuadrant(t.businessImpact, t.stakeholderConcern) === 'Critical'),
      metadata: {
        totalTopics: topics.length,
        averageBusinessImpact: topics.reduce((sum, t) => sum + t.businessImpact, 0) / topics.length,
        averageStakeholderConcern: topics.reduce((sum, t) => sum + t.stakeholderConcern, 0) / topics.length
      }
    };
    onSave?.(assessment);
  };

  const quadrants = [
    { name: 'Critical', x: '50%', y: '0%', color: 'bg-red-50' },
    { name: 'Communicate', x: '0%', y: '0%', color: 'bg-yellow-50' },
    { name: 'Monitor', x: '50%', y: '50%', color: 'bg-blue-50' },
    { name: 'Low Priority', x: '0%', y: '50%', color: 'bg-gray-50' }
  ];

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Move className="h-5 w-5" />
          Materiality Assessment Matrix
        </CardTitle>
        {industryContext && (
          <p className="text-sm text-muted-foreground">
            Customized for {industryContext} industry
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        {interactive && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Info className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              Drag topics to position them based on business impact (horizontal) and stakeholder concern (vertical)
            </p>
          </div>
        )}

        {/* Matrix Grid */}
        <div className="relative">
          {/* Axis Labels */}
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium">
            Stakeholder Concern →
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 text-sm font-medium">
            Business Impact →
          </div>

          {/* Matrix Container */}
          <div 
            className="relative w-full h-[500px] border-2 border-gray-300 bg-white rounded-lg overflow-hidden"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {/* Quadrant Backgrounds */}
            {quadrants.map((quadrant) => (
              <div
                key={quadrant.name}
                className={`absolute w-1/2 h-1/2 ${quadrant.color} border border-gray-200`}
                style={{ left: quadrant.x, top: quadrant.y }}
              >
                <span className="absolute top-2 left-2 text-xs font-medium text-gray-600">
                  {quadrant.name}
                </span>
              </div>
            ))}

            {/* Grid Lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-0 right-0 border-t-2 border-gray-300" />
              <div className="absolute top-0 bottom-0 left-1/2 border-l-2 border-gray-300" />
            </div>

            {/* Topics */}
            {topics.map((topic) => {
              const position = getTopicPosition(topic);
              const quadrant = getQuadrant(topic.businessImpact, topic.stakeholderConcern);
              
              return (
                <div
                  key={topic.id}
                  className={`absolute p-2 rounded-lg cursor-move transition-all ${
                    isDragging && selectedTopic?.id === topic.id ? 'opacity-50' : ''
                  }`}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: selectedTopic?.id === topic.id ? 10 : 1
                  }}
                  draggable={interactive}
                  onDragStart={(e) => handleDragStart(e, topic)}
                  onDragEnd={handleDragEnd}
                >
                  <Badge 
                    className={`${getCategoryColor(topic.category)} shadow-lg hover:shadow-xl transition-shadow`}
                  >
                    {topic.name}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <Badge className={getCategoryColor('environmental')}>Environmental</Badge>
            <Badge className={getCategoryColor('social')}>Social</Badge>
            <Badge className={getCategoryColor('governance')}>Governance</Badge>
          </div>
        </div>

        {/* Selected Topic Details */}
        {selectedTopic && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">{selectedTopic.name}</h4>
            {selectedTopic.description && (
              <p className="text-sm text-muted-foreground mb-2">{selectedTopic.description}</p>
            )}
            <div className="flex gap-4 text-sm">
              <span>Business Impact: {selectedTopic.businessImpact}/5</span>
              <span>Stakeholder Concern: {selectedTopic.stakeholderConcern}/5</span>
              <span className="font-medium">
                Quadrant: {getQuadrant(selectedTopic.businessImpact, selectedTopic.stakeholderConcern)}
              </span>
            </div>
          </div>
        )}

        {/* Critical Topics Summary */}
        <div className="p-4 bg-red-50 rounded-lg">
          <h4 className="font-medium mb-2 text-red-900">Critical Material Topics</h4>
          <div className="flex flex-wrap gap-2">
            {topics
              .filter(t => getQuadrant(t.businessImpact, t.stakeholderConcern) === 'Critical')
              .map(topic => (
                <Badge key={topic.id} variant="destructive">
                  {topic.name}
                </Badge>
              ))}
          </div>
        </div>

        {/* Save Button */}
        {interactive && onSave && (
          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Assessment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}