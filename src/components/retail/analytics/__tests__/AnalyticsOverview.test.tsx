import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AnalyticsOverview } from '../AnalyticsOverview';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn();

const mockAnalyticsData = {
  success: true,
  data: {
    loja: 'OML01',
    periodo: {
      inicio: '2025-07-12T00:00:00',
      fim: '2025-07-12T23:59:59',
    },
    vendas: {
      total_com_iva: 93026,
      total_sem_iva: 40018,
      transacoes: 284,
      ticket_medio: 124,
    },
    trafego: {
      visitantes: 1684,
      total_passagens: 3970,
      entry_rate: 55,
    },
    conversao: {
      taxa_conversao: 26,
      tempo_medio_permanencia: 21,
      unidades_por_transacao: 2,
    },
    top_performers: {
      vendedores: [
        { codigo: 'V001', nome: 'Maria Silva', vendas: 15000 },
        { codigo: 'V002', nome: 'João Santos', vendas: 12000 },
      ],
      produtos: [
        { item: 'P001', descricao: 'Produto A', quantidade: 250 },
        { item: 'P002', descricao: 'Produto B', quantidade: 180 },
      ],
    },
    regioes: {
      ocupacao: { region1: 45, region2: 30, region3: 15, region4: 10 },
      top_2: ['region1', 'region2'],
      bottom_2: ['region3', 'region4'],
    },
    ultima_atualizacao: '2025-07-12T12:14:59.369Z',
  },
};

describe('AnalyticsOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalyticsData),
    });
  });

  it('should render component title', () => {
    render(<AnalyticsOverview storeId="OML01" />);
    expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    render(<AnalyticsOverview storeId="OML01" />);
    const loadingElements = screen.getAllByText((content, element) => {
      return element?.className?.includes('animate-pulse') || false;
    });
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should fetch analytics data on mount', async () => {
    render(<AnalyticsOverview storeId="OML01" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/retail/v1/analytics?loja=OML01')
      );
    });
  });

  it('should display sales metrics', async () => {
    render(<AnalyticsOverview storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText('Sales Performance')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('€93,026')).toBeInTheDocument();
      expect(screen.getByText('284')).toBeInTheDocument(); // transactions
      expect(screen.getByText('€124')).toBeInTheDocument(); // average ticket
    });
  });

  it('should display customer behavior metrics', async () => {
    render(<AnalyticsOverview storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText('Customer Behavior')).toBeInTheDocument();
      expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
      expect(screen.getByText('26%')).toBeInTheDocument();
      expect(screen.getByText('Dwell Time')).toBeInTheDocument();
      expect(screen.getByText('21')).toBeInTheDocument();
      expect(screen.getByText('Items per Sale')).toBeInTheDocument();
      expect(screen.getByText('2.0')).toBeInTheDocument();
    });
  });

  it('should handle date range changes', async () => {
    render(<AnalyticsOverview storeId="OML01" />);

    await waitFor(() => {
      const dateSelector = screen.getByRole('combobox');
      expect(dateSelector).toBeInTheDocument();
    });

    const dateSelector = screen.getByRole('combobox');
    fireEvent.change(dateSelector, { target: { value: 'week' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('start_date=')
      );
    });
  });

  it('should display performance indicators', async () => {
    render(<AnalyticsOverview storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText('Performance Indicators')).toBeInTheDocument();
      expect(screen.getByText('Sales Efficiency')).toBeInTheDocument();
      expect(screen.getByText('Customer Engagement')).toBeInTheDocument();
    });
  });

  it('should show excellent performance for high sales', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ...mockAnalyticsData,
        data: {
          ...mockAnalyticsData.data,
          vendas: {
            ...mockAnalyticsData.data.vendas,
            ticket_medio: 150,
          },
        },
      }),
    });

    render(<AnalyticsOverview storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });
  });

  it('should show high engagement for good conversion', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ...mockAnalyticsData,
        data: {
          ...mockAnalyticsData.data,
          conversao: {
            ...mockAnalyticsData.data.conversao,
            taxa_conversao: 20,
          },
        },
      }),
    });

    render(<AnalyticsOverview storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<AnalyticsOverview storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText('No analytics data available')).toBeInTheDocument();
    });
  });

  it('should update when store changes', async () => {
    const { rerender } = render(<AnalyticsOverview storeId="OML01" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('loja=OML01')
      );
    });

    rerender(<AnalyticsOverview storeId="OML02" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('loja=OML02')
      );
    });
  });

  it('should display last sync time', async () => {
    render(<AnalyticsOverview storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText(/Data updates every 20 minutes/)).toBeInTheDocument();
      expect(screen.getByText(/Last sync:/)).toBeInTheDocument();
    });
  });

  it('should show correct VAT label', async () => {
    render(<AnalyticsOverview storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText('Including VAT')).toBeInTheDocument();
    });
  });
});