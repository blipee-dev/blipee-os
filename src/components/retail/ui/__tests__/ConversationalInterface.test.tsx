import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationalInterface } from '../ConversationalInterface';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn();

const mockAnalyticsData = {
  success: true,
  data: {
    vendas: {
      total_com_iva: 95000,
      transacoes: 300,
      ticket_medio: 75,
    },
    conversao: {
      taxa_conversao: 15,
      tempo_medio_permanencia: 20,
      unidades_por_transacao: 2,
    },
  },
};

const mockTrafficData = {
  success: true,
  data: {
    current_occupancy: 120,
    trend: 'stable',
    last_hour: {
      entries: 60,
      exits: 55,
    },
  },
};

describe('ConversationalInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render chat interface', () => {
    render(<ConversationalInterface selectedStore="OML01" />);
    
    expect(screen.getByText('Retail AI Assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ask me about/i)).toBeInTheDocument();
  });

  it('should display welcome message', () => {
    render(<ConversationalInterface selectedStore="OML01" />);
    
    expect(screen.getByText(/Hello! I'm your retail AI assistant/i)).toBeInTheDocument();
  });

  it('should handle user input', async () => {
    const user = userEvent.setup();
    render(<ConversationalInterface selectedStore="OML01" />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    await user.type(input, 'Show me sales');
    
    expect(input).toHaveValue('Show me sales');
  });

  it('should send message on form submit', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAnalyticsData),
    });

    const user = userEvent.setup();
    render(<ConversationalInterface selectedStore="OML01" />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    await user.type(input, 'What are my sales today?');
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('What are my sales today?')).toBeInTheDocument();
    });
  });

  it('should fetch and display sales data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAnalyticsData),
    });

    const user = userEvent.setup();
    render(<ConversationalInterface selectedStore="OML01" />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    await user.type(input, 'Show me sales');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/retail/v1/analytics'));
      expect(screen.getByText(/Total Sales/)).toBeInTheDocument();
      expect(screen.getByText(/€95,000/)).toBeInTheDocument();
    });
  });

  it('should fetch and display traffic data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTrafficData),
    });

    const user = userEvent.setup();
    render(<ConversationalInterface selectedStore="OML01" />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    await user.type(input, 'How many people are in my store?');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/retail/v1/traffic/realtime'));
      expect(screen.getByText(/Current Occupancy/)).toBeInTheDocument();
      expect(screen.getByText(/120 people/)).toBeInTheDocument();
    });
  });

  it('should display help message', async () => {
    const user = userEvent.setup();
    render(<ConversationalInterface selectedStore="OML01" />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    await user.type(input, 'help');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText(/I can help you with/)).toBeInTheDocument();
      expect(screen.getByText(/Sales Analysis/)).toBeInTheDocument();
      expect(screen.getByText(/Traffic Insights/)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<ConversationalInterface selectedStore="OML01" />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    await user.type(input, 'Show me sales');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText(/having trouble accessing/i)).toBeInTheDocument();
    });
  });

  it('should display loading state while processing', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData),
      }), 100))
    );

    const user = userEvent.setup();
    render(<ConversationalInterface selectedStore="OML01" />);
    
    const input = screen.getByPlaceholderText(/ask me about/i);
    await user.type(input, 'Show me sales');
    await user.keyboard('{Enter}');

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('should clear input after sending message', async () => {
    const user = userEvent.setup();
    render(<ConversationalInterface selectedStore="OML01" />);
    
    const input = screen.getByPlaceholderText(/ask me about/i) as HTMLInputElement;
    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });
});