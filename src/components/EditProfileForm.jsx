import { useState, useEffect } from "react";
import { db } from "@/fireabse/firebase.config";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function EditProfileForm({ user, profile, freelancerProfile }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    title: freelancerProfile?.title || "",
    description: freelancerProfile?.description || "",
    hourly_rate: freelancerProfile?.hourly_rate || "",
    experience_level: freelancerProfile?.experience_level || "Beginner",
    university: freelancerProfile?.university || "",
    department: freelancerProfile?.department || "",
    graduation_year: freelancerProfile?.graduation_year || "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    profile?.avatar_url || null
  );
  const [skills, setSkills] = useState(freelancerProfile?.skills || []);
  const [newSkill, setNewSkill] = useState("");

  const experienceLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];
  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill)) {
      toast.error("Skill already added.");
      return;
    }
    setSkills([...skills, newSkill]);
    setNewSkill("");
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return profile?.avatar_url;

    try {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error } = await supabase.storage
        .from("profile-images")
        .upload(filePath, avatarFile);

      if (error) throw error;

      const { data } = supabase.storage
        .from("profile-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      toast.error("Error uploading profile picture.");
      return profile?.avatar_url;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const avatarUrl = await uploadAvatar();

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: formData.full_name,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      const { error: freelancerError } = await supabase
        .from("freelancer_profiles")
        .upsert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          hourly_rate: formData.hourly_rate
            ? parseFloat(formData.hourly_rate)
            : null,
          university: formData.university,
          department: formData.department,
          graduation_year: formData.graduation_year
            ? parseInt(formData.graduation_year)
            : null,
          experience_level: formData.experience_level,
          updated_at: new Date().toISOString(),
        });

      if (freelancerError) throw freelancerError;

      toast.success("Profile updated successfully!");
      router.push("/freelancer/profile");
    } catch (error) {
      toast.error(`Update failed: ${error.message}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex justify-center items-center bg-gray-100 p-4"
    >
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Edit Your Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Image */}
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-600 text-xl">
                  {formData.full_name.charAt(0)}
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="mt-2"
            />
          </div>

          {/* Fields */}
          {[
            "full_name",
            "title",
            "description",
            "hourly_rate",
            "university",
            "department",
          ].map((field, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-full"
            >
              <label className="block text-sm font-medium text-gray-700 capitalize">
                {field.replace("_", " ")}
              </label>
              <input
                type="text"
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </motion.div>
          ))}

          {/* Dropdowns */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Experience Level
              </label>
              <select
                name="experience_level"
                value={formData.experience_level}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                {experienceLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Graduation Year
              </label>
              <select
                name="graduation_year"
                value={formData.graduation_year}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                {graduationYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Save Profile
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
