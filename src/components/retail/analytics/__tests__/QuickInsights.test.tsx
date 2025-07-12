import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QuickInsights } from '../QuickInsights';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn();

const mockInsights = [
  { type: 'success', message: 'Sales up 15% compared to last week' },
  { type: 'warning', message: 'Traffic decreased during lunch hours' },
  { type: 'info', message: 'Peak conversion rate at 2 PM' },
];

describe('QuickInsights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          vendas: { total_com_iva: 95000, transacoes: 300 },
          trafego: { visitantes: 1500 },
          conversao: { taxa_conversao: 20 },
        },
      }),
    });
  });

  it('should render component title', () => {
    render(<QuickInsights storeId="OML01" />);
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    render(<QuickInsights storeId="OML01" />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should fetch analytics data on mount', async () => {
    render(<QuickInsights storeId="OML01" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/retail/v1/analytics?loja=OML01')
      );
    });
  });

  it('should display AI-generated insights', async () => {
    render(<QuickInsights storeId="OML01" />);

    await waitFor(() => {
      // Should show at least one insight based on the data
      const insights = screen.getAllByTestId('insight-item');
      expect(insights.length).toBeGreaterThan(0);
    });
  });

  it('should display high sales insight when sales are good', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          vendas: { total_com_iva: 150000, transacoes: 500 },
          trafego: { visitantes: 2000 },
          conversao: { taxa_conversao: 25 },
        },
      }),
    });

    render(<QuickInsights storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText(/excellent sales performance/i)).toBeInTheDocument();
    });
  });

  it('should display low conversion warning', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          vendas: { total_com_iva: 50000, transacoes: 100 },
          trafego: { visitantes: 2000 },
          conversao: { taxa_conversao: 5 },
        },
      }),
    });

    render(<QuickInsights storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText(/conversion rate needs attention/i)).toBeInTheDocument();
    });
  });

  it('should use correct icon for insight types', async () => {
    render(<QuickInsights storeId="OML01" />);

    await waitFor(() => {
      const successIcon = screen.getByTestId('success-icon');
      expect(successIcon).toHaveClass('text-green-400');
    });
  });

  it('should refresh insights every 5 minutes', async () => {
    jest.useFakeTimers();
    render(<QuickInsights storeId="OML01" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Fast forward 5 minutes
    jest.advanceTimersByTime(5 * 60 * 1000);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<QuickInsights storeId="OML01" />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      // Should show some default insight or error state
    });
  });

  it('should update when store changes', async () => {
    const { rerender } = render(<QuickInsights storeId="OML01" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('loja=OML01')
      );
    });

    rerender(<QuickInsights storeId="OML02" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('loja=OML02')
      );
    });
  });

  it('should display last update time', async () => {
    render(<QuickInsights storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText(/Updated:/)).toBeInTheDocument();
    });
  });
});