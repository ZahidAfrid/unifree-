import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase.config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { storage } from "@/firebase/firebase.config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
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
  FaArrowLeft,
  FaUpload,
} from "react-icons/fa";

export default function EditClientProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    timezone: "",
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Industry options
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

  // Company size options
  const companySizes = [
    "1-10 employees",
    "11-50 employees",
    "51-200 employees",
    "201-500 employees",
    "501-1000 employees",
    "1000+ employees",
  ];

  // Project type options
  const projectTypes = [
    "Web Development",
    "Mobile Development",
    "UI/UX Design",
    "Content Writing",
    "Digital Marketing",
    "Data Analysis",
    "Other",
  ];

  // Budget range options
  const budgetRanges = [
    "Less than $1,000",
    "$1,000 - $5,000",
    "$5,000 - $10,000",
    "$10,000 - $25,000",
    "$25,000+",
  ];

  // Freelancer level options
  const freelancerLevels = [
    "Entry Level",
    "Intermediate",
    "Expert",
    "Any Level",
  ];

  // Communication method options
  const communicationMethods = [
    "Email",
    "Phone",
    "Video Call",
    "Chat",
    "Any Method",
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
      const clientProfileDoc = await getDoc(
        doc(db, "client_registration", user.uid)
      );

      if (clientProfileDoc.exists()) {
        const profileData = clientProfileDoc.data();
        setFormData({
          companyName: profileData.companyName || "",
          website: profileData.website || "",
          industry: profileData.industry || "",
          companySize: profileData.companySize || "",
          phone: profileData.phone || "",
          location: profileData.location || "",
          description: profileData.description || "",
          projectTypes: profileData.projectTypes || [],
          budgetRange: profileData.budgetRange || "",
          preferredFreelancerLevel: profileData.preferredFreelancerLevel || "",
          preferredCommunicationMethod:
            profileData.preferredCommunicationMethod || "",
          timezone:
            profileData.timezone ||
            Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        // Set logo preview if available
        if (profileData.logoUrl) {
          setLogoPreview(profileData.logoUrl);
        }
      } else {
        // If no client profile found, redirect to registration
        toast.error("Please complete your client profile first");
        router.push("/client-registration");
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
    if (type === "checkbox") {
      const updatedTypes = formData.projectTypes.includes(value)
        ? formData.projectTypes.filter((type) => type !== value)
        : [...formData.projectTypes, value];
      setFormData((prev) => ({ ...prev, projectTypes: updatedTypes }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    if (file.size > 512 * 1024) {
      toast.error("File size exceeds 512KB");
      return;
    }

    setLogo(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file); // ✅ moved inside the function
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    // Basic validation
    if (!formData.companyName || !formData.industry || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);

    // Now we added the log functionality to upload the logo to Firebase Storage
    try {
      let logoUrl = null;

      // Upload logo if selected
      if (logo) {
        const safeName = logo.name.replace(/\s+/g, "_").replace(/:/g, "-");
        const storageRef = ref(
          storage,
          `profile-images/${user.uid}/${safeName}`
        );
        const snapshot = await uploadBytes(storageRef, logo);
        logoUrl = await getDownloadURL(snapshot.ref);
      }
      // Prepare profile data to be saved
      const profileData = {
        ...formData,
        // If we had logo upload functionality:
        // logoUrl: uploaded logo URL would go here
        updatedAt: new Date().toISOString(),
      };

      // Update user document in the client_registration collection
      await setDoc(doc(db, "client_registration", user.uid), profileData, {
        merge: true,
      });

      toast.success("Profile updated successfully!");
      router.push("/client-dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
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
                <h1 className="text-2xl font-bold text-white">
                  Edit Company Profile
                </h1>
                <p className="text-blue-100 mt-1">
                  Update your company information and preferences
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Company Information */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Company Information
                </h3>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  {/* Logo Upload */}
                  <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700">
                      Company Logo
                    </label>
                    <div className="mt-2 flex items-center">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-300">
                        {logoPreview ? (
                          <img
                            src={logoPreview || logoUrl}
                            alt="Company logo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FaBuilding className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-5">
                        <div className="relative bg-blue-600 hover:bg-blue-700 py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center cursor-pointer">
                          <span>Change</span>
                          <input
                            id="logo-upload"
                            name="logo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="companyName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Company Name *
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaBuilding className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        required
                        value={formData.companyName}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div className="sm:col-span-3">
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
                        type="text"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://example.com"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Industry */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="industry"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Industry *
                    </label>
                    <div className="mt-1">
                      <select
                        id="industry"
                        name="industry"
                        required
                        value={formData.industry}
                        onChange={handleChange}
                        className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select an industry</option>
                        {industries.map((industry) => (
                          <option key={industry} value={industry}>
                            {industry}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Company Size */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="companySize"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Company Size *
                    </label>
                    <div className="mt-1">
                      <select
                        id="companySize"
                        name="companySize"
                        required
                        value={formData.companySize}
                        onChange={handleChange}
                        className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select company size</option>
                        {companySizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Phone
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaPhone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Location *
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        required
                        value={formData.location}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-6">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Company Description *
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        name="description"
                        rows={5}
                        required
                        value={formData.description}
                        onChange={handleChange}
                        className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tell us about your company..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Preferences */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Project Preferences
                </h3>

                <div className="space-y-6">
                  {/* Project Types */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Types *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projectTypes.map((type) => (
                        <div key={type} className="flex items-center">
                          <input
                            id={`project-type-${type}`}
                            name={`project-type-${type}`}
                            type="checkbox"
                            checked={formData.projectTypes.includes(type)}
                            onChange={(e) => {
                              const { checked } = e.target;
                              setFormData((prev) => ({
                                ...prev,
                                projectTypes: checked
                                  ? [...prev.projectTypes, type]
                                  : prev.projectTypes.filter((t) => t !== type),
                              }));
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`project-type-${type}`}
                            className="ml-2 block text-sm text-gray-700"
                          >
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Budget Range */}
                  <div>
                    <label
                      htmlFor="budgetRange"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Budget Range *
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
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select budget range</option>
                        {budgetRanges.map((range) => (
                          <option key={range} value={range}>
                            {range}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preferred Freelancer Level */}
                  <div>
                    <label
                      htmlFor="preferredFreelancerLevel"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Preferred Freelancer Level
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUserTie className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="preferredFreelancerLevel"
                        name="preferredFreelancerLevel"
                        value={formData.preferredFreelancerLevel}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select preferred level</option>
                        {freelancerLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preferred Communication Method */}
                  <div>
                    <label
                      htmlFor="preferredCommunicationMethod"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Preferred Communication Method
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaComments className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="preferredCommunicationMethod"
                        name="preferredCommunicationMethod"
                        value={formData.preferredCommunicationMethod}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select communication method</option>
                        {communicationMethods.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label
                      htmlFor="timezone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Timezone
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaClock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="timezone"
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
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
                disabled={saving}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              >
                {saving ? (
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
                    Saving...
                  </>
                ) : (
                  <>Save Changes</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
