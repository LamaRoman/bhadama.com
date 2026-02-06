// __tests__/components/Footer.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

describe('Footer - Rendering', () => {
  it('should render footer component', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should display company name', () => {
    render(<Footer />);
    expect(screen.getByText('myBigYard.com')).toBeInTheDocument();
  });

  it('should display company description', () => {
    render(<Footer />);
    // Match the actual text from the component
    expect(screen.getByText(/trusted booking platform for rooms/i)).toBeInTheDocument();
  });
});

describe('Footer - Quick Links', () => {
  it('should render Quick Links section', () => {
    render(<Footer />);
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
  });

  it('should have Find Listings link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /find listings/i });
    expect(link).toHaveAttribute('href', '/listings');
  });

  it('should have Login link', () => {
    render(<Footer />);
    const links = screen.getAllByRole('link', { name: /login/i });
    const loginLink = links.find(l => l.getAttribute('href') === '/login');
    expect(loginLink).toBeInTheDocument();
  });

  it('should have Create Account link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /create account/i });
    expect(link).toHaveAttribute('href', '/register');
  });

  it('should have Contact Us link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /contact us/i });
    expect(link).toHaveAttribute('href', '/contact');
  });
});

describe('Footer - Blog Section', () => {
  it('should render Blog section', () => {
    render(<Footer />);
    expect(screen.getByText('Blog')).toBeInTheDocument();
  });

  it('should have All Articles link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /all articles/i });
    expect(link).toHaveAttribute('href', '/blogs');
  });

  it('should have Hosting Tips link with category filter', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /hosting tips/i });
    expect(link).toHaveAttribute('href', '/blogs?category=HOSTING_TIPS');
  });

  it('should have Event Stories link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /event stories/i });
    expect(link).toHaveAttribute('href', '/blogs?category=EVENT_EXPERIENCE');
  });

  it('should have Inspiration link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /inspiration/i });
    expect(link).toHaveAttribute('href', '/blogs?category=INSPIRATION');
  });
});

describe('Footer - For Owners Section', () => {
  it('should render For Owners section', () => {
    render(<Footer />);
    expect(screen.getByText('For Owners')).toBeInTheDocument();
  });

  it('should have Owner Dashboard link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /owner dashboard/i });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('should have List Your Property link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /list your property/i });
    expect(link).toHaveAttribute('href', '/list-property');
  });

  it('should have Pricing link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /pricing/i });
    expect(link).toHaveAttribute('href', '/pricing');
  });

  it('should have Help Center link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /help center/i });
    expect(link).toHaveAttribute('href', '/help');
  });
});

describe('Footer - Contact Section', () => {
  it('should render Contact section', () => {
    render(<Footer />);
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('should display email', () => {
    render(<Footer />);
    expect(screen.getByText(/support@mybigyard.com/i)).toBeInTheDocument();
  });

  it('should display phone', () => {
    render(<Footer />);
    expect(screen.getByText(/\+977-98/i)).toBeInTheDocument();
  });

  it('should display location', () => {
    render(<Footer />);
    expect(screen.getByText(/Kathmandu, Nepal/i)).toBeInTheDocument();
  });
});

describe('Footer - Bottom Section', () => {
  it('should display current year copyright', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
  });

  it('should have Terms link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /^terms$/i });
    expect(link).toHaveAttribute('href', '/terms');
  });

  it('should have Privacy link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /^privacy$/i });
    expect(link).toHaveAttribute('href', '/privacy');
  });

  it('should have Cookies link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /^cookies$/i });
    expect(link).toHaveAttribute('href', '/cookies');
  });
});

describe('Footer - Styling', () => {
  it('should have dark background', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('bg-gray-900');
  });
});
