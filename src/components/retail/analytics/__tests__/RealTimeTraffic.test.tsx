import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RealTimeTraffic } from '../RealTimeTraffic';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn();

const mockTrafficData = {
  success: true,
  data: {
    loja: 'OML01',
    current_occupancy: 150,
    last_update: new Date().toISOString(),
    last_hour: {
      entries: 75,
      exits: 65,
    },
    trend: 'increasing',
    regions: {
      region1: 40,
      region2: 30,
      region3: 20,
      region4: 10,
    },
  },
};

describe('RealTimeTraffic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTrafficData),
    });
  });

  it('should render loading state initially', () => {
    render(<RealTimeTraffic storeId="OML01" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display traffic data after loading', async () => {
    render(<RealTimeTraffic storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('people in store')).toBeInTheDocument();
    });
  });

  it('should show traffic trend', async () => {
    render(<RealTimeTraffic storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText(/increasing/i)).toBeInTheDocument();
    });
  });

  it('should display last hour statistics', async () => {
    render(<RealTimeTraffic storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('65')).toBeInTheDocument();
      expect(screen.getByText('Entries')).toBeInTheDocument();
      expect(screen.getByText('Exits')).toBeInTheDocument();
    });
  });

  it('should show regional activity', async () => {
    render(<RealTimeTraffic storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText('Regional Activity')).toBeInTheDocument();
      expect(screen.getByText('Region 1')).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();
    });
  });

  it('should fetch data with correct parameters', async () => {
    render(<RealTimeTraffic storeId="OML01" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/retail/v1/traffic/realtime?loja=OML01');
    });
  });

  it('should refresh data every 30 seconds', async () => {
    jest.useFakeTimers();
    render(<RealTimeTraffic storeId="OML01" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Fast forward 30 seconds
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });

  it('should handle fetch errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<RealTimeTraffic storeId="OML01" />);

    await waitFor(() => {
      expect(screen.queryByText('150')).not.toBeInTheDocument();
    });
  });

  it('should update when store changes', async () => {
    const { rerender } = render(<RealTimeTraffic storeId="OML01" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/retail/v1/traffic/realtime?loja=OML01');
    });

    rerender(<RealTimeTraffic storeId="OML02" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/retail/v1/traffic/realtime?loja=OML02');
    });
  });

  it('should display different trend indicators', async () => {
    // Test decreasing trend
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ...mockTrafficData,
        data: { ...mockTrafficData.data, trend: 'decreasing' },
      }),
    });

    const { rerender } = render(<RealTimeTraffic storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText(/decreasing/i)).toBeInTheDocument();
    });

    // Test stable trend
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ...mockTrafficData,
        data: { ...mockTrafficData.data, trend: 'stable' },
      }),
    });

    rerender(<RealTimeTraffic storeId="OML01" />);

    await waitFor(() => {
      expect(screen.getByText(/stable/i)).toBeInTheDocument();
    });
  });
});