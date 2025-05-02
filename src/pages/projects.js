import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import { db } from "@/firebase/firebase.config";
import { useAuth } from "@/contexts/AuthContext";
import { FiSearch, FiFilter, FiPlus, FiClock, FiDollarSign, FiTag } from "react-icons/fi";
import toast from "react-hot-toast";
import { FaSearch, FaFilter, FaPlus } from "react-icons/fa";
import Image from 'next/image';
import { collection, query, where, getDocs, orderBy, getDoc, doc } from "firebase/firestore";

export default function Projects() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, completed

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, filter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      let projectsQuery = collection(db, 'projects');

      // Apply filters
      if (filter === "active") {
        projectsQuery = query(projectsQuery, where('status', '==', 'in_progress'));
      } else if (filter === "completed") {
        projectsQuery = query(projectsQuery, where('status', '==', 'completed'));
      }

      const projectsSnapshot = await getDocs(projectsQuery);
      
      // Fetch related user data for each project
      const projectsData = await Promise.all(
        projectsSnapshot.docs.map(async (doc) => {
          const projectData = doc.data();
          
          // Fetch client data
          const clientDoc = await getDoc(doc(db, 'users', projectData.clientId));
          const clientData = clientDoc.exists() ? clientDoc.data() : null;
          
          // Fetch freelancer data if assigned
          let freelancerData = null;
          if (projectData.freelancerId) {
            const freelancerDoc = await getDoc(doc(db, 'users', projectData.freelancerId));
            freelancerData = freelancerDoc.exists() ? freelancerDoc.data() : null;
          }

          return {
            id: doc.id,
            ...projectData,
            client: clientData ? {
              id: clientData.uid,
              full_name: clientData.fullName,
              avatar_url: clientData.avatarUrl
            } : null,
            freelancer: freelancerData ? {
              id: freelancerData.uid,
              full_name: freelancerData.fullName,
              avatar_url: freelancerData.avatarUrl
            } : null
          };
        })
      );

      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Projects</h1>
          <Link 
            href="/projects/new" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiPlus className="mr-2" /> New Project
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search projects..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaFilter className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="all">All Projects</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Projects List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No projects found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    legacyBehavior
                  >
                    <a className="block hover:bg-gray-50 transition duration-150">
                      <div className="p-6 border rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-medium text-gray-900">{project.title}</h2>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              project.status
                            )}`}
                          >
                            {project.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-500 mb-4 line-clamp-2">{project.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <Image
                                src={project.image_url || '/images/default-project.png'}
                                alt={project.title}
                                width={300}
                                height={200}
                                className="rounded-lg object-cover"
                              />
                            </div>
                            <div className="flex items-center">
                              <Image
                                src={project.client.avatar_url || '/images/default-avatar.png'}
                                alt={project.client.name}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                              <span className="ml-2 text-sm text-gray-500">
                                {project.client?.full_name}
                              </span>
                            </div>
                            {project.freelancer && (
                              <div className="flex items-center">
                                <Image
                                  src={project.freelancer?.avatar_url || "/images/default-avatar.png"}
                                  alt={project.freelancer?.full_name}
                                  width={40}
                                  height={40}
                                  className="rounded-full"
                                />
                                <span className="ml-2 text-sm text-gray-500">
                                  {project.freelancer?.full_name}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 