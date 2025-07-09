import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationInterface } from '../ConversationInterface';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user_123', email: 'test@example.com' },
    organization: { id: 'org_123', name: 'Test Org' },
  }),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('ConversationInterface', () => {
  const mockProps = {
    conversationId: 'conv_123',
    buildingId: 'bld_123',
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        response: 'AI response',
        uiComponents: [],
      }),
    });
  });

  it('should render conversation interface', () => {
    render(<ConversationInterface {...mockProps} />);
    
    expect(screen.getByPlaceholderText(/ask me anything/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('should display welcome message', () => {
    render(<ConversationInterface {...mockProps} />);
    
    expect(screen.getByText(/hello! i'm your ai assistant/i)).toBeInTheDocument();
  });

  it('should send message on form submit', async () => {
    const user = userEvent.setup();
    render(<ConversationInterface {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'What is our energy usage?');
    await user.click(sendButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            message: 'What is our energy usage?',
            conversationId: 'conv_123',
            context: {
              buildingId: 'bld_123',
            },
          }),
        })
      );
    });
  });

  it('should display user and AI messages', async () => {
    const user = userEvent.setup();
    render(<ConversationInterface {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i);
    await user.type(input, 'Test message');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // Check user message appears
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    // Check AI response appears
    await waitFor(() => {
      expect(screen.getByText('AI response')).toBeInTheDocument();
    });
  });

  it('should handle file upload', async () => {
    const user = userEvent.setup();
    render(<ConversationInterface {...mockProps} />);
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload file/i);

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('should handle voice input', async () => {
    // Mock speech recognition
    const mockSpeechRecognition = {
      start: jest.fn(),
      stop: jest.fn(),
      addEventListener: jest.fn(),
    };

    (window as any).webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);

    render(<ConversationInterface {...mockProps} />);
    
    const voiceButton = screen.getByRole('button', { name: /voice input/i });
    fireEvent.click(voiceButton);

    expect(mockSpeechRecognition.start).toHaveBeenCalled();
  });

  it('should show loading state while sending message', async () => {
    const user = userEvent.setup();
    
    // Delay the API response
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ response: 'Delayed response' }),
      }), 100))
    );

    render(<ConversationInterface {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i);
    await user.type(input, 'Test message');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // Check loading indicator appears
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

    // Wait for response
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    });

    render(<ConversationInterface {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i);
    await user.type(input, 'Test message');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('should render dynamic UI components', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        response: 'Here is your energy data',
        uiComponents: [
          {
            type: 'chart',
            data: {
              type: 'line',
              title: 'Energy Usage',
              series: [
                { name: 'Usage', data: [100, 120, 110] }
              ],
            },
          },
        ],
      }),
    });

    const user = userEvent.setup();
    render(<ConversationInterface {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i);
    await user.type(input, 'Show energy usage');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('Energy Usage')).toBeInTheDocument();
      expect(screen.getByTestId('chart-component')).toBeInTheDocument();
    });
  });

  it('should maintain conversation history', async () => {
    const user = userEvent.setup();
    render(<ConversationInterface {...mockProps} />);
    
    // Send first message
    const input = screen.getByPlaceholderText(/ask me anything/i);
    await user.type(input, 'First message');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('First message')).toBeInTheDocument();
    });

    // Send second message
    await user.clear(input);
    await user.type(input, 'Second message');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('Second message')).toBeInTheDocument();
      // Both messages should be visible
      expect(screen.getByText('First message')).toBeInTheDocument();
    });
  });

  it('should handle keyboard shortcuts', async () => {
    const user = userEvent.setup();
    render(<ConversationInterface {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i);
    await user.type(input, 'Test message');
    
    // Press Enter to send
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should disable input while processing', async () => {
    const user = userEvent.setup();
    
    // Delay the response
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ response: 'Response' }),
      }), 100))
    );

    render(<ConversationInterface {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test');
    await user.click(sendButton);

    // Check input and button are disabled
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();

    // Wait for response
    await waitFor(() => {
      expect(input).not.toBeDisabled();
      expect(sendButton).not.toBeDisabled();
    });
  });
});