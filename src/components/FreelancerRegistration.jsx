import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import styles from "./FreelancerRegistration.module.css";
import DynamicWebcam from "@/components/DynamicWebcam";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebase/firebase.config"; // make sure your firebase config exports `storage`
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase.config";

// Pre-defined list of skills for selection
const SKILL_OPTIONS = [
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "Graphic Design",
  "Content Writing",
  "Copywriting",
  "Digital Marketing",
  "SEO",
  "Social Media Management",
  "Video Editing",
  "Animation",
  "Data Analysis",
  "Machine Learning",
  "Artificial Intelligence",
  "Project Management",
  "Virtual Assistance",
  "Translation",
  "Photography",
  "Music Production",
  "Voice Over",
];

// Pre-defined list of fields
const FIELD_OPTIONS = [
  "Technology",
  "Design",
  "Writing & Translation",
  "Marketing",
  "Video & Animation",
  "Music & Audio",
  "Business",
  "Data",
  "Education",
];

// University options
const UNIVERSITY_OPTIONS = [
  "University of Engineering and Technology (UET)",
  "National University of Sciences and Technology (NUST)",
  "Lahore University of Management Sciences (LUMS)",
  "University of the Punjab",
  "Quaid-i-Azam University",
  "Comsats University",
  "Fast University",
  "Government College University",
  "Information Technology University",
  "Other",
];

