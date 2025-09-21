"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';

interface MetricsChartProps {
  title: string;
  data: number[];
  labels: string[];
  type?: 'line' | 'bar' | 'area';
  color?: string;
  height?: number;
  showLegend?: boolean;
  unit?: string;
}

export function MetricsChart({
  title,
  data,
  labels,
  type = 'line',
  color = '#8b5cf6',
  height = 200,
  showLegend = false,
  unit = ''
}: MetricsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, height);

    // Calculate dimensions
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find min and max values
    const maxValue = Math.max(...data, 0);
    const minValue = Math.min(...data, 0);
    const range = maxValue - minValue || 1;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      const value = maxValue - (range * i) / 5;
      ctx.fillText(
        value.toFixed(1) + unit,
        padding.left - 5,
        y + 3
      );
    }

    // Draw data
    if (type === 'line' || type === 'area') {
      // Draw line/area chart
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      data.forEach((value, index) => {
        const x = padding.left + (chartWidth * index) / (data.length - 1);
        const y = padding.top + chartHeight * (1 - (value - minValue) / range);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Fill area if type is area
      if (type === 'area') {
        ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
        ctx.lineTo(padding.left, padding.top + chartHeight);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '00');
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Draw data points
      ctx.fillStyle = color;
      data.forEach((value, index) => {
        const x = padding.left + (chartWidth * index) / (data.length - 1);
        const y = padding.top + chartHeight * (1 - (value - minValue) / range);

        ctx.beginPath();
        ctx.arc(x, y, hoveredIndex === index ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (type === 'bar') {
      // Draw bar chart
      const barWidth = chartWidth / data.length * 0.8;
      const barSpacing = chartWidth / data.length * 0.2;

      data.forEach((value, index) => {
        const x = padding.left + (chartWidth * index) / data.length + barSpacing / 2;
        const barHeight = (Math.abs(value - minValue) / range) * chartHeight;
        const y = padding.top + chartHeight - barHeight;

        // Draw bar
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '80');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      });
    }

    // Draw X-axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    const labelInterval = Math.ceil(labels.length / 10);
    labels.forEach((label, index) => {
      if (index % labelInterval === 0) {
        const x = padding.left + (chartWidth * index) / (labels.length - 1);
        ctx.fillText(label, x, height - 15);
      }
    });

    // Draw title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, padding.left, 15);

  }, [data, labels, type, color, height, hoveredIndex, unit]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = { left: 50, right: 20 };
    const chartWidth = rect.width - padding.left - padding.right;

    const index = Math.round(((x - padding.left) / chartWidth) * (data.length - 1));
    if (index >= 0 && index < data.length) {
      setHoveredIndex(index);
    } else {
      setHoveredIndex(null);
    }
  };

  return (
    <Card className="bg-black/40 backdrop-blur-xl border-white/[0.05] p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          style={{ height }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
        />
        {hoveredIndex !== null && (
          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-xl rounded px-2 py-1 text-xs">
            <div className="text-gray-400">{labels[hoveredIndex]}</div>
            <div className="text-white font-bold">
              {data[hoveredIndex].toFixed(2)}{unit}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

interface RealtimeMetricsProps {
  endpoint: string;
  title: string;
  metric: string;
  type?: 'line' | 'bar' | 'area';
  color?: string;
  refreshInterval?: number;
  maxDataPoints?: number;
  unit?: string;
}

export function RealtimeMetrics({
  endpoint,
  title,
  metric,
  type = 'line',
  color = '#8b5cf6',
  refreshInterval = 5000,
  maxDataPoints = 30,
  unit = ''
}: RealtimeMetricsProps) {
  const [data, setData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) return;

        const result = await response.json();
        const value = metric.split('.').reduce((obj, key) => obj?.[key], result);

        if (typeof value === 'number') {
          setData(prev => {
            const newData = [...prev, value];
            if (newData.length > maxDataPoints) {
              newData.shift();
            }
            return newData;
          });

          setLabels(prev => {
            const newLabels = [...prev, new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })];
            if (newLabels.length > maxDataPoints) {
              newLabels.shift();
            }
            return newLabels;
          });
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [endpoint, metric, refreshInterval, maxDataPoints]);

  return (
    <MetricsChart
      title={title}
      data={data}
      labels={labels}
      type={type}
      color={color}
      unit={unit}
    />
  );
}