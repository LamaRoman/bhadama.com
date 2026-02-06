// __tests__/components/SearchBar.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '@/components/SearchBar';

// Mock react-datepicker
jest.mock('react-datepicker', () => {
  const MockDatePicker = ({ onChange, selectsRange, placeholderText, customInput }) => {
    if (customInput) {
      return React.cloneElement(customInput, {
        onClick: () => {},
        value: placeholderText,
      });
    }
    
    return (
      <input
        data-testid="date-picker"
        placeholder={placeholderText}
        onChange={(e) => {
          if (selectsRange) {
            onChange([new Date(), new Date()]);
          }
        }}
      />
    );
  };
  return MockDatePicker;
});

// Mock Google Maps
const mockAutocomplete = {
  addListener: jest.fn(),
  getPlace: jest.fn(() => ({
    formatted_address: 'Kathmandu, Nepal',
    name: 'Kathmandu',
  })),
};

const mockGoogle = {
  maps: {
    places: {
      Autocomplete: jest.fn(() => mockAutocomplete),
    },
  },
};

describe('SearchBar - Rendering', () => {
  it('should render all form elements', () => {
    render(<SearchBar onSearch={jest.fn()} />);

    expect(screen.getByPlaceholderText('Where are you going?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Guests')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sort')).toBeInTheDocument();
  });

  it('should render with default values', () => {
    render(<SearchBar onSearch={jest.fn()} />);

    const guestsInput = screen.getByPlaceholderText('Guests');
    expect(guestsInput).toHaveValue(1);

    const locationInput = screen.getByPlaceholderText('Where are you going?');
    expect(locationInput).toHaveValue('');
  });

  it('should render date picker button', () => {
    render(<SearchBar onSearch={jest.fn()} />);
    expect(screen.getByText(/check-in/i)).toBeInTheDocument();
  });
});

describe('SearchBar - User Interactions', () => {
  it('should update location input', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={jest.fn()} />);

    const locationInput = screen.getByPlaceholderText('Where are you going?');
    await user.type(locationInput, 'Pokhara');

    expect(locationInput).toHaveValue('Pokhara');
  });

  it('should update guests count', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={jest.fn()} />);

    const guestsInput = screen.getByPlaceholderText('Guests');
    await user.clear(guestsInput);
    await user.type(guestsInput, '5');

    expect(guestsInput).toHaveValue(5);
  });

  it('should update category selection', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={jest.fn()} />);

    const categorySelect = screen.getByDisplayValue('All Categories');
    await user.selectOptions(categorySelect, 'apartment');

    expect(categorySelect).toHaveValue('apartment');
  });

  it('should update sort selection', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={jest.fn()} />);

    const sortSelect = screen.getByDisplayValue('Sort');
    await user.selectOptions(sortSelect, 'low-high');

    expect(sortSelect).toHaveValue('low-high');
  });

  it('should not allow guests less than 1', () => {
    render(<SearchBar onSearch={jest.fn()} />);
    const guestsInput = screen.getByPlaceholderText('Guests');
    expect(guestsInput).toHaveAttribute('min', '1');
  });
});

describe('SearchBar - Form Submission', () => {
  it('should call onSearch with all values when search button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSearch = jest.fn();
    
    render(<SearchBar onSearch={mockOnSearch} />);

    const locationInput = screen.getByPlaceholderText('Where are you going?');
    await user.type(locationInput, 'Kathmandu');

    const guestsInput = screen.getByPlaceholderText('Guests');
    await user.clear(guestsInput);
    await user.type(guestsInput, '10');

    const categorySelect = screen.getByDisplayValue('All Categories');
    await user.selectOptions(categorySelect, 'room');

    const sortSelect = screen.getByDisplayValue('Sort');
    await user.selectOptions(sortSelect, 'newest');

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        location: 'Kathmandu',
        pax: 10,
        category: 'room',
        sortBy: 'newest',
      })
    );
  });

  it('should call onSearch with default values', async () => {
    const user = userEvent.setup();
    const mockOnSearch = jest.fn();
    
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        location: '',
        pax: 1,
        category: '',
        sortBy: '',
        checkIn: null,
        checkOut: null,
      })
    );
  });
});

