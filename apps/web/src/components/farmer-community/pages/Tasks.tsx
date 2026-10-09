'use client';

import React, { useState } from 'react';
import { DataTable } from '../DataTable';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CheckSquare, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  User, 
  MapPin, 
  Plus, 
  Bell, 
  Filter 
} from 'lucide-react';

export function Tasks() {
  const [activeTab, setActiveTab] = useState('tasks');

  const tasksData = [
    {
      id: 'T001',
      title: 'Irrigate Field A Zone 1',
      description: 'Morning drip irrigation cycle for OBA Super 9 maize crop',
      type: 'irrigation',
      priority: 'high',
      status: 'pending',
      assignee: 'Babatunde Adeleke',
      location: 'Ibadan Farm - Zone 1',
      dueDate: '2024-08-09 06:00',
      estimatedTime: '45 min',
      progress: 0
    },
    {
      id: 'T002',
      title: 'Livestock Health & Tick Dip',
      description: 'Weekly health inspection and dipping for Bunaji cattle herd',
      type: 'livestock',
      priority: 'medium',
      status: 'in-progress',
      assignee: 'Fatima Mohammed',
      location: 'Barn A (Kano)',
      dueDate: '2024-08-09 10:00',
      estimatedTime: '2 hours',
      progress: 60
    },
    {
      id: 'T003',
      title: 'Soil pH & NPK Testing',
      description: 'Test soil pH levels after compost and lime application',
      type: 'testing',
      priority: 'low',
      status: 'completed',
      assignee: 'Chinedu Okeke',
      location: 'Benue Outpost - Plot 2',
      dueDate: '2024-08-08 14:00',
      estimatedTime: '30 min',
      progress: 100
    },
    {
      id: 'T004',
      title: 'Tractor 50h Maintenance',
      description: 'Service John Deere hydraulic fluid and grease points',
      type: 'maintenance',
      priority: 'high',
      status: 'overdue',
      assignee: 'Ibrahim Danladi',
      location: 'Central Machinery Yard',
      dueDate: '2024-08-07 16:00',
      estimatedTime: '3 hours',
      progress: 0
    },
    {
      id: 'T005',
      title: 'Cassava Stem Multiplication Audit',
      description: 'Weekly vegetative assessment and stem maturity photos',
      type: 'monitoring',
      priority: 'medium',
      status: 'pending',
      assignee: 'Amina Bello',
      location: 'Oyo Valley - Sector 3',
      dueDate: '2024-08-10 09:00',
      estimatedTime: '1 hour',
      progress: 0
    }
  ];

  const alertsData = [
    {
      id: 'A001',
      title: 'Critical Water Level',
      message: 'Water tank reservoir B is below 20% capacity in Ibadan',
      type: 'critical',
      location: 'Borehole Tank B',
      timestamp: '2024-08-09 14:25',
      status: 'active',
      acknowledged: false
    },
    {
      id: 'A002',
      title: 'High Temperature Alert',
      message: 'Greenhouse 2 internal ambient temperature exceeded 35°C',
      type: 'warning',
      location: 'Greenhouse 2 (Ogun)',
      timestamp: '2024-08-09 13:45',
      status: 'active',
      acknowledged: true
    },
    {
      id: 'A003',
      title: 'Telemetry Node Offline',
      message: 'Soil moisture sensor SEN003 has stopped transmitting packets',
      type: 'warning',
      location: 'Field A - Zone 2',
      timestamp: '2024-08-09 12:30',
      status: 'resolved',
      acknowledged: true
    },
    {
      id: 'A004',
      title: 'Automated Irrigation Cycle Queued',
      message: 'Automated solar pump scheduled to start in 15 minutes',
      type: 'info',
      location: 'Benue Field C',
      timestamp: '2024-08-09 05:45',
      status: 'active',
      acknowledged: false
    }
  ];

  const taskColumns = [
    {
      key: 'id',
      label: 'Task ID',
      sortable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-semibold text-xs text-gray-900">{value}</div>
          <Badge className={`text-xs mt-1 ${
            row.priority === 'high' ? 'bg-red-100 text-red-800' :
            row.priority === 'medium' ? 'bg-harvest-100 text-harvest-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {row.priority}
          </Badge>
        </div>
      )
    },
    {
      key: 'title',
      label: 'Task Details',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-semibold text-xs text-gray-900">{value}</div>
          <div className="text-gray-500 text-xs mt-0.5">{row.description}</div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Category',
      sortable: true,
      filterable: true,
      render: (value: string) => {
        const colors = {
          irrigation: 'bg-blue-100 text-blue-800',
          livestock: 'bg-leaf-100 text-leaf-800',
          testing: 'bg-purple-100 text-purple-800',
          maintenance: 'bg-harvest-100 text-harvest-800',
          monitoring: 'bg-node-100 text-node-800'
        };
        return <Badge className={`text-xs capitalize ${colors[value as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>{value}</Badge>;
      }
    },
    {
      key: 'assignee',
      label: 'Worker Assigned',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <User className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-800 font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'location',
      label: 'Field Location',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-600">{value}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-600">{new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )
    },
    {
      key: 'progress',
      label: 'Execution',
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-100 rounded-full h-2">
            <div 
              className="bg-leaf-700 h-2 rounded-full" 
              style={{ width: `${value}%` }}
            ></div>
          </div>
          <span className="text-xs font-medium text-gray-700">{value}%</span>
        </div>
      )
    }
  ];

  const alertColumns = [
    {
      key: 'title',
      label: 'Alert Title',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-semibold text-xs text-gray-900">{value}</div>
          <div className="text-gray-500 text-xs mt-0.5">{row.message}</div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Severity',
      sortable: true,
      filterable: true,
      render: (value: string) => {
        const colors = {
          critical: 'bg-red-100 text-red-800 font-semibold',
          warning: 'bg-harvest-100 text-harvest-800',
          info: 'bg-blue-100 text-blue-800'
        };
        return <Badge className={`text-xs uppercase ${colors[value as keyof typeof colors]}`}>{value}</Badge>;
      }
    },
    {
      key: 'location',
      label: 'Sensor / Asset',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-600">{value}</span>
        </div>
      )
    },
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-500">{new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Resolution Status',
      sortable: true,
      filterable: true
    },
    {
      key: 'acknowledged',
      label: 'Ack',
      render: (value: boolean) => value ? 
        <CheckSquare className="h-4 w-4 text-leaf-700" /> : 
        <Bell className="h-4 w-4 text-harvest-600" />
    }
  ];

  const taskStats = {
    total: tasksData.length,
    pending: tasksData.filter(t => t.status === 'pending').length,
    inProgress: tasksData.filter(t => t.status === 'in-progress').length,
    completed: tasksData.filter(t => t.status === 'completed').length,
    overdue: tasksData.filter(t => t.status === 'overdue').length
  };

  const alertStats = {
    total: alertsData.length,
    critical: alertsData.filter(a => a.type === 'critical').length,
    warning: alertsData.filter(a => a.type === 'warning').length,
    unacknowledged: alertsData.filter(a => !a.acknowledged).length
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-serif">Field Tasks & Operational Alerts</h1>
          <p className="text-sm text-gray-600">Assign agronomist work orders, track equipment shifts and acknowledge automated IoT alerts</p>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="text-xs">
            <Plus className="h-4 w-4 mr-1 text-leaf-700" />
            Add Task
          </Button>
          <Button size="sm" className="bg-leaf-800 hover:bg-leaf-900 text-white text-xs shadow-sm">
            <Bell className="h-4 w-4 mr-1" />
            Dispatch Alert
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Active Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
              <p className="text-xs text-blue-600 font-medium">{taskStats.pending} pending</p>
            </div>
            <CheckSquare className="h-8 w-8 text-leaf-700" />
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">In Progress</p>
              <p className="text-2xl font-bold text-harvest-600">{taskStats.inProgress}</p>
              <p className="text-xs text-harvest-600 font-medium">Being executed</p>
            </div>
            <Clock className="h-8 w-8 text-harvest-600" />
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
              <p className="text-xs text-red-600 font-medium">Requires supervisor</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Active Alerts</p>
              <p className="text-2xl font-bold text-harvest-600">{alertStats.total}</p>
              <p className="text-xs text-harvest-600 font-medium">{alertStats.unacknowledged} unread</p>
            </div>
            <Bell className="h-8 w-8 text-harvest-600" />
          </div>
        </Card>
      </div>

      {/* Critical Alerts */}
      {alertStats.critical > 0 && (
        <div className="space-y-2">
          {alertsData.filter(alert => alert.type === 'critical').map(alert => (
            <Alert key={alert.id} className="border-red-200 bg-red-50/80">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-xs text-red-800">
                <div className="flex justify-between items-center">
                  <div>
                    <strong>{alert.title}</strong> - {alert.message}
                    <div className="text-gray-600 mt-1">{alert.location} • {new Date(alert.timestamp).toLocaleString()}</div>
                  </div>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-7">
                    Acknowledge
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks" className="text-xs">Tasks & Work Orders</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">Hardware & IoT Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <DataTable
            data={tasksData}
            columns={taskColumns}
            title="Operational Field Schedule"
            searchPlaceholder="Search task name or worker..."
            onAdd={() => console.log('Add task')}
            onEdit={(task) => console.log('Edit task:', task)}
            onDelete={(task) => console.log('Delete task:', task)}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <DataTable
            data={alertsData}
            columns={alertColumns}
            title="Sensor Telemetry Alerts"
            searchPlaceholder="Search alerts..."
            onAdd={() => console.log('Add alert')}
            onEdit={(alert) => console.log('Edit alert:', alert)}
            onDelete={(alert) => console.log('Delete alert:', alert)}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Today's Priority Queue</h3>
          <div className="space-y-2">
            {tasksData.slice(0, 3).map(task => (
              <div key={task.id} className="flex justify-between items-center text-xs p-2.5 bg-gray-50/80 rounded border border-gray-100">
                <div>
                  <div className="font-semibold text-gray-900">{task.title}</div>
                  <div className="text-gray-500 mt-0.5">{task.location}</div>
                </div>
                <Badge className={`text-xs ${
                  task.status === 'completed' ? 'bg-leaf-100 text-leaf-800' :
                  task.status === 'in-progress' ? 'bg-harvest-100 text-harvest-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {task.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Operations by Type</h3>
          <div className="space-y-2">
            {['irrigation', 'livestock', 'maintenance', 'monitoring', 'testing'].map(type => {
              const count = tasksData.filter(t => t.type === type).length;
              return (
                <div key={type} className="flex justify-between items-center text-xs py-1 border-b border-gray-50">
                  <span className="capitalize text-gray-700">{type}</span>
                  <Badge variant="secondary" className="font-mono">{count}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Team Allocation</h3>
          <div className="space-y-2">
            {['Babatunde Adeleke', 'Fatima Mohammed', 'Chinedu Okeke', 'Ibrahim Danladi', 'Amina Bello'].map(person => {
              const assignedTasks = tasksData.filter(t => t.assignee === person && t.status !== 'completed').length;
              return (
                <div key={person} className="flex justify-between items-center text-xs py-1 border-b border-gray-50">
                  <span className="text-gray-800 font-medium">{person}</span>
                  <Badge variant="secondary" className="text-xs">{assignedTasks} active</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
