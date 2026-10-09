'use client';

import React, { useState } from 'react';
import { DataTable } from '../DataTable';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { 
  CheckSquare, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  User, 
  MapPin, 
  Plus, 
  Bell, 
  Filter,
  CheckCircle,
  Trash2,
  Check
} from 'lucide-react';

const INITIAL_TASKS = [
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

const INITIAL_ALERTS = [
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

export function Tasks() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modals
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isDispatchAlertOpen, setIsDispatchAlertOpen] = useState(false);

  // Task Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    type: 'irrigation',
    priority: 'high',
    assignee: 'Babatunde Adeleke',
    location: 'Ibadan Farm - Zone 1',
    dueDate: new Date().toISOString().slice(0, 16),
    estimatedTime: '1 hour'
  });

  // Alert Form State
  const [alertForm, setAlertForm] = useState({
    title: '',
    message: '',
    type: 'warning',
    location: 'Field A - Zone 1 (Ibadan)'
  });

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAcknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, acknowledged: true, type: 'warning' };
      }
      return a;
    }));
    showFeedback('Critical alert acknowledged. Supervisor notified.');
  };

  const handleToggleTaskStatus = (task: any) => {
    setTasks(prev => prev.map(t => {
      if (t.id === task.id) {
        const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
        const nextProgress = nextStatus === 'completed' ? 100 : 0;
        showFeedback(`Task "${t.title}" marked as ${nextStatus}.`);
        return { ...t, status: nextStatus, progress: nextProgress };
      }
      return t;
    }));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    showFeedback('Task removed from schedule.');
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    showFeedback('Alert dismissed.');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) return;
    const newTask = {
      id: `T${String(tasks.length + 1).padStart(3, '0')}`,
      title: taskForm.title,
      description: taskForm.description || 'Assigned field operation',
      type: taskForm.type,
      priority: taskForm.priority,
      status: 'pending',
      assignee: taskForm.assignee,
      location: taskForm.location,
      dueDate: taskForm.dueDate.replace('T', ' '),
      estimatedTime: taskForm.estimatedTime,
      progress: 0
    };
    setTasks([newTask, ...tasks]);
    setIsAddTaskOpen(false);
    setTaskForm({
      title: '',
      description: '',
      type: 'irrigation',
      priority: 'high',
      assignee: 'Babatunde Adeleke',
      location: 'Ibadan Farm - Zone 1',
      dueDate: new Date().toISOString().slice(0, 16),
      estimatedTime: '1 hour'
    });
    showFeedback(`Field task "${newTask.title}" assigned to ${newTask.assignee}.`);
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertForm.title) return;
    const newAlert = {
      id: `A${String(alerts.length + 1).padStart(3, '0')}`,
      title: alertForm.title,
      message: alertForm.message || 'Operational alert broadcasted',
      type: alertForm.type,
      location: alertForm.location,
      timestamp: new Date().toISOString(),
      status: 'active',
      acknowledged: false
    };
    setAlerts([newAlert, ...alerts]);
    setIsDispatchAlertOpen(false);
    setAlertForm({
      title: '',
      message: '',
      type: 'warning',
      location: 'Field A - Zone 1 (Ibadan)'
    });
    showFeedback(`Alert "${newAlert.title}" dispatched across farm channels.`);
  };

  const taskColumns = [
    {
      key: 'id',
      label: 'Task ID',
      sortable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-semibold text-xs text-gray-900">{value}</div>
          <div className="text-gray-500 text-xs">{row.title}</div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Category',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <Badge variant="secondary" className="capitalize text-xs font-medium">
          {value}
        </Badge>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      filterable: true,
      render: (value: string) => {
        const colors = {
          high: 'bg-red-100 text-red-800 border-red-200',
          medium: 'bg-harvest-100 text-harvest-800 border-amber-200',
          low: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return (
          <Badge className={`text-xs capitalize font-medium ${colors[value as keyof typeof colors]}`}>
            {value}
          </Badge>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value: string) => {
        const colors = {
          completed: 'bg-leaf-100 text-leaf-800 border-leaf-200',
          'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
          pending: 'bg-harvest-100 text-harvest-800 border-harvest-200',
          overdue: 'bg-red-100 text-red-800 border-red-200'
        };
        return (
          <Badge className={`text-xs capitalize font-medium ${colors[value as keyof typeof colors]}`}>
            {value.replace('-', ' ')}
          </Badge>
        );
      }
    },
    {
      key: 'assignee',
      label: 'Assigned Worker',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1.5">
          <User className="h-3 w-3 text-leaf-700" />
          <span className="text-xs font-medium text-gray-800">{value}</span>
        </div>
      )
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-600">{value}</span>
        </div>
      )
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-600">{new Date(value).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (value: number) => (
        <div className="w-20">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">{value}%</span>
          </div>
          <Progress value={value} className="h-1.5 bg-gray-100" />
        </div>
      )
    }
  ];

  const alertColumns = [
    {
      key: 'id',
      label: 'Alert ID',
      sortable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-semibold text-xs text-gray-900">{value}</div>
          <div className="text-gray-500 text-xs">{row.title}</div>
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
          critical: 'bg-red-100 text-red-800 border-red-200',
          warning: 'bg-harvest-100 text-harvest-800 border-amber-200',
          info: 'bg-blue-100 text-blue-800 border-blue-200'
        };
        return (
          <Badge className={`text-xs capitalize font-medium ${colors[value as keyof typeof colors]}`}>
            {value}
          </Badge>
        );
      }
    },
    {
      key: 'message',
      label: 'Description',
      render: (value: string) => (
        <span className="text-xs text-gray-700">{value}</span>
      )
    },
    {
      key: 'location',
      label: 'Origin Node',
      sortable: true,
      filterable: true,
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
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status === 'overdue').length
  };

  const alertStats = {
    total: alerts.length,
    critical: alerts.filter(a => a.type === 'critical' && !a.acknowledged).length,
    warning: alerts.filter(a => a.type === 'warning').length,
    unacknowledged: alerts.filter(a => !a.acknowledged).length
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
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs"
            onClick={() => setIsAddTaskOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1 text-leaf-700" />
            Add Task
          </Button>
          <Button 
            size="sm" 
            className="bg-leaf-800 hover:bg-leaf-900 text-white text-xs shadow-sm"
            onClick={() => setIsDispatchAlertOpen(true)}
          >
            <Bell className="h-4 w-4 mr-1" />
            Dispatch Alert
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert className="border-leaf-300 bg-leaf-50 text-leaf-900">
          <CheckCircle className="h-4 w-4 text-leaf-700" />
          <AlertDescription className="text-xs font-medium">
            {feedback}
          </AlertDescription>
        </Alert>
      )}

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
              <p className="text-xs text-harvest-600 font-medium">{alertStats.unacknowledged} unacknowledged</p>
            </div>
            <Bell className="h-8 w-8 text-harvest-600" />
          </div>
        </Card>
      </div>

      {/* Critical Alerts */}
      {alertStats.critical > 0 && (
        <div className="space-y-2">
          {alerts.filter(alert => alert.type === 'critical' && !alert.acknowledged).map(alert => (
            <Alert key={alert.id} className="border-red-200 bg-red-50/80">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-xs text-red-800">
                <div className="flex justify-between items-center">
                  <div>
                    <strong>{alert.title}</strong> - {alert.message}
                    <div className="text-gray-600 mt-1">{alert.location} • {new Date(alert.timestamp).toLocaleString()}</div>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-red-600 hover:bg-red-700 text-white text-xs h-7"
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                  >
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
          <TabsTrigger value="tasks" className="text-xs">Tasks & Work Orders ({tasks.length})</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">Hardware & IoT Alerts ({alerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <DataTable
            data={tasks}
            columns={taskColumns}
            title="Operational Field Schedule"
            searchPlaceholder="Search task name or worker..."
            onAdd={() => setIsAddTaskOpen(true)}
            onEdit={(task) => handleToggleTaskStatus(task)}
            onDelete={(task) => handleDeleteTask(task.id)}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <DataTable
            data={alerts}
            columns={alertColumns}
            title="Sensor Telemetry Alerts"
            searchPlaceholder="Search alerts..."
            onAdd={() => setIsDispatchAlertOpen(true)}
            onEdit={(alert) => handleAcknowledgeAlert(alert.id)}
            onDelete={(alert) => handleDeleteAlert(alert.id)}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Today's Priority Queue</h3>
          <div className="space-y-2">
            {tasks.slice(0, 3).map(task => (
              <div key={task.id} className="flex justify-between items-center text-xs p-2.5 bg-gray-50/80 rounded border border-gray-100">
                <div>
                  <div className="font-semibold text-gray-900">{task.title}</div>
                  <div className="text-gray-500 mt-0.5">{task.location}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`text-xs ${
                    task.status === 'completed' ? 'bg-leaf-100 text-leaf-800' :
                    task.status === 'in-progress' ? 'bg-harvest-100 text-harvest-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {task.status}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-6 w-6 p-0"
                    onClick={() => handleToggleTaskStatus(task)}
                    title="Toggle Task Completion"
                  >
                    <Check className="h-3 w-3 text-leaf-700" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Operations by Type</h3>
          <div className="space-y-2">
            {['irrigation', 'livestock', 'maintenance', 'monitoring', 'testing'].map(type => {
              const count = tasks.filter(t => t.type === type).length;
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
              const assignedTasks = tasks.filter(t => t.assignee === person && t.status !== 'completed').length;
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

      {/* Add Task Modal */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateTask}>
            <DialogHeader>
              <DialogTitle>Create Field Task</DialogTitle>
              <DialogDescription>
                Assign operational work order to farm managers, operators or field technicians.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-gray-700">Task Title</label>
                <Input
                  required
                  placeholder="e.g. Ridge Plot B for Maize planting"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Description / Instructions</label>
                <Input
                  placeholder="e.g. Inspect soil moisture before activating tractor"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Category</label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 mt-1"
                    value={taskForm.type}
                    onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                  >
                    <option value="irrigation">Irrigation</option>
                    <option value="livestock">Livestock</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="testing">Testing / Soil</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Priority</label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 mt-1"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Assigned Team Member</label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 mt-1"
                    value={taskForm.assignee}
                    onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                  >
                    <option value="Babatunde Adeleke">Babatunde Adeleke</option>
                    <option value="Fatima Mohammed">Fatima Mohammed</option>
                    <option value="Chinedu Okeke">Chinedu Okeke</option>
                    <option value="Ibrahim Danladi">Ibrahim Danladi</option>
                    <option value="Amina Bello">Amina Bello</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Field Location</label>
                  <Input
                    value={taskForm.location}
                    onChange={(e) => setTaskForm({ ...taskForm, location: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddTaskOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-leaf-800 hover:bg-leaf-900 text-white">
                Assign Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dispatch Alert Modal */}
      <Dialog open={isDispatchAlertOpen} onOpenChange={setIsDispatchAlertOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateAlert}>
            <DialogHeader>
              <DialogTitle>Dispatch Operational Alert</DialogTitle>
              <DialogDescription>
                Broadcast hardware, weather or microclimate warnings across estate communication channels.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-gray-700">Alert Title</label>
                <Input
                  required
                  placeholder="e.g. Diesel Generator Fuel Below Threshold"
                  value={alertForm.title}
                  onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Alert Message</label>
                <Input
                  placeholder="Detailed warning message for duty operators"
                  value={alertForm.message}
                  onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Severity</label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 mt-1"
                    value={alertForm.type}
                    onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}
                  >
                    <option value="critical">Critical Warning</option>
                    <option value="warning">Important Caution</option>
                    <option value="info">General Advisory</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Zone / Hub</label>
                  <Input
                    value={alertForm.location}
                    onChange={(e) => setAlertForm({ ...alertForm, location: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDispatchAlertOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-leaf-800 hover:bg-leaf-900 text-white">
                Dispatch Alert
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
