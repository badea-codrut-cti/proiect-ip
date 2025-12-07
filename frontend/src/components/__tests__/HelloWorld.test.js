import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HelloWorld from '../HelloWorld';

describe('HelloWorld Component', () => {
  test('renders with default name "World"', () => {
    render(<HelloWorld />);
    expect(screen.getByText('Hello World!')).toBeInTheDocument();
    expect(screen.getByText('Welcome to React Testing')).toBeInTheDocument();
  });

  test('renders with custom name', () => {
    render(<HelloWorld name="Alice" />);
    expect(screen.getByText('Hello Alice!')).toBeInTheDocument();
  });

  test('has correct CSS class', () => {
    const { container } = render(<HelloWorld />);
    const helloWorldDiv = container.querySelector('.hello-world');
    expect(helloWorldDiv).toBeInTheDocument();
  });
});