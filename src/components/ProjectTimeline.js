import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle, 
  FaComments,
  FaFileAlt,
  FaCalendarAlt,
  FaUser,
  FaUserTie
} from 'react-icons/fa';
import { formatDate } from '@/utils/dateUtils';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/firebase.config';
import { sendTimelineUpdateNotification } from '@/utils/notifications';

const ProjectTimeline = ({ projectId, userRole, projectData }) => {
  const [timeline, setTimeline] = useState([]);
  const [newUpdate, setNewUpdate] = useState('');
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);

  // Sample timeline data - in real app, this would come from database
  const sampleTimeline = [
    {
      id: 1,
      type: 'project_created',
      title: 'Project Created',
      description: 'Project was posted by client',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      user: 'Client',
      userType: 'client',
      status: 'completed'
    },
    {
      id: 2,
      type: 'proposal_submitted',
      title: 'Proposal Submitted',
      description: 'Freelancer submitted a proposal',
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      user: 'Freelancer',
      userType: 'freelancer',
      status: 'completed'
    },
    {
      id: 3,
      type: 'proposal_accepted',
      title: 'Proposal Accepted',
      description: 'Client accepted the proposal and project started',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      user: 'Client',
      userType: 'client',
      status: 'completed'
    },
    {
      id: 4,
      type: 'milestone_completed',
      title: 'First Milestone Completed',
      description: 'Initial design mockups delivered',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      user: 'Freelancer',
      userType: 'freelancer',
      status: 'completed'
    },
    {
      id: 5,
      type: 'feedback_provided',
      title: 'Client Feedback',
      description: 'Client provided feedback on the initial designs',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      user: 'Client',
      userType: 'client',
      status: 'completed'
    },
    {
      id: 6,
      type: 'in_progress',
      title: 'Revisions in Progress',
      description: 'Working on client feedback and implementing changes',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      user: 'Freelancer',
      userType: 'freelancer',
      status: 'in_progress'
    },
    {
      id: 7,
      type: 'pending',
      title: 'Final Delivery',
      description: 'Final project delivery and client review',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      user: 'Freelancer',
      userType: 'freelancer',
      status: 'pending'
    }
  ];

  useEffect(() => {
    setTimeline(sampleTimeline);
  }, [projectId]);

  const getStatusIcon = (status, type) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'in_progress':
        return <FaClock className="text-blue-500" />;
      case 'pending':
        return <FaExclamationTriangle className="text-yellow-500" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'project_created':
        return <FaFileAlt className="text-indigo-500" />;
      case 'proposal_submitted':
      case 'proposal_accepted':
        return <FaFileAlt className="text-green-500" />;
      case 'milestone_completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'feedback_provided':
        return <FaComments className="text-blue-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getUserIcon = (userType) => {
    return userType === 'client' ? 
      <FaUserTie className="text-blue-600" /> : 
      <FaUser className="text-green-600" />;
  };

  const addUpdate = async () => {
    if (!newUpdate.trim()) return;

    const update = {
      id: Date.now(),
      type: 'update',
      title: `${userRole === 'freelancer' ? 'Freelancer' : 'Client'} Update`,
      description: newUpdate,
      date: new Date(),
      user: userRole,
      icon: userRole === 'freelancer' ? 'freelancer' : 'client'
    };

    setTimeline([...timeline, update]);
    setNewUpdate('');
    setIsAddingUpdate(false);

    // Send notification to the other party
    try {
      if (projectData) {
        const recipientId = userRole === 'freelancer' ? projectData.clientId : projectData.freelancerId;
        const recipientType = userRole === 'freelancer' ? 'client' : 'freelancer';
        const senderName = userRole === 'freelancer' 
          ? (projectData.freelancerName || 'Freelancer')
          : (projectData.clientName || 'Client');
        const projectTitle = projectData.projectTitle || projectData.title || 'Your Project';

        await sendTimelineUpdateNotification(
          projectId,
          projectTitle,
          recipientId,
          recipientType,
          newUpdate,
          senderName
        );

        toast.success('Update added and notification sent!');
      } else {
        // If projectData is not available, try to fetch project participants
        const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore');
        
        if (userRole === 'freelancer') {
          // Find client from accepted proposals
          const proposalsQuery = query(
            collection(db, 'accepted_proposals'),
            where('projectId', '==', projectId)
          );
          const proposalsSnapshot = await getDocs(proposalsQuery);
          
          if (!proposalsSnapshot.empty) {
            const proposalData = proposalsSnapshot.docs[0].data();
            await sendTimelineUpdateNotification(
              projectId,
              proposalData.projectTitle || 'Your Project',
              proposalData.clientId,
              'client',
              newUpdate,
              'Freelancer'
            );
          }
        } else {
          // Find freelancer from accepted proposals
          const proposalsQuery = query(
            collection(db, 'accepted_proposals'),
            where('projectId', '==', projectId)
          );
          const proposalsSnapshot = await getDocs(proposalsQuery);
          
          if (!proposalsSnapshot.empty) {
            const proposalData = proposalsSnapshot.docs[0].data();
            await sendTimelineUpdateNotification(
              projectId,
              proposalData.projectTitle || 'Your Project',
              proposalData.freelancerId,
              'freelancer',
              newUpdate,
              'Client'
            );
          }
        }
        
        toast.success('Update added and notification sent!');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.success('Update added successfully!');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <FaCalendarAlt className="mr-2 text-indigo-500" />
          Project Timeline
        </h3>
        <button
          onClick={() => setIsAddingUpdate(!isAddingUpdate)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Add Update
        </button>
      </div>

      {/* Add Update Form */}
      {isAddingUpdate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
        >
          <textarea
            value={newUpdate}
            onChange={(e) => setNewUpdate(e.target.value)}
            placeholder="Add a project update..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            rows="3"
          />
          <div className="flex justify-end space-x-2 mt-3">
            <button
              onClick={() => setIsAddingUpdate(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addUpdate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Update
            </button>
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        {timeline.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start space-x-4"
          >
            {/* Timeline Line */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-gray-200 shadow-sm">
                {getStatusIcon(item.status, item.type)}
              </div>
              {index < timeline.length - 1 && (
                <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(item.type)}
                  <h4 className="text-sm font-semibold text-gray-900">
                    {item.title}
                  </h4>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  {getUserIcon(item.userType)}
                  <span>{item.user}</span>
                  <span>•</span>
                  <span>{item.date.toLocaleDateString()}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              
              {/* Status Badge */}
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  item.status === 'completed' ? 'bg-green-100 text-green-800' :
                  item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Project Progress */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Project Progress</span>
          <span className="text-sm font-medium text-gray-900">
            {Math.round((timeline.filter(item => item.status === 'completed').length / timeline.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(timeline.filter(item => item.status === 'completed').length / timeline.length) * 100}%` 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTimeline; 