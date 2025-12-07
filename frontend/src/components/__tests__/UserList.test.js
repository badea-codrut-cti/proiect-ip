import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import UserList from '../UserList';

describe('UserList Component', () => {
  const mockUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ];

  test('renders empty state when no users provided', () => {
    render(<UserList />);
    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  test('renders list of users', () => {
    render(<UserList users={mockUsers} />);
    expect(screen.getByText('John Doe - john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith - jane@example.com')).toBeInTheDocument();
  });

  test('user selection works correctly', async () => {
    const mockOnUserSelect = jest.fn();
    const user = userEvent.setup();
    
    render(<UserList users={mockUsers} onUserSelect={mockOnUserSelect} />);
    
    await user.click(screen.getByTestId('user-1'));
    
    expect(screen.getByTestId('selected-user')).toBeInTheDocument();
    expect(screen.getByText('Selected: John Doe')).toBeInTheDocument();
    expect(mockOnUserSelect).toHaveBeenCalledWith(mockUsers[0]);
  });

  test('clicking different user updates selection', async () => {
    const user = userEvent.setup();
    
    render(<UserList users={mockUsers} />);
    
    await user.click(screen.getByTestId('user-1'));
    expect(screen.getByText('Selected: John Doe')).toBeInTheDocument();
    
    await user.click(screen.getByTestId('user-2'));
    expect(screen.getByText('Selected: Jane Smith')).toBeInTheDocument();
  });
});