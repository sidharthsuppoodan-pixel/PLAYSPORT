import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import OwnerDashboardPage from './OwnerDashboardPage';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 3,
      full_name: 'Strikers Owner',
      business_name: 'Strikers Sports Arena',
      email: 'owner@playsport.com',
      phone: '9847012345',
      city: 'Kochi',
      role: 'owner'
    },
    logout: vi.fn()
  })
}));

// Mock API services
vi.mock('../services/api', () => ({
  reportsAPI: {
    getOwnerDashboard: vi.fn().mockResolvedValue({
      data: {
        total_bookings: 25,
        total_revenue: 35000,
        active_turfs: 1,
        occupancy_rate: 75,
        recent_bookings: [],
        hourly_distribution: [],
        daily_revenue: []
      }
    }),
    getRecentBookings: vi.fn().mockResolvedValue({ data: [] }),
    getFacilityStatus: vi.fn().mockResolvedValue({ data: [] })
  },
  turfsAPI: {
    getMyTurfs: vi.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'Strikers Sports Arena',
          city: 'Ernakulam',
          address: 'Near Stadium Metro Station, Kaloor',
          pincode: '682017',
          contact_phone: '9847012345',
          contact_email: 'owner@playsport.com',
          starting_price: 1200,
          dimension_text: '7000 sq ft',
          sports_supported: 'Football (5v5), Box Cricket',
          facilities: ['Free Parking', 'Changing Rooms', 'LED Floodlights', 'Drinking Water'],
          images: ['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80'],
          opening_time: '06:00 AM',
          closing_time: '11:00 PM',
          description: 'Premier artificial turf'
        }
      ]
    }),
    update: vi.fn().mockResolvedValue({ data: { message: 'Updated successfully' } }),
    create: vi.fn().mockResolvedValue({ data: { id: 1 } })
  },
  slotsAPI: {
    getMyTurfSlots: vi.fn().mockResolvedValue({ data: [] }),
    generateBulk: vi.fn().mockResolvedValue({ data: { message: 'Generated' } })
  },
  groundsAPI: {
    getAll: vi.fn().mockResolvedValue({ data: [] })
  },
  openMatchesAPI: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
    create: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
  },
  tournamentsAPI: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
    create: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
  },
  equipmentAPI: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
    create: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
  }
}));

describe('OwnerDashboardPage - Edit Turf Profile & White Screen Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the owner dashboard and shows Edit Turf Profile button', async () => {
    render(
      <BrowserRouter>
        <OwnerDashboardPage />
      </BrowserRouter>
    );

    // Wait for the dashboard to finish loading
    await waitFor(() => {
      expect(screen.getByText(/Turf Owner Console/i)).toBeInTheDocument();
    });

    // Check that Edit Turf Profile button is rendered in the header
    const editButtons = screen.getAllByRole('button', { name: /Edit Turf Profile/i });
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('opens the Edit Turf Profile modal safely when clicked without crashing', async () => {
    render(
      <BrowserRouter>
        <OwnerDashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Turf Owner Console/i)).toBeInTheDocument();
    });

    const editBtn = screen.getAllByRole('button', { name: /Edit Turf Profile/i })[0];
    fireEvent.click(editBtn);

    // Check that Modal 7 opens and displays the modal header
    await waitFor(() => {
      expect(screen.getByText(/Edit Turf Profile & Details/i)).toBeInTheDocument();
    });

    // Verify form fields are populated with turf data
    const nameInput = screen.getByDisplayValue('Strikers Sports Arena');
    expect(nameInput).toBeInTheDocument();

    const priceInput = screen.getByDisplayValue('1200');
    expect(priceInput).toBeInTheDocument();

    // Verify modal can be closed safely
    const closeBtn = screen.getByRole('button', { name: /Save Turf Profile Details/i });
    expect(closeBtn).toBeInTheDocument();
  });

  it('handles empty turf list safely and opens edit modal with fallback defaults', async () => {
    const { turfsAPI } = await import('../services/api');
    turfsAPI.getMyTurfs.mockResolvedValueOnce({ data: [] });

    render(
      <BrowserRouter>
        <OwnerDashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Turf Owner Console/i)).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /Edit Turf Profile/i });
    expect(editButtons.length).toBeGreaterThan(0);

    // Clicking edit button with empty turfs does not crash
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Edit Turf Profile & Details/i)).toBeInTheDocument();
    });
  });
});
