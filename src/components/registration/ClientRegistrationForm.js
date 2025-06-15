import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  FaBuilding,
  FaGlobe,
  FaPhone,
  FaMapMarkerAlt,
  FaBriefcase,
  FaMoneyBillWave,
  FaUserTie,
  FaComments,
  FaClock,
  FaChevronRight,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { db } from "@/firebase/firebase.config";
import { doc, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

export default function ClientRegistrationForm({ onComplete }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    website: "",
    industry: "",
    companySize: "",
    phone: "",
    location: "",
    description: "",
    projectTypes: [],
    budgetRange: "",
    preferredFreelancerLevel: "",
    preferredCommunicationMethod: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Manufacturing",
    "Retail",
    "Real Estate",
    "Other",
  ];

  const companySizes = [
    "1-10 employees",
    "11-50 employees",
    "51-200 employees",
    "201-500 employees",
    "501-1000 employees",
    "1000+ employees",
  ];

  const projectTypes = [
    "Web Development",
    "Mobile Development",
    "UI/UX Design",
    "Content Writing",
    "Digital Marketing",
    "Data Analysis",
    "Other",
  ];

  const budgetRanges = [
    "Less than $1,000",
    "$1,000 - $5,000",
    "$5,000 - $10,000",
    "$10,000 - $25,000",
    "$25,000+",
  ];

  const freelancerLevels = [
    "Entry Level",
    "Intermediate",
    "Expert",
    "Any Level",
  ];

  const communicationMethods = [
    "Email",
    "Phone",
    "Video Call",
    "Chat",
    "Any Method",
  ];

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const updatedTypes = formData.projectTypes.includes(value)
        ? formData.projectTypes.filter((type) => type !== value)
        : [...formData.projectTypes, value];
      setFormData((prev) => ({ ...prev, projectTypes: updatedTypes }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateStep = (step) => {
    if (step === 1) {
      return (
        formData.companyName &&
        formData.industry &&
        formData.companySize &&
        formData.location
      );
    }
    if (step === 2) {
      return formData.description && formData.projectTypes.length > 0;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("User not authenticated");

    if (!validateStep(currentStep)) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    console.log("Starting client profile submission");

    try {
      const userId = user.uid;
      const profileData = {
        ...formData,
        clientProfileCompleted: true,
        updatedAt: new Date().toISOString(),
        userType: "client",
      };

      // Update both the users collection and client_registration collection
      const batch = writeBatch(db); // ✅ correct
      
      // Update users collection
      const userRef = doc(db, "users", userId);
      batch.update(userRef, {
        userType: "client",
        clientProfileCompleted: true,
        userTypeUpdatedAt: new Date().toISOString(),
      });

      // Update client_registration collection
      const clientRef = doc(db, "client_registration", userId);
      batch.set(clientRef, profileData, { merge: true });

      // Commit the batch
      await batch.commit();

      toast.success("Profile created successfully!");
      console.log("Client profile created successfully");

      // Use window.location for a hard redirect to ensure state is fresh
      window.location.href = "/client-dashboard";
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <div
          className={`flex items-center justify-center h-8 w-8 rounded-full ${
            currentStep >= 1
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-500"
          } font-semibold text-sm`}
        >
          1
        </div>
        <div
          className={`flex-1 h-1 mx-2 ${
            currentStep >= 2 ? "bg-blue-600" : "bg-gray-200"
          }`}
        ></div>
        <div
          className={`flex items-center justify-center h-8 w-8 rounded-full ${
            currentStep >= 2
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-500"
          } font-semibold text-sm`}
        >
          2
        </div>
        <div
          className={`flex-1 h-1 mx-2 ${
            currentStep >= 3 ? "bg-blue-600" : "bg-gray-200"
          }`}
        ></div>
        <div
          className={`flex items-center justify-center h-8 w-8 rounded-full ${
            currentStep >= 3
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-500"
          } font-semibold text-sm`}
        >
          3
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span className={currentStep >= 1 ? "text-blue-600 font-medium" : ""}>
          Company Info
        </span>
        <span className={currentStep >= 2 ? "text-blue-600 font-medium" : ""}>
          Project Details
        </span>
        <span className={currentStep >= 3 ? "text-blue-600 font-medium" : ""}>
          Preferences
        </span>
      </div>
    </div>
  );

  return (
    <motion.div
      key={`step-${currentStep}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          {renderProgressBar()}

          <form onSubmit={handleSubmit} className="space-y-8">
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Company Information
                </h3>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="companyName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaBuilding className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="companyName"
                        id="companyName"
                        required
                        value={formData.companyName}
                        onChange={handleChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        placeholder="Your Company Name"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="website"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Website
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaGlobe className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="url"
                        name="website"
                        id="website"
                        value={formData.website}
                        onChange={handleChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="industry"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Industry <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaBriefcase className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="industry"
                        name="industry"
                        required
                        value={formData.industry}
                        onChange={handleChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="">Select Industry</option>
                        {industries.map((industry) => (
                          <option key={industry} value={industry}>
                            {industry}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="companySize"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Company Size <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUserTie className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="companySize"
                        name="companySize"
                        required
                        value={formData.companySize}
                        onChange={handleChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="">Select Company Size</option>
                        {companySizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Phone Number
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaPhone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Location <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="location"
                        id="location"
                        required
                        value={formData.location}
                        onChange={handleChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Continue <FaChevronRight className="ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Project Details
                </h3>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Company Description <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      required
                      value={formData.description}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Tell us about your company, mission, and the types of projects you typically work on..."
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    This helps freelancers understand your business better
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Types <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {projectTypes.map((type) => (
                      <div
                        key={type}
                        className={`flex items-center space-x-2 p-3 border rounded-md cursor-pointer transition-colors ${
                          formData.projectTypes.includes(type)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          const updatedTypes = formData.projectTypes.includes(
                            type
                          )
                            ? formData.projectTypes.filter((t) => t !== type)
                            : [...formData.projectTypes, type];
                          setFormData((prev) => ({
                            ...prev,
                            projectTypes: updatedTypes,
                          }));
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`type-${type}`}
                          name="projectTypes"
                          value={type}
                          checked={formData.projectTypes.includes(type)}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`type-${type}`}
                          className="text-sm text-gray-700 cursor-pointer select-none"
                        >
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Select all project types you&apos;re interested in
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Continue <FaChevronRight className="ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Preferences
                </h3>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="budgetRange"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Typical Budget Range{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaMoneyBillWave className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="budgetRange"
                        name="budgetRange"
                        required
                        value={formData.budgetRange}
                        onChange={handleChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 py-2 text-sm border-gray-300 rounded-md"
                      >
                        <option value="">Select Budget Range</option>
                        {budgetRanges.map((range) => (
                          <option key={range} value={range}>
                            {range}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="preferredFreelancerLevel"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Preferred Freelancer Level{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUserTie className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="preferredFreelancerLevel"
                        name="preferredFreelancerLevel"
                        required
                        value={formData.preferredFreelancerLevel}
                        onChange={handleChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 py-2 text-sm border-gray-300 rounded-md"
                      >
                        <option value="">Select Level</option>
                        {freelancerLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="preferredCommunicationMethod"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Preferred Communication{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaComments className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="preferredCommunicationMethod"
                        name="preferredCommunicationMethod"
                        required
                        value={formData.preferredCommunicationMethod}
                        onChange={handleChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 py-2 text-sm border-gray-300 rounded-md"
                      >
                        <option value="">Select Method</option>
                        {communicationMethods.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="timezone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Timezone <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaClock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="timezone"
                        id="timezone"
                        required
                        value={formData.timezone}
                        onChange={handleChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        placeholder="e.g., UTC-5 (Eastern Time)"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-blue-50 p-4 rounded-md border border-blue-100">
                  <h4 className="text-sm font-medium text-blue-800">
                    Almost Done!
                  </h4>
                  <p className="mt-1 text-sm text-blue-600">
                    After submitting, you&apos;ll be taken to your dashboard
                    where you can start posting jobs and finding freelancers.
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {loading ? (
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
                        Creating Profile...
                      </>
                    ) : (
                      "Complete Profile"
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </div>
      </div>
    </motion.div>
  );
}
