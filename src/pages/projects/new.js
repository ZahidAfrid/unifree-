import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase.config";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaBriefcase,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaClock,
  FaFileUpload,
  FaTag,
  FaGlobe,
} from "react-icons/fa";

export default function NewProject() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    budgetType: "fixed", // fixed or hourly
    duration: "",
    skills: [],
    projectType: "",
    complexity: "medium",
    visibility: "public",
  });

  const skillOptions = [
    "JavaScript",
    "React",
    "Angular",
    "Vue.js",
    "Node.js",
    "Python",
    "Django",
    "Flask",
    "Ruby on Rails",
    "PHP",
    "Laravel",
    "WordPress",
    "HTML",
    "CSS",
    "Tailwind CSS",
    "Bootstrap",
    "UI Design",
    "UX Design",
    "Graphic Design",
    "Mobile Development",
    "iOS",
    "Android",
    "React Native",
    "Flutter",
    "DevOps",
    "AWS",
    "Azure",
    "Google Cloud",
    "Docker",
    "Kubernetes",
    "Database Design",
    "SQL",
    "NoSQL",
    "MongoDB",
    "Firebase",
    "Data Analysis",
    "Machine Learning",
    "AI",
    "Content Writing",
    "Copywriting",
    "Technical Writing",
    "Digital Marketing",
    "SEO",
    "Social Media Marketing",
    "Video Editing",
    "Animation",
    "3D Modeling",
  ];

  const projectTypes = [
    "Web Development",
    "Mobile App",
    "UI/UX Design",
    "Digital Marketing",
    "Content Creation",
    "Graphic Design",
    "Video Production",
    "Data Analysis",
    "Software Development",
    "Consulting",
    "Other",
  ];

  const durations = [
    "Less than 1 week",
    "1-2 weeks",
    "2-4 weeks",
    "1-3 months",
    "3-6 months",
    "6+ months",
  ];

  const complexityOptions = [
    { value: "low", label: "Low - Simple tasks, minimal expertise required" },
    { value: "medium", label: "Medium - Average complexity, some expertise needed" },
    { value: "high", label: "High - Complex project, expert-level skills required" },
  ];

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    fetchClientProfile();
  }, [user, router]);

  const fetchClientProfile = async () => {
    try {
      setLoading(true);
      const clientProfileDoc = await getDoc(doc(db, "client_registration", user.uid));

      if (clientProfileDoc.exists()) {
        setProfileData(clientProfileDoc.data());
      } else {
        // If no client profile found, redirect to registration
        toast.error("Please complete your client profile first");
        router.push("/client-registration");
        return;
      }
    } catch (error) {
      console.error("Error fetching client profile:", error);
      toast.error("Failed to load client profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSkillChange = (skill) => {
    setFormData((prev) => {
      const currentSkills = [...prev.skills];
      if (currentSkills.includes(skill)) {
        return { ...prev, skills: currentSkills.filter((s) => s !== skill) };
      } else {
        return { ...prev, skills: [...currentSkills, skill] };
      }
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // In a production environment, you would upload these files to a storage solution
    // For this example, we'll just store the file objects
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    // Basic validation
    if (!formData.title || !formData.description || !formData.skills.length) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      // Create project in Firestore
      const projectData = {
        ...formData,
        clientId: user.uid,
        clientName: profileData?.companyName || "Anonymous",
        status: "open",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // In a real implementation, you would upload attachments to storage
        // and store their references/URLs here
        attachments: attachments.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        }))
      };

      const projectRef = await addDoc(collection(db, "projects"), projectData);

      toast.success("Project posted successfully!");
      router.push(`/projects/${projectRef.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(error.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-lg rounded-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8">
            <div className="flex items-center">
              <button
                onClick={() => router.push("/client-dashboard")}
                className="mr-4 text-white hover:text-blue-200"
              >
                <FaArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Post a New Project</h1>
                <p className="text-blue-100 mt-1">
                  Find the perfect freelancer for your project
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Project Basics */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Project Basics
                </h3>

                <div className="space-y-6">
                  {/* Project Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Project Title *
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaBriefcase className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="E.g., 'Website Redesign for E-commerce Store'"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Project Type */}
                  <div>
                    <label htmlFor="projectType" className="block text-sm font-medium text-gray-700">
                      Project Type *
                    </label>
                    <div className="mt-1">
                      <select
                        id="projectType"
                        name="projectType"
                        required
                        value={formData.projectType}
                        onChange={handleChange}
                        className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select project type</option>
                        {projectTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Project Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Project Description *
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        name="description"
                        rows={6}
                        required
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Provide a detailed description of your project including goals, requirements, and expectations..."
                        className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Be specific about your needs to attract the right freelancers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills and Expertise */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Skills and Expertise
                </h3>

                <div className="space-y-6">
                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills Required *
                    </label>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {formData.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleSkillChange(skill)}
                            className="ml-1.5 inline-flex text-blue-500 hover:text-blue-600 focus:outline-none"
                          >
                            <span className="sr-only">Remove</span>
                            <svg
                              className="h-4 w-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="mt-2">
                      <select
                        id="skills-select"
                        className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleSkillChange(e.target.value);
                            e.target.value = "";
                          }
                        }}
                      >
                        <option value="">Select skills</option>
                        {skillOptions
                          .filter((skill) => !formData.skills.includes(skill))
                          .map((skill) => (
                            <option key={skill} value={skill}>
                              {skill}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Complexity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Complexity
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {complexityOptions.map((option) => (
                        <div
                          key={option.value}
                          className={`relative rounded-lg border ${
                            formData.complexity === option.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300"
                          } p-4 cursor-pointer hover:border-blue-400`}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, complexity: option.value }))
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name="complexity"
                                value={option.value}
                                checked={formData.complexity === option.value}
                                onChange={() =>
                                  setFormData((prev) => ({ ...prev, complexity: option.value }))
                                }
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <label
                                htmlFor={`complexity-${option.value}`}
                                className="ml-3 block text-sm font-medium text-gray-700"
                              >
                                {option.value.charAt(0).toUpperCase() + option.value.slice(1)}
                              </label>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-gray-500">{option.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget and Timeline */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Budget and Timeline
                </h3>

                <div className="space-y-6">
                  {/* Budget */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget Type
                    </label>
                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        <input
                          id="budget-fixed"
                          name="budgetType"
                          type="radio"
                          value="fixed"
                          checked={formData.budgetType === "fixed"}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label
                          htmlFor="budget-fixed"
                          className="ml-2 block text-sm font-medium text-gray-700"
                        >
                          Fixed Price
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="budget-hourly"
                          name="budgetType"
                          type="radio"
                          value="hourly"
                          checked={formData.budgetType === "hourly"}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label
                          htmlFor="budget-hourly"
                          className="ml-2 block text-sm font-medium text-gray-700"
                        >
                          Hourly Rate
                        </label>
                      </div>
                    </div>

                    <div className="mt-3 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaMoneyBillWave className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="budget"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        placeholder={
                          formData.budgetType === "fixed"
                            ? "E.g., 500"
                            : "E.g., 25"
                        }
                        className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">
                          {formData.budgetType === "fixed" ? "USD" : "USD/hr"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                      Expected Duration
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="duration"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select expected duration</option>
                        {durations.map((duration) => (
                          <option key={duration} value={duration}>
                            {duration}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Project Attachments
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaFileUpload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, Word, Excel, Images (MAX. 10MB)
                        </p>
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Attachment List */}
                  {attachments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files</h4>
                      <ul className="divide-y divide-gray-200">
                        {attachments.map((file, index) => (
                          <li key={index} className="py-3 flex items-center justify-between">
                            <div className="flex items-center">
                              <FaFileUpload className="h-5 w-5 text-gray-400 mr-3" />
                              <span className="text-sm font-medium text-gray-900 mr-2">
                                {file.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(2)} KB
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg
                                className="h-5 w-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div className="bg-gradient-to-r from-blue-50 to-white rounded-lg shadow border border-blue-100">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2 flex items-center">
                  <FaGlobe className="mr-2 text-blue-600" />
                  Project Visibility
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  Choose who can see your project. Public projects will be displayed in the Explore page for all freelancers to find and submit proposals.
                </p>

                <div className="space-y-4">
                  <div className="relative rounded-lg border-2 border-blue-200 bg-white p-4 hover:border-blue-400 transition-all cursor-pointer">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="visibility-public"
                          name="visibility"
                          type="radio"
                          value="public"
                          checked={formData.visibility === "public"}
                          onChange={handleChange}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                      </div>
                      <div className="ml-3">
                        <label
                          htmlFor="visibility-public"
                          className="font-medium text-gray-800"
                        >
                          Public Project
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                          Your project will be shown in the Explore page and will be visible to all freelancers. 
                          This is recommended for most projects to get more proposals.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative rounded-lg border-2 border-gray-200 bg-white p-4 hover:border-gray-400 transition-all cursor-pointer">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="visibility-private"
                          name="visibility"
                          type="radio"
                          value="private"
                          checked={formData.visibility === "private"}
                          onChange={handleChange}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                      </div>
                      <div className="ml-3">
                        <label
                          htmlFor="visibility-private"
                          className="font-medium text-gray-800"
                        >
                          Private Project
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                          Your project will only be visible to freelancers you invite directly.
                          Use this for confidential projects or when you have specific freelancers in mind.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push("/client-dashboard")}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Posting...
                  </>
                ) : (
                  <>Post Project</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
} 