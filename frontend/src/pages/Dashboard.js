import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, LogOut, CheckCircle2, Circle, Clock, Trash2, Edit, Filter, TrendingUp, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const priorityColors = {
  Low: 'bg-green-100 text-green-800 border-green-300',
  Medium: 'bg-orange-100 text-orange-800 border-orange-300',
  High: 'bg-red-100 text-red-800 border-red-300'
};

const statusConfig = {
  todo: { label: 'To Do', icon: Circle, color: 'text-gray-500' },
  'in-progress': { label: 'In Progress', icon: Clock, color: 'text-blue-500' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-500' }
};

export default function Dashboard({ user, onLogout, token }) {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dailyQuote, setDailyQuote] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [analyticsView, setAnalyticsView] = useState('weekly');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    due_date: '',
    status: 'todo'
  });

  useEffect(() => {
    fetchTasks();
    fetchCategories();
    fetchDailyQuote();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
      if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, category: response.data[0].name }));
      }
    } catch (error) {
      toast.error('Failed to fetch categories');
    }
  };

  const fetchDailyQuote = async () => {
    try {
      const response = await axios.get(`${API}/daily-quote`);
      setDailyQuote(response.data);
    } catch (error) {
      console.error('Failed to fetch daily quote');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tasks`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Task created successfully!');
      setIsAddDialogOpen(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/tasks/${selectedTask.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Task updated successfully!');
      setIsEditDialogOpen(false);
      setSelectedTask(null);
      resetForm();
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Task deleted successfully!');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await axios.put(`${API}/tasks/${task.id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
      toast.success(`Task marked as ${newStatus === 'completed' ? 'completed' : 'incomplete'}`);
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const openEditDialog = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      due_date: task.due_date || '',
      status: task.status
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: categories[0]?.name || '',
      priority: 'Medium',
      due_date: '',
      status: 'todo'
    });
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterCategory !== 'all' && task.category !== filterCategory) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  // Analytics calculations
  const getDateRange = (view) => {
    const now = new Date();
    const ranges = {
      weekly: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      monthly: new Date(now.getFullYear(), now.getMonth(), 1),
      yearly: new Date(now.getFullYear(), 0, 1)
    };
    return ranges[view];
  };

  const getAnalyticsData = () => {
    const startDate = getDateRange(analyticsView);
    const filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      return taskDate >= startDate;
    });

    // Completion rate data
    const completionData = [
      { name: 'Completed', value: filteredTasks.filter(t => t.status === 'completed').length, color: '#10B981' },
      { name: 'In Progress', value: filteredTasks.filter(t => t.status === 'in-progress').length, color: '#3B82F6' },
      { name: 'To Do', value: filteredTasks.filter(t => t.status === 'todo').length, color: '#6B7280' }
    ];

    // Category distribution
    const categoryData = categories.map(cat => ({
      name: cat.name,
      value: filteredTasks.filter(t => t.category === cat.name).length,
      color: cat.color
    })).filter(c => c.value > 0);

    // Priority distribution
    const priorityData = [
      { name: 'High', value: filteredTasks.filter(t => t.priority === 'High').length, color: '#EF4444' },
      { name: 'Medium', value: filteredTasks.filter(t => t.priority === 'Medium').length, color: '#F97316' },
      { name: 'Low', value: filteredTasks.filter(t => t.priority === 'Low').length, color: '#10B981' }
    ].filter(p => p.value > 0);

    // Trend data
    const getTrendData = () => {
      const now = new Date();
      const data = [];
      
      if (analyticsView === 'weekly') {
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dayTasks = tasks.filter(t => {
            const taskDate = new Date(t.created_at);
            return taskDate.toDateString() === date.toDateString();
          });
          data.push({
            name: date.toLocaleDateString('en-US', { weekday: 'short' }),
            completed: dayTasks.filter(t => t.status === 'completed').length,
            created: dayTasks.length
          });
        }
      } else if (analyticsView === 'monthly') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const weeks = Math.ceil(daysInMonth / 7);
        for (let i = 0; i < weeks; i++) {
          const weekStart = new Date(now.getFullYear(), now.getMonth(), i * 7 + 1);
          const weekEnd = new Date(now.getFullYear(), now.getMonth(), Math.min((i + 1) * 7, daysInMonth));
          const weekTasks = tasks.filter(t => {
            const taskDate = new Date(t.created_at);
            return taskDate >= weekStart && taskDate <= weekEnd;
          });
          data.push({
            name: `Week ${i + 1}`,
            completed: weekTasks.filter(t => t.status === 'completed').length,
            created: weekTasks.length
          });
        }
      } else {
        for (let i = 0; i < 12; i++) {
          const monthTasks = tasks.filter(t => {
            const taskDate = new Date(t.created_at);
            return taskDate.getMonth() === i && taskDate.getFullYear() === now.getFullYear();
          });
          data.push({
            name: new Date(now.getFullYear(), i).toLocaleDateString('en-US', { month: 'short' }),
            completed: monthTasks.filter(t => t.status === 'completed').length,
            created: monthTasks.length
          });
        }
      }
      return data;
    };

    const completionRate = filteredTasks.length > 0 
      ? Math.round((filteredTasks.filter(t => t.status === 'completed').length / filteredTasks.length) * 100)
      : 0;

    return {
      completionData: completionData.filter(d => d.value > 0),
      categoryData,
      priorityData,
      trendData: getTrendData(),
      completionRate,
      totalTasks: filteredTasks.length
    };
  };

  const analytics = getAnalyticsData();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            TaskMaster
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium" data-testid="user-name">Hi, {user?.name}</span>
            <Button variant="outline" size="sm" onClick={onLogout} data-testid="logout-button">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Daily Quote Section */}
        {dailyQuote && (
          <Card className="overflow-hidden border-2" style={{ borderColor: '#8B5CF6' }} data-testid="daily-quote-card">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 relative">
                <img
                  src={dailyQuote.image_url}
                  alt={dailyQuote.character}
                  className="w-full h-full object-cover"
                  style={{ minHeight: '200px', maxHeight: '300px' }}
                />
              </div>
              <div className="md:w-2/3 p-6 flex flex-col justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <h3 className="text-sm font-semibold text-white/90 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>TODAY'S MOTIVATION</h3>
                <p className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="daily-quote-text">
                  "{dailyQuote.quote}"
                </p>
                <p className="text-lg text-white/90 font-medium" data-testid="daily-quote-character">- {dailyQuote.character}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="stat-total">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color: '#8B5CF6' }}>{taskStats.total}</div>
            </CardContent>
          </Card>
          <Card data-testid="stat-todo">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">To Do</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-700">{taskStats.todo}</div>
            </CardContent>
          </Card>
          <Card data-testid="stat-inprogress">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{taskStats.inProgress}</div>
            </CardContent>
          </Card>
          <Card data-testid="stat-completed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{taskStats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Add Button */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Search tasks..."
              className="w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-input"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40" data-testid="filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40" data-testid="filter-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-40" data-testid="filter-priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} data-testid="add-task-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="add-task-dialog">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Add a new task to your list</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    data-testid="task-title-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    data-testid="task-description-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                      <SelectTrigger data-testid="task-category-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                      <SelectTrigger data-testid="task-priority-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    data-testid="task-duedate-input"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" data-testid="create-task-button" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>Create Task</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tasks List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map(task => {
            const StatusIcon = statusConfig[task.status].icon;
            return (
              <Card key={task.id} className="hover:shadow-lg transition-shadow" data-testid={`task-card-${task.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {task.title}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" style={{ borderColor: categories.find(c => c.name === task.category)?.color }}>
                          {task.category}
                        </Badge>
                      </div>
                    </div>
                    <StatusIcon className={`w-5 h-5 ${statusConfig[task.status].color}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {task.description && (
                    <p className="text-sm text-gray-600">{task.description}</p>
                  )}
                  {task.due_date && (
                    <p className="text-xs text-gray-500">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(task)}
                      data-testid={`toggle-status-${task.id}`}
                      className="flex-1"
                    >
                      {task.status === 'completed' ? 'Mark Incomplete' : 'Complete'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(task)}
                      data-testid={`edit-task-${task.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTask(task.id)}
                      data-testid={`delete-task-${task.id}`}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredTasks.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No tasks found. Create your first task to get started!</p>
          </Card>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent data-testid="edit-task-dialog">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                data-testid="edit-task-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                data-testid="edit-task-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger data-testid="edit-task-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                  <SelectTrigger data-testid="edit-task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                <SelectTrigger data-testid="edit-task-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-due_date">Due Date</Label>
              <Input
                id="edit-due_date"
                type="date"
                data-testid="edit-task-duedate"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="submit" data-testid="update-task-button" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>Update Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