describe('SearchBar - Google Places Integration', () => {
  beforeEach(() => {
    window.google = mockGoogle;
  });

  afterEach(() => {
    delete window.google;
  });

  it('should initialize Google Places Autocomplete', () => {
    render(<SearchBar onSearch={jest.fn()} />);
    expect(window.google.maps.places.Autocomplete).toHaveBeenCalled();
  });

  it('should restrict autocomplete to Nepal', () => {
    render(<SearchBar onSearch={jest.fn()} />);
    expect(window.google.maps.places.Autocomplete).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        componentRestrictions: { country: ['np'] },
      })
    );
  });

  it('should set type to cities', () => {
    render(<SearchBar onSearch={jest.fn()} />);
    expect(window.google.maps.places.Autocomplete).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        types: ['(cities)'],
      })
    );
  });
});

describe('SearchBar - Category Options', () => {
  it('should display all category options', () => {
    render(<SearchBar onSearch={jest.fn()} />);

    const categorySelect = screen.getByDisplayValue('All Categories');

    expect(categorySelect).toContainHTML('All Categories');
    expect(categorySelect).toContainHTML('Room');
    expect(categorySelect).toContainHTML('Apartment');
    expect(categorySelect).toContainHTML('House');
    expect(categorySelect).toContainHTML('Hostel');
  });

  it('should have correct option values', () => {
    const { container } = render(<SearchBar onSearch={jest.fn()} />);
    
    const options = container.querySelectorAll('select')[0].querySelectorAll('option');
    const values = Array.from(options).map(o => o.value);
    
    expect(values).toContain('');
    expect(values).toContain('room');
    expect(values).toContain('apartment');
    expect(values).toContain('house');
    expect(values).toContain('hostel');
  });
});

describe('SearchBar - Sort Options', () => {
  it('should display all sort options', () => {
    render(<SearchBar onSearch={jest.fn()} />);

    const sortSelect = screen.getByDisplayValue('Sort');

    expect(sortSelect).toContainHTML('Sort');
    expect(sortSelect).toContainHTML('Price: Low → High');
    expect(sortSelect).toContainHTML('Price: High → Low');
    expect(sortSelect).toContainHTML('Newest');
    expect(sortSelect).toContainHTML('Recommended');
  });

  it('should have correct sort option values', () => {
    const { container } = render(<SearchBar onSearch={jest.fn()} />);
    
    const sortSelect = container.querySelectorAll('select')[1];
    const options = sortSelect.querySelectorAll('option');
    const values = Array.from(options).map(o => o.value);
    
    expect(values).toContain('');
    expect(values).toContain('low-high');
    expect(values).toContain('high-low');
    expect(values).toContain('newest');
    expect(values).toContain('recommended');
  });
});

describe('SearchBar - Accessibility', () => {
  it('should have accessible search button', () => {
    render(<SearchBar onSearch={jest.fn()} />);
    const searchButton = screen.getByRole('button', { name: /search/i });
    expect(searchButton).toBeEnabled();
  });

  it('should have proper input types', () => {
    render(<SearchBar onSearch={jest.fn()} />);

    const locationInput = screen.getByPlaceholderText('Where are you going?');
    expect(locationInput).toHaveAttribute('type', 'text');

    const guestsInput = screen.getByPlaceholderText('Guests');
    expect(guestsInput).toHaveAttribute('type', 'number');
  });

  it('should have minimum value for guests', () => {
    render(<SearchBar onSearch={jest.fn()} />);
    const guestsInput = screen.getByPlaceholderText('Guests');
    expect(guestsInput).toHaveAttribute('min', '1');
  });
});

describe('SearchBar - Styling', () => {
  it('should have proper container styling', () => {
    const { container } = render(<SearchBar onSearch={jest.fn()} />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('bg-white', 'shadow', 'p-4', 'rounded-xl');
  });

  it('should have proper button styling', () => {
    render(<SearchBar onSearch={jest.fn()} />);
    const button = screen.getByRole('button', { name: /search/i });
    expect(button).toHaveClass('bg-blue-600', 'text-white');
  });
});
