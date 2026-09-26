import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from './Footer';

describe('Footer Component', () => {
  it('renders copyright text', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    expect(screen.getByText(/© 2026 PLAYSPORT/i)).toBeInTheDocument();
  });

  it('renders required navigation links', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    expect(screen.getByRole('link', { name: /Privacy/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Terms/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Support/i })).toBeInTheDocument();
  });
});
