import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  Building,
  BarChart3,
  Settings,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Check,
  X,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  Search,
  UserCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const AdminUsersTab = () => {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    adminAPI.getUsers().then(res => {
      setUsersList(res.data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const filteredUsers = usersList.filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.full_name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchCity = u.city?.toLowerCase().includes(q);
      const matchBusiness = u.business_name?.toLowerCase().includes(q);
      return matchName || matchEmail || matchCity || matchBusiness;
    }
    return true;
  });

  if (loading) return <div className="p-8 text-center text-slate-500">Loading registered users...</div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">All Registered Users ({filteredUsers.length})</h2>
          <p className="text-xs text-slate-500">View and search system-wide user directory.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter Pills */}
          <div className="bg-slate-100 p-0.5 rounded-lg flex text-xs font-semibold">
            {['ALL', 'CUSTOMER', 'OWNER', 'ADMIN'].map((rf) => (
              <button
                key={rf}
                onClick={() => setRoleFilter(rf)}
                className={`px-3 py-1 rounded-md transition ${
                  roleFilter === rf ? 'bg-slate-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {rf === 'ALL' ? 'All Roles' : rf.charAt(0) + rf.slice(1).toLowerCase() + 's'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-60"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
            <tr>
              <th className="px-6 py-4">User Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">City / Details</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{u.full_name}</div>
                  {u.business_name && <div className="text-[11px] text-blue-600 font-semibold">{u.business_name}</div>}
                </td>
                <td className="px-6 py-4 text-slate-700 font-mono text-xs">{u.email}</td>
                <td className="px-6 py-4 text-slate-700">{u.phone || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                    u.role === 'OWNER' ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600 text-xs">
                  {u.city || 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    u.role === 'OWNER' && !u.is_approved ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {u.role === 'OWNER' && !u.is_approved ? 'Pending Approval' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">No matching users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminApprovedOwnersTab = () => {
  const [ownersList, setOwnersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    adminAPI.getUsers({ role: 'OWNER' }).then(res => {
      // Filter for approved owners
      const approved = (res.data || []).filter(u => u.is_approved === true);
      setOwnersList(approved);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const filteredOwners = ownersList.filter(o => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = o.full_name?.toLowerCase().includes(q);
      const matchEmail = o.email?.toLowerCase().includes(q);
      const matchCity = o.city?.toLowerCase().includes(q);
      const matchBusiness = o.business_name?.toLowerCase().includes(q);
      return matchName || matchEmail || matchCity || matchBusiness;
    }
    return true;
  });

  if (loading) return <div className="p-8 text-center text-slate-500">Loading approved turf owners...</div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Approved Turf Owners ({filteredOwners.length})</h2>
          <p className="text-xs text-slate-500">Verified facility owners operating on PlaySport.</p>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search business, owner, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 w-48 sm:w-60"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
            <tr>
              <th className="px-6 py-4">Business Name</th>
              <th className="px-6 py-4">Owner Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">City</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Registered Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOwners.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-bold text-slate-900">{o.business_name || 'Sports Arena'}</td>
                <td className="px-6 py-4 font-semibold text-slate-800">{o.full_name}</td>
                <td className="px-6 py-4 text-slate-700 font-mono text-xs">{o.email}</td>
                <td className="px-6 py-4 text-slate-700">{o.phone || '-'}</td>
                <td className="px-6 py-4 font-medium text-slate-900">📍 {o.city || 'Kerala'}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                    <Check className="w-3 h-3" /> Approved
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs">
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {filteredOwners.length === 0 && (
              <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">No approved turf owners found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminFacilitiesTab = ({ setActionSuccess }) => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFacilities = async () => {
    try {
      const res = await adminAPI.getFacilities();
      setFacilities(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleTerminate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to terminate turf: ${name}?`)) return;
    try {
      await adminAPI.terminateFacility(id);
      setActionSuccess(`Terminated ${name}`);
      fetchFacilities();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading facilities...</div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
          <tr>
            <th className="px-6 py-4">Facility</th>
            <th className="px-6 py-4">Owner</th>
            <th className="px-6 py-4">Total Bookings</th>
            <th className="px-6 py-4">Total Revenue</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {facilities.map((turf) => (
            <tr key={turf.id} className="hover:bg-slate-50/50">
              <td className="px-6 py-4">
                <div className="font-bold text-slate-900">{turf.name}</div>
                <div className="text-[11px] text-slate-500">{turf.city}</div>
              </td>
              <td className="px-6 py-4 text-slate-700">{turf.owner_name}</td>
              <td className="px-6 py-4 font-semibold text-slate-900">{turf.total_bookings}</td>
              <td className="px-6 py-4 font-bold text-emerald-600">₹{turf.total_revenue.toLocaleString()}</td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => handleTerminate(turf.id, turf.name)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded-lg transition"
                >
                  Terminate
                </button>
              </td>
            </tr>
          ))}
          {facilities.length === 0 && (
            <tr>
              <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No facilities found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const AdminBookingsTab = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getBookings().then(res => {
      setBookings(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading bookings...</div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="p-5 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Global Bookings</h2>
        <p className="text-xs text-slate-500">Recent bookings across all turfs.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
            <tr>
              <th className="px-6 py-4">Reference</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Facility</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">{b.reference}</td>
                <td className="px-6 py-4 text-slate-700">{b.customer_name}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">{b.turf_name}</td>
                <td className="px-6 py-4 text-slate-600">
                  <div className="font-medium text-slate-900">{b.date}</div>
                  <div className="text-[11px]">{b.time}</div>
                </td>
                <td className="px-6 py-4 font-bold text-emerald-600">₹{b.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                    b.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No bookings found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminSchedulesTab = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getSchedules().then(res => {
      setSlots(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading schedules...</div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="p-5 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Platform Schedule</h2>
        <p className="text-xs text-slate-500">Upcoming time slots across all facilities.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
            <tr>
              <th className="px-6 py-4">Facility</th>
              <th className="px-6 py-4">Ground</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slots.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-bold text-slate-900">{s.turf_name}</td>
                <td className="px-6 py-4 text-slate-700">{s.ground_name}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{s.date}</td>
                <td className="px-6 py-4 text-slate-700">{s.time}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">₹{s.price.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    s.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                    s.status === 'BOOKED' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
            {slots.length === 0 && (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No schedules found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AdminAnalyticsTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnalytics().then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bookings / Turfs by City Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 mb-6">Turf & Regional Distribution by City</h2>
          <div className="h-72 w-full flex items-center justify-center">
            {data?.bookings_by_city?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.bookings_by_city}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.bookings_by_city.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No regional data registered yet.</div>
            )}
          </div>
        </div>

        {/* Revenue by Turf Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 mb-6">Top Revenue Generating Turfs</h2>
          <div className="h-72 w-full flex items-center justify-center">
            {data?.revenue_by_turf?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenue_by_turf} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {data.revenue_by_turf.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No revenue data available yet.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    total_users: 0,
    approved_owners: 0,
    pending_approvals: 0,
    total_revenue_display: '₹0',
    user_growth_pct: 'Real-time count',
    owner_regions_count: 0,
    revenue_growth_pct: 'Real-time tracking',
  });
  const [chartPeriod, setChartPeriod] = useState('monthly');
  const [chartData, setChartData] = useState([]);
  const [pendingOwners, setPendingOwners] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [actionSuccess, setActionSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const fetchAdminData = async () => {
    try {
      const [metRes, chartRes, ownersRes, usersRes] = await Promise.all([
        adminAPI.getMetrics(),
        adminAPI.getRevenueChart(chartPeriod),
        adminAPI.getPendingOwners(),
        adminAPI.getUsers({ role: 'CUSTOMER' })
      ]);
      setMetrics(metRes.data);
      setChartData(chartRes.data.data || []);
      setPendingOwners(ownersRes.data);
      setCustomers(usersRes.data || []);
    } catch (err) {
      console.error("Failed to load admin dashboard", err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [chartPeriod]);

  const handleApprove = async (id, name) => {
    try {
      await adminAPI.approveOwner(id);
      setActionSuccess(`Approved ${name}`);
      fetchAdminData();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error("Approval error", err);
    }
  };

  const handleReject = async (id, name) => {
    try {
      await adminAPI.rejectOwner(id);
      setActionSuccess(`Rejected ${name}`);
      fetchAdminData();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error("Rejection error", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      
      {/* Left Sidebar Matching Stitch Screenshot 4 */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between py-6 px-4 shrink-0">
        <div className="space-y-6">
          {/* Admin Profile Top */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              AA
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Admin Panel</h3>
              <p className="text-[11px] text-slate-400">Facility Management</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50/80 text-blue-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'users' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-slate-400" />
              Total Users
            </button>

            <button
              onClick={() => setActiveTab('approved_owners')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'approved_owners' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-4 h-4 text-slate-400" />
              Approved Owners
            </button>

            <button
              onClick={() => setActiveTab('schedules')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'schedules' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              Schedules
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'bookings' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              Bookings
            </button>

            <button
              onClick={() => setActiveTab('facilities')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'facilities' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building className="w-4 h-4 text-slate-400" />
              Facilities
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'analytics' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-slate-400" />
              Analytics
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="space-y-1 text-slate-500 text-xs">
            <a href="#settings" className="flex items-center gap-2.5 px-3 py-1.5 hover:text-slate-900 transition">
              <Settings className="w-4 h-4" />
              Settings
            </a>
            <a href="#support" className="flex items-center gap-2.5 px-3 py-1.5 hover:text-slate-900 transition">
              <HelpCircle className="w-4 h-4" />
              Support
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 max-w-7xl">
        
        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {activeTab === 'dashboard' && 'Dashboard Overview'}
            {activeTab === 'users' && 'User Directory'}
            {activeTab === 'approved_owners' && 'Approved Turf Owners'}
            {activeTab === 'schedules' && 'Schedules Manager'}
            {activeTab === 'bookings' && 'Global Bookings'}
            {activeTab === 'facilities' && 'Facility Management'}
            {activeTab === 'analytics' && 'System Analytics'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">System-wide view of all activities, users, and metrics.</p>
        </div>

        {actionSuccess && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-brand-200 text-xs font-bold text-brand-800 flex items-center gap-2 fade-in">
            <Check className="w-4 h-4 text-brand-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {activeTab === 'dashboard' ? (
          <>
            {/* 4 KPI Metric Cards (Clickable) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              
              {/* Card 1: Total Users (Clickable -> 'users') */}
              <div 
                onClick={() => setActiveTab('users')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition">Total Users</span>
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900">{metrics.total_users?.toLocaleString()}</p>
                  <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 mt-1">
                    Click to view names & list →
                  </span>
                </div>
              </div>

              {/* Card 2: Approved Owners (Clickable -> 'approved_owners') */}
              <div 
                onClick={() => setActiveTab('approved_owners')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition cursor-pointer space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 group-hover:text-teal-600 transition">Approved Owners</span>
                  <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900">{metrics.approved_owners}</p>
                  <span className="text-[11px] font-semibold text-teal-600 flex items-center gap-1 mt-1">
                    Click to view owner list →
                  </span>
                </div>
              </div>

              {/* Card 3: Pending Approvals (Red Border Accent) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 border-l-4 border-l-rose-500 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Pending Approvals</span>
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900">{metrics.pending_approvals}</p>
                  <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" /> Requires attention
                  </span>
                </div>
              </div>

              {/* Card 4: Total Revenue (Clickable -> 'analytics') */}
              <div 
                onClick={() => setActiveTab('analytics')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition cursor-pointer space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-600 transition">Total Revenue</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-brand-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900">{metrics.total_revenue_display}</p>
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" /> {metrics.revenue_growth_pct}
                  </span>
                </div>
              </div>

            </div>

            {/* Content Grid: Revenue Overview Chart & Pending Approvals List Matching Stitch */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Revenue Chart Section (8 cols) */}
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-bold text-slate-900">Revenue Overview</h2>
                  
                  {/* Monthly / Weekly Pill Toggle */}
                  <div className="bg-slate-100 p-0.5 rounded-lg flex text-xs font-semibold">
                    <button
                      onClick={() => setChartPeriod('monthly')}
                      className={`px-3 py-1 rounded-md transition ${
                        chartPeriod === 'monthly' ? 'bg-slate-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setChartPeriod('weekly')}
                      className={`px-3 py-1 rounded-md transition ${
                        chartPeriod === 'weekly' ? 'bg-slate-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Weekly
                    </button>
                  </div>
                </div>

                {/* Recharts Area Chart Matching Green Gradient in Screenshot 4 */}
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fontSize: 11, fill: '#64748b' }} 
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#64748b' }} 
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickFormatter={(val) => `₹${val}`}
                      />
                      <Tooltip 
                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#16a34a"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        dot={{ stroke: '#16a34a', strokeWidth: 2, r: 4, fill: '#ffffff' }}
                        activeDot={{ r: 6, fill: '#16a34a' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pending Owner Approvals (4 cols) Matching Stitch Screenshot 4 */}
              <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-900">Pending Owner Approvals</h2>
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center">
                      {pendingOwners.length}
                    </span>
                  </div>

                  <div className="space-y-4 divide-y divide-slate-100">
                    {pendingOwners.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No pending owner approvals.</p>
                    ) : pendingOwners.map((owner) => (
                      <div key={owner.id} className="pt-3 first:pt-0 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{owner.business_name}</h4>
                            <p className="text-[11px] text-slate-500">{owner.owner_name}</p>
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                              📍 {owner.city}
                            </span>
                          </div>

                          {/* Action Buttons: Approve (Green) & Reject (Outline) */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleApprove(owner.id, owner.business_name)}
                              className="px-2.5 py-1 bg-brand-700 hover:bg-brand-800 text-white text-[11px] font-bold rounded-md shadow-2xs transition flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(owner.id, owner.business_name)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-semibold rounded-md transition flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => alert("Showing all owner applications.")}
                  className="w-full mt-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition text-center"
                >
                  View All Requests
                </button>
              </div>

            </div>

            {/* Customers List Section */}
            <div className="mt-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">Recent Registered Customers</h2>
                <button onClick={() => setActiveTab('users')} className="text-xs font-bold text-blue-600 hover:underline">
                  View Full User Directory →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Joined On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.slice(0, 10).map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-900">{c.full_name}</td>
                        <td className="px-6 py-4 text-slate-700">{c.email}</td>
                        <td className="px-6 py-4 text-slate-700">{c.phone || '-'}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No customers found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : activeTab === 'users' ? (
          <AdminUsersTab />
        ) : activeTab === 'approved_owners' ? (
          <AdminApprovedOwnersTab />
        ) : activeTab === 'facilities' ? (
          <AdminFacilitiesTab setActionSuccess={setActionSuccess} />
        ) : activeTab === 'bookings' ? (
          <AdminBookingsTab />
        ) : activeTab === 'schedules' ? (
          <AdminSchedulesTab />
        ) : activeTab === 'analytics' ? (
          <AdminAnalyticsTab />
        ) : (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-2xs text-center text-slate-500">
            <h3 className="text-sm font-bold text-slate-900 mb-1">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
            <p className="text-xs">This section is currently under development.</p>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboardPage;
