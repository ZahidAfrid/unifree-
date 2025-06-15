import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FaHistory, 
  FaUser, 
  FaCalendarAlt, 
  FaClock, 
  FaStar,
  FaCheckCircle,
  FaMoneyBillWave,
  FaEye,
  FaUserCircle
} from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/firebase.config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  doc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import ReviewSystem from './ReviewSystem';
import { toast } from 'react-hot-toast';

const ProjectHistory = ({ userType }) => {
  const { user } = useAuth();
  const [completedProjects, setCompletedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectForReview, setSelectedProjectForReview] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (user?.uid && userType) {
      setupProjectListener();
    }

    return () => {
      if (unsubscribeRef.current) {
        console.log('🧹 Cleaning up project history listener');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.uid, userType]);

  const setupProjectListener = () => {
    if (!user?.uid || !userType) return;

    // Clean up existing listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    setLoading(true);

    try {
      if (userType === 'client') {
        // Set up real-time listener for completed projects
        const projectsQuery = query(
          collection(db, 'projects'),
          where('clientId', '==', user.uid),
          where('status', '==', 'completed'),
          orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(projectsQuery, async (snapshot) => {
          console.log('📨 Completed projects updated:', snapshot.size);
          const projectsData = [];

          for (const projectDoc of snapshot.docs) {
            const projectData = projectDoc.data();
            console.log('Processing client project:', projectDoc.id, projectData);
            
            // Get freelancer details from accepted proposals
            try {
              const proposalsQuery = query(
                collection(db, 'accepted_proposals'),
                where('projectId', '==', projectDoc.id),
                where('status', '==', 'completed')
              );
              
              const proposalsSnapshot = await getDocs(proposalsQuery);
              let freelancerData = null;
              
              if (!proposalsSnapshot.empty) {
                const proposalData = proposalsSnapshot.docs[0].data();
                console.log('Found proposal data for project:', proposalData);
                freelancerData = {
                  id: proposalData.freelancerId,
                  name: proposalData.freelancerName,
                  acceptedAt: proposalData.acceptedAt,
                  completedAt: proposalData.completedAt || projectData.updatedAt,
                  bid: proposalData.bid
                };
              }
              
              projectsData.push({
                id: projectDoc.id,
                ...projectData,
                freelancer: freelancerData
              });
            } catch (error) {
              console.error('Error fetching proposal for project:', projectDoc.id, error);
              // Still add the project even if we can't get freelancer data
              projectsData.push({
                id: projectDoc.id,
                ...projectData,
                freelancer: null
              });
            }
          }

          setCompletedProjects(projectsData);
          setLoading(false);
        }, (error) => {
          console.error('❌ Error in project history listener:', error);
          // Fallback to manual fetch
          fetchCompletedProjects();
        });

        unsubscribeRef.current = unsubscribe;
      } else {
        // For freelancers, use manual fetch since we need to query multiple collections
        fetchCompletedProjects();
      }
    } catch (error) {
      console.error('❌ Error setting up project listener:', error);
      fetchCompletedProjects();
    }
  };

  const fetchCompletedProjects = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      console.log('Fetching completed projects for user:', user.uid, 'userType:', userType);
      let projectsData = [];

      if (userType === 'client') {
        console.log('Fetching completed projects for client...');
        // Fetch completed projects for client
        const projectsQuery = query(
          collection(db, 'projects'),
          where('clientId', '==', user.uid),
          where('status', '==', 'completed'),
          orderBy('updatedAt', 'desc')
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        console.log('Found', projectsSnapshot.size, 'completed projects for client');
        
        for (const projectDoc of projectsSnapshot.docs) {
          const projectData = projectDoc.data();
          console.log('Processing client project:', projectDoc.id, projectData);
          
          // Get freelancer details from accepted proposals
          try {
            const proposalsQuery = query(
              collection(db, 'accepted_proposals'),
              where('projectId', '==', projectDoc.id),
              where('status', '==', 'completed')
            );
            
            const proposalsSnapshot = await getDocs(proposalsQuery);
            let freelancerData = null;
            
            if (!proposalsSnapshot.empty) {
              const proposalData = proposalsSnapshot.docs[0].data();
              console.log('Found proposal data for project:', proposalData);
              freelancerData = {
                id: proposalData.freelancerId,
                name: proposalData.freelancerName,
                acceptedAt: proposalData.acceptedAt,
                completedAt: proposalData.completedAt || projectData.updatedAt,
                bid: proposalData.bid
              };
            }
            
            projectsData.push({
              id: projectDoc.id,
              ...projectData,
              freelancer: freelancerData
            });
          } catch (error) {
            console.error('Error fetching proposal for project:', projectDoc.id, error);
            // Still add the project even if we can't get freelancer data
            projectsData.push({
              id: projectDoc.id,
              ...projectData,
              freelancer: null
            });
          }
        }
      } else {
        console.log('Fetching completed projects for freelancer...');
        // Fetch completed projects for freelancer
        const proposalsQuery = query(
          collection(db, 'accepted_proposals'),
          where('freelancerId', '==', user.uid),
          where('status', '==', 'completed'),
          orderBy('completedAt', 'desc')
        );
        
        const proposalsSnapshot = await getDocs(proposalsQuery);
        console.log('Found', proposalsSnapshot.size, 'completed proposals for freelancer');
        
        for (const proposalDoc of proposalsSnapshot.docs) {
          const proposalData = proposalDoc.data();
          console.log('Processing freelancer proposal:', proposalDoc.id, proposalData);
          
          // Get project details using doc() instead of query
          try {
            const projectDocRef = doc(db, 'projects', proposalData.projectId);
            const projectSnapshot = await getDoc(projectDocRef);
            
            if (projectSnapshot.exists()) {
              const projectData = projectSnapshot.data();
              console.log('Found project data:', projectData);
              
              projectsData.push({
                id: proposalData.projectId,
                ...projectData,
                proposal: {
                  acceptedAt: proposalData.acceptedAt,
                  completedAt: proposalData.completedAt,
                  bid: proposalData.bid
                }
              });
            } else {
              console.log('Project not found for ID:', proposalData.projectId);
            }
          } catch (error) {
            console.error('Error fetching project:', proposalData.projectId, error);
          }
        }
      }

      console.log('Final projects data:', projectsData);
      setCompletedProjects(projectsData);
    } catch (error) {
      console.error('Error fetching completed projects:', error);
      toast.error('Failed to load project history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
      } else if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
      return 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  };

  const calculateProjectDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'Unknown';
    
    try {
      const start = startDate.seconds ? new Date(startDate.seconds * 1000) : new Date(startDate);
      const end = endDate.seconds ? new Date(endDate.seconds * 1000) : new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days`;
    } catch (error) {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="ml-4 text-gray-600">Loading project history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <FaHistory className="mr-2 text-indigo-500" />
          Project History
        </h3>
        <span className="text-sm text-gray-500">
          {completedProjects.length} completed project{completedProjects.length !== 1 ? 's' : ''}
        </span>
      </div>

      {completedProjects.length === 0 ? (
        <div className="text-center py-12">
          <FaHistory className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Projects</h3>
          <p className="text-gray-500">You haven&apos;t completed any projects yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {completedProjects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-gradient-to-r from-white to-gray-50"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {project.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-3">
                    {project.description}
                  </p>
                  
                  {userType === 'client' && project.freelancer && (
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <FaUserCircle className="text-green-600" />
                        <span className="font-medium">Freelancer: {project.freelancer.name}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <FaCalendarAlt className="text-blue-500" />
                      <div>
                        <p className="text-gray-500">Started</p>
                        <p className="font-medium">
                          {userType === 'client' 
                            ? formatDate(project.freelancer?.acceptedAt)
                            : formatDate(project.proposal?.acceptedAt)
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <FaCheckCircle className="text-green-500" />
                      <div>
                        <p className="text-gray-500">Completed</p>
                        <p className="font-medium">
                          {userType === 'client'
                            ? formatDate(project.freelancer?.completedAt)
                            : formatDate(project.proposal?.completedAt)
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <FaClock className="text-orange-500" />
                      <div>
                        <p className="text-gray-500">Duration</p>
                        <p className="font-medium">
                          {userType === 'client'
                            ? calculateProjectDuration(project.freelancer?.acceptedAt, project.freelancer?.completedAt)
                            : calculateProjectDuration(project.proposal?.acceptedAt, project.proposal?.completedAt)
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <FaMoneyBillWave className="text-green-600" />
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p className="font-medium">
                          ${userType === 'client' ? project.freelancer?.bid : project.proposal?.bid}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                    <FaCheckCircle className="mr-1" />
                    Completed
                  </span>
                </div>
              </div>
              
              {userType === 'client' && project.freelancer && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedProjectForReview(project)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md"
                  >
                    <FaStar className="mr-2" />
                    Leave Review
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedProjectForReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Leave Review for {selectedProjectForReview.freelancer.name}
                </h3>
                <button
                  onClick={() => setSelectedProjectForReview(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-900">{selectedProjectForReview.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Completed on {formatDate(selectedProjectForReview.freelancer.completedAt)}
                </p>
              </div>
              
              <ReviewSystem
                projectId={selectedProjectForReview.id}
                targetUserId={selectedProjectForReview.freelancer.id}
                targetUserType="freelancer"
                onReviewSubmitted={(reviewData) => {
                  console.log('Review submitted:', reviewData);
                  toast.success('Thank you for your review!');
                  setSelectedProjectForReview(null);
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProjectHistory; 