import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders header', () => {
  render(<App />);
  const headerElement = screen.getByText(/会計＆資産シミュレーター/i);
  expect(headerElement).toBeInTheDocument();
});