export default function FreelancerRegistration() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);
  const [captureDeviceActive, setCaptureDeviceActive] = useState(false);

  // Form state
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Info
    fullName: "",
    username: "",
    bio: "",
    profileImage: null,
    imagePreview: null,

    // Education
    university: "",
    otherUniversity: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    currentlyStudying: false,

    // Skills & Expertise
    primaryField: "",
    skills: [],
    newSkill: "",
    experienceLevel: "Beginner",

    // Additional Info
    hourlyRate: "",
    portfolioUrl: "",
    linkedinUrl: "",
    githubUrl: "",
  });

  // Validation state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with user data if available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.user_metadata?.full_name || "",
      }));

      // Check if user already has a freelancer profile
      const checkExistingProfile = async () => {
        try {
          const profile =
            await freelancerFunctions.getFreelancerProfileByUserId(user.id);
          if (profile) {
            // User already has a profile, redirect to profile page
            toast.success("You already have a freelancer profile");
            router.push(`/freelancer/${profile.username}`);
          }
        } catch (error) {
          console.error("Error checking profile:", error);
        }
      };

      checkExistingProfile();
    }
  }, [user, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear any error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profileImage: file,
          imagePreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapturePhoto = async () => {
    if (captureDeviceActive && webcamRef.current) {
      try {
        // Toggle off the camera first
        setCaptureDeviceActive(false);
      } catch (error) {
        console.error("Error capturing photo:", error);
        toast.error("Failed to capture photo. Please try again.");
      }
    } else {
      setCaptureDeviceActive(true);
    }
  };

  const handleWebcamCapture = (imageSrc) => {
    setFormData((prev) => ({
      ...prev,
      imagePreview: imageSrc,
    }));

    // Convert base64 to file
    if (imageSrc) {
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "profile-image.png", {
            type: "image/png",
          });
          setFormData((prev) => ({
            ...prev,
            profileImage: file,
          }));
          setCaptureDeviceActive(false);
        })
        .catch((err) => {
          console.error("Error converting image:", err);
          toast.error("Failed to process captured image");
        });
    }
  };

  const addSkill = () => {
    if (formData.newSkill && !formData.skills.includes(formData.newSkill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, prev.newSkill],
        newSkill: "",
      }));
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const validateStep = () => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.fullName.trim())
        newErrors.fullName = "Full name is required";
      if (!formData.username.trim())
        newErrors.username = "Username is required";
      else if (!/^[a-z0-9_]{3,20}$/.test(formData.username)) {
        newErrors.username =
          "Username must be 3-20 characters and can only contain lowercase letters, numbers, and underscores";
      }
      if (!formData.bio.trim()) newErrors.bio = "Bio is required";
      if (!formData.profileImage)
        newErrors.profileImage = "Profile image is required";
    } else if (step === 2) {
      if (!formData.university) newErrors.university = "University is required";
      if (formData.university === "Other" && !formData.otherUniversity.trim()) {
        newErrors.otherUniversity = "Please specify your university";
      }
      if (!formData.degree.trim()) newErrors.degree = "Degree is required";
      if (!formData.fieldOfStudy.trim())
        newErrors.fieldOfStudy = "Field of study is required";
      if (!formData.startDate) newErrors.startDate = "Start date is required";
      if (!formData.currentlyStudying && !formData.endDate) {
        newErrors.endDate =
          "End date is required if you are not currently studying";
      }
    } else if (step === 3) {
      if (!formData.primaryField)
        newErrors.primaryField = "Primary field is required";
      if (formData.skills.length === 0)
        newErrors.skills = "At least one skill is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      window.scrollTo(0, 0);
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    window.scrollTo(0, 0);
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep()) return;

    setIsSubmitting(true);

    try {
      // Upload profile image and get URL
      const imageUrl = await uploadProfileImage(user.id, formData.profileImage);

      // Create or update profile
      const profileData = {
        user_id: user.id,
        username: formData.username,
        full_name: formData.fullName,
        bio: formData.bio,
        profile_image: imageUrl,
        primary_field: formData.primaryField,
        hourly_rate: formData.hourlyRate || null,
        experience_level: formData.experienceLevel,
        portfolio_url: formData.portfolioUrl || null,
        linkedin_url: formData.linkedinUrl || null,
        github_url: formData.githubUrl || null,
      };

      await setDoc(doc(db, "freelancer_profiles", user.uid), profileData);

      // Add education
      const educationData = {
        user_id: user.id,
        institution:
          formData.university === "Other"
            ? formData.otherUniversity
            : formData.university,
        degree: formData.degree,
        field_of_study: formData.fieldOfStudy,
        start_date: formData.startDate,
        end_date: formData.currentlyStudying ? null : formData.endDate,
        is_current: formData.currentlyStudying,
      };

      await freelancerFunctions.addEducation(educationData);

      // Add skills
      const skillsCollectionRef = collection(db, "freelancer_skills");
      const skillPromises = formData.skills.map((skill) => {
        return addDoc(skillsCollectionRef, {
          user_id: user.uid,
          skill_name: skill,
        });
      });
      await Promise.all(skillPromises);

      toast.success("Freelancer profile created successfully!");
      // Force a page reload to ensure user context is properly updated
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (error) {
      console.error("Error creating profile:", error);
      toast.error(error.message || "Failed to create freelancer profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadProfileImage = async (userId, file) => {
    try {
      if (!file) return null;

      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, `avatars/${fileName}`);

      // Upload the file to Firebase Storage
      const snapshot = await uploadBytes(storageRef, file);

      // Get the downloadable URL
      const downloadUrl = await getDownloadURL(snapshot.ref);

      return downloadUrl;
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast.error("Failed to upload profile image. Please try again.");
      throw error;
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Sign In Required</h2>
          <p>You need to be signed in to create a freelancer profile.</p>
          <button
            onClick={() => router.push("/login")}
            className={styles.primaryButton}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.stepIndicator}>
          <div
            className={`${styles.step} ${step >= 1 ? styles.activeStep : ""}`}
          >
            1
          </div>
          <div className={styles.stepConnector}></div>
          <div
            className={`${styles.step} ${step >= 2 ? styles.activeStep : ""}`}
          >
            2
          </div>
          <div className={styles.stepConnector}></div>
          <div
            className={`${styles.step} ${step >= 3 ? styles.activeStep : ""}`}
          >
            3
          </div>
          <div className={styles.stepConnector}></div>
          <div
            className={`${styles.step} ${step >= 4 ? styles.activeStep : ""}`}
          >
            4
          </div>
        </div>

        <h2 className={styles.formTitle}>
          {step === 1 && "Basic Information"}
          {step === 2 && "Education"}
          {step === 3 && "Skills & Expertise"}
          {step === 4 && "Additional Information"}
        </h2>

        <form onSubmit={step === 4 ? handleSubmit : (e) => e.preventDefault()}>
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.formGroup}>
                <label htmlFor="fullName">Full Name*</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
                {errors.fullName && (
                  <span className={styles.error}>{errors.fullName}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="username">
                  Username* (for your profile URL)
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="username (letters, numbers, underscores only)"
                />
                {errors.username && (
                  <span className={styles.error}>{errors.username}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="bio">Bio*</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
                {errors.bio && (
                  <span className={styles.error}>{errors.bio}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Profile Image*</label>
                <div className={styles.imageUploadContainer}>
                  {formData.imagePreview && (
                    <div className={styles.imagePreview}>
                      <img src={formData.imagePreview} alt="Preview" />
                    </div>
                  )}

                  <div className={styles.imageUploadButtons}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className={styles.secondaryButton}
                    >
                      Upload Image
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                    />

                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      className={styles.secondaryButton}
                    >
                      {captureDeviceActive ? "Take Photo" : "Use Camera"}
                    </button>
                  </div>

                  {captureDeviceActive && (
                    <div className={styles.webcamContainer}>
                      {typeof window !== "undefined" && (
                        <Suspense fallback={<p>Loading camera...</p>}>
                          <DynamicWebcam onCapture={handleWebcamCapture} />
                        </Suspense>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          handleWebcamCapture(
                            webcamRef.current?.getScreenshot()
                          )
                        }
                        className={`${styles.secondaryButton} ${styles.captureButton}`}
                      >
                        Capture Photo
                      </button>
                    </div>
                  )}
                </div>
                {errors.profileImage && (
                  <span className={styles.error}>{errors.profileImage}</span>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Education */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.formGroup}>
                <label htmlFor="university">University*</label>
                <select
                  id="university"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                >
                  <option value="">Select your university</option>
                  {UNIVERSITY_OPTIONS.map((uni) => (
                    <option key={uni} value={uni}>
                      {uni}
                    </option>
                  ))}
                </select>
                {errors.university && (
                  <span className={styles.error}>{errors.university}</span>
                )}
              </div>

              {formData.university === "Other" && (
                <div className={styles.formGroup}>
                  <label htmlFor="otherUniversity">Specify University*</label>
                  <input
                    type="text"
                    id="otherUniversity"
                    name="otherUniversity"
                    value={formData.otherUniversity}
                    onChange={handleChange}
                    placeholder="Enter your university name"
                  />
                  {errors.otherUniversity && (
                    <span className={styles.error}>
                      {errors.otherUniversity}
                    </span>
                  )}
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="degree">Degree*</label>
                <input
                  type="text"
                  id="degree"
                  name="degree"
                  value={formData.degree}
                  onChange={handleChange}
                  placeholder="e.g., Bachelor of Science, Master of Arts"
                />
                {errors.degree && (
                  <span className={styles.error}>{errors.degree}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="fieldOfStudy">Field of Study*</label>
                <input
                  type="text"
                  id="fieldOfStudy"
                  name="fieldOfStudy"
                  value={formData.fieldOfStudy}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science, Business Administration"
                />
                {errors.fieldOfStudy && (
                  <span className={styles.error}>{errors.fieldOfStudy}</span>
                )}
              </div>

              <div className={styles.formRowGroup}>
                <div className={styles.formGroup}>
                  <label htmlFor="startDate">Start Date*</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                  {errors.startDate && (
                    <span className={styles.error}>{errors.startDate}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="endDate">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    disabled={formData.currentlyStudying}
                  />
                  {errors.endDate && (
                    <span className={styles.error}>{errors.endDate}</span>
                  )}
                </div>
              </div>

              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="currentlyStudying"
                  name="currentlyStudying"
                  checked={formData.currentlyStudying}
                  onChange={handleChange}
                />
                <label htmlFor="currentlyStudying">
                  I am currently studying here
                </label>
              </div>
            </motion.div>
          )}

          {/* Step 3: Skills & Expertise */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.formGroup}>
                <label htmlFor="primaryField">Primary Field*</label>
                <select
                  id="primaryField"
                  name="primaryField"
                  value={formData.primaryField}
                  onChange={handleChange}
                >
                  <option value="">Select your primary field</option>
                  {FIELD_OPTIONS.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
                {errors.primaryField && (
                  <span className={styles.error}>{errors.primaryField}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Skills*</label>
                <div className={styles.skillInputContainer}>
                  <select
                    value={formData.newSkill}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        newSkill: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select a skill or type your own</option>
                    {SKILL_OPTIONS.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={formData.newSkill}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        newSkill: e.target.value,
                      }))
                    }
                    placeholder="Type custom skill here"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    disabled={!formData.newSkill}
                    className={styles.addButton}
                  >
                    Add
                  </button>
                </div>

                {formData.skills.length > 0 && (
                  <div className={styles.skillsContainer}>
                    {formData.skills.map((skill) => (
                      <div key={skill} className={styles.skillTag}>
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className={styles.removeSkill}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {errors.skills && (
                  <span className={styles.error}>{errors.skills}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="experienceLevel">Experience Level</label>
                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </motion.div>
          )}

          {/* Step 4: Additional Information */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.formGroup}>
                <label htmlFor="hourlyRate">Hourly Rate (₨)</label>
                <input
                  type="number"
                  id="hourlyRate"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  placeholder="e.g., 1000"
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="portfolioUrl">Portfolio URL</label>
                <input
                  type="url"
                  id="portfolioUrl"
                  name="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleChange}
                  placeholder="https://yourportfolio.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="linkedinUrl">LinkedIn URL</label>
                <input
                  type="url"
                  id="linkedinUrl"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/yourusername"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="githubUrl">GitHub URL</label>
                <input
                  type="url"
                  id="githubUrl"
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/yourusername"
                />
              </div>
            </motion.div>
          )}

          {/* Navigation buttons */}
          <div className={styles.buttonContainer}>
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className={styles.secondaryButton}
                disabled={isSubmitting}
              >
                Previous
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className={styles.primaryButton}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Profile..." : "Create Profile"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
