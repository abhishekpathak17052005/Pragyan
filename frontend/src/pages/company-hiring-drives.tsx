import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Calendar } from 'lucide-react';

const hiringDrivesData = [
  { id: 1, title: 'Summer 2025 Campus Hiring', status: 'Active', startDate: '2025-05-01', endDate: '2025-07-31', targetHires: 50, applications: 120 },
  { id: 2, title: 'Winter 2024 Internship Drive', status: 'Completed', startDate: '2024-11-01', endDate: '2024-12-31', targetHires: 30, applications: 85 },
  { id: 3, title: 'Spring 2025 Lateral Hiring', status: 'Planning', startDate: '2025-03-01', endDate: '2025-05-31', targetHires: 25, applications: 0 },
  { id: 4, title: 'Q1 2025 Executive Search', status: 'Active', startDate: '2025-01-01', endDate: '2025-03-31', targetHires: 5, applications: 15 },
];

export default function CompanyHiringDrivesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDrives = hiringDrivesData.filter(drive =>
    drive.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hiring Drives</h1>
          <p className="text-muted-foreground mt-2">Create and manage hiring campaigns</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Create Drive
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search hiring drives..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
          <option>All Status</option>
          <option>Planning</option>
          <option>Active</option>
          <option>Completed</option>
        </select>
      </div>

      {/* Hiring Drives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDrives.map((drive) => (
          <div key={drive.id} className="border rounded-lg p-4 bg-card hover:shadow-lg transition">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{drive.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{drive.targetHires} target hires</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                drive.status === 'Active' ? 'bg-green-100 text-green-800' :
                drive.status === 'Planning' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {drive.status}
              </span>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{drive.startDate} to {drive.endDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Applications: <strong>{drive.applications}</strong></span>
                <span>Target: <strong>{drive.targetHires}</strong></span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${Math.min((drive.applications / drive.targetHires) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm">
                View Details
              </button>
              <button className="p-2 hover:bg-muted rounded">
                <Edit2 className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-muted rounded">
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
