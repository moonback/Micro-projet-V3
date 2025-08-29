import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Clock, CheckCircle, XCircle, AlertTriangle, Star, Euro, MapPin, Calendar, Tag, Zap, TrendingUp, ChevronRight, ListTodo, Filter, Search, MoreHorizontal, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { TaskWithProfiles } from '../types/task'
import Header from './Header'
import TaskCard from './TaskCard'

// Utility object for statuses to avoid repetition
const statusMap = {
  all: { label: 'Toutes', icon: ListTodo, color: 'from-gray-500 to-gray-600', gradient: 'from-gray-50 to-gray-100/50' },
  open: { label: 'Ouvertes', icon: Clock, color: 'from-blue-500 to-blue-600', gradient: 'from-blue-50 to-blue-100/50' },
  accepted: { label: 'Acceptées', icon: CheckCircle, color: 'from-green-500 to-green-600', gradient: 'from-green-50 to-green-100/50' },
  'in-progress': { label: 'En Cours', icon: TrendingUp, color: 'from-orange-500 to-orange-600', gradient: 'from-orange-50 to-orange-100/50' },
  completed: { label: 'Terminées', icon: Star, color: 'from-purple-500 to-purple-600', gradient: 'from-purple-50 to-purple-100/50' },
} as const;

interface MyTasksProps {
  onTaskPress: (task: TaskWithProfiles) => void
  onCreateTask: () => void
  onTaskAccepted?: (taskId: string) => void
  onBack: () => void
}

const statusOptions = Object.entries(statusMap).map(([value, { label, icon, color }]) => ({
  value,
  label,
  icon,
  color
}));

const StatusModal = ({ isOpen, onClose, onSelect, selectedStatus }: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (status: string) => void;
  selectedStatus: string;
}) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filtres de statut</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="space-y-2">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isActive = selectedStatus === option.value;
              const colorClass = statusMap[option.value as keyof typeof statusMap].color;
              return (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-2xl text-sm font-medium transition-all flex items-center space-x-3 ${
                    isActive
                      ? `bg-gradient-to-r ${colorClass} text-white shadow-lg`
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Skeleton Loader component for grid layout
const TaskCardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
    className="bg-gray-100 rounded-2xl p-4 shadow-sm border border-gray-200 animate-pulse h-full"
  >
    <div className="flex items-center space-x-3 mb-3">
      <div className="w-10 h-10 bg-gray-300 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-300 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="w-16 h-8 bg-gray-300 rounded-lg" />
    </div>
    <div className="h-10 bg-gray-200 rounded mb-3" />
    <div className="grid grid-cols-2 gap-2">
      <div className="h-8 bg-gray-200 rounded-lg" />
      <div className="h-8 bg-gray-200 rounded-lg" />
      <div className="h-8 bg-gray-200 rounded-lg" />
      <div className="h-8 bg-gray-200 rounded-lg" />
    </div>
  </motion.div>
);

export default function MyTasks({ onTaskPress, onCreateTask, onTaskAccepted, onBack }: MyTasksProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithProfiles[]>([]);
  const [activeTab, setActiveTab] = useState<'created' | 'accepted'>('created');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user, activeTab, selectedStatus]);

  const loadTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const query = supabase
        .from('tasks')
        .select(`*, author_profile:profiles!tasks_author_fkey (id, name, avatar_url, rating, rating_count)`);

      if (activeTab === 'created') {
        query.eq('author', user.id);
      } else {
        query.eq('helper', user.id);
      }
      
      if (selectedStatus !== 'all') {
        query.eq('status', selectedStatus);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskCount = (tab: 'created' | 'accepted') => {
    return tasks.filter(task => (tab === 'created' ? task.author === user?.id : task.helper === user?.id)).length;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const selectedStatusData = statusMap[selectedStatus as keyof typeof statusMap] || statusMap.all;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <Header
        title="Mes Tâches"
        subtitle="Gérez vos tâches créées et acceptées"
        showSearch={false}
        showFilters={false}
        showViewToggle={false}
        showRefresh={false}
        onBack={onBack}
        rightButtons={[
          {
            icon: Plus,
            onClick: onCreateTask,
            tooltip: 'Créer une nouvelle tâche'
          }
        ]}
        className="bg-white text-gray-900 shadow-sm border-b border-gray-200"
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="p-4 space-y-4"
      >
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher dans vos tâches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsStatusModalOpen(true)}
            className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors border border-blue-200 flex-shrink-0"
            title="Ouvrir les filtres de statut"
          >
            <Filter className="w-4 h-4" />
          </motion.button>
        </div>

        {selectedStatus !== 'all' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center space-x-2"
          >
            <span className="text-sm text-gray-600 font-medium">Filtre actif:</span>
            <div className="flex items-center px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-700">{selectedStatusData.label}</span>
              <button onClick={() => setSelectedStatus('all')} className="ml-2 p-0.5 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="px-4 pb-3"
      >
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-1.5 shadow-sm border border-gray-100">
          <div className="flex rounded-xl bg-gray-50/80 p-1 relative">
            <motion.div
              layoutId="activeTab"
              className="absolute inset-1 bg-white rounded-lg shadow-sm z-0"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('created')}
              className={`relative z-10 flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'created' ? 'text-blue-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-1.5">
                <ListTodo className="w-3.5 h-3.5" />
                <span className="font-semibold">Créées</span>
                <span className="text-xs opacity-75">({getTaskCount('created')})</span>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('accepted')}
              className={`relative z-10 flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'accepted' ? 'text-blue-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="font-semibold">Acceptées</span>
                <span className="text-xs opacity-75">({getTaskCount('accepted')})</span>
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <TaskCardSkeleton />
              <TaskCardSkeleton />
              <TaskCardSkeleton />
              <TaskCardSkeleton />
              <TaskCardSkeleton />
              <TaskCardSkeleton />
            </motion.div>
          ) : filteredTasks.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-64 text-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 shadow-lg"
              >
                <ListTodo className="w-14 h-14 text-gray-400" />
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900 mb-3"
              >
                {activeTab === 'created' ? 'Aucune tâche créée' : 'Aucune tâche acceptée'}
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-500 mb-8 max-w-sm text-lg leading-relaxed"
              >
                {activeTab === 'created' ? 'Vous n\'avez pas encore créé de tâches. Commencez par en créer une !' : 'Vous n\'avez pas encore accepté de tâches. Parcourez les tâches disponibles !'}
              </motion.p>
              {activeTab === 'created' && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCreateTask}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-10 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all text-lg"
                >
                  Créer ma première tâche
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="tasks" 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, type: 'spring', delay: index * 0.1 }}
                  className="h-full"
                >
                  <TaskCard
                    task={task}
                    onPress={onTaskPress}
                    onTaskAccepted={onTaskAccepted}
                    isDesktop={true}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onCreateTask}
          className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all flex items-center justify-center"
        >
          <Plus className="w-8 h-8" />
        </motion.button>
      </motion.div>

      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSelect={setSelectedStatus}
        selectedStatus={selectedStatus}
      />
    </div>
  );
}