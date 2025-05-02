import { useState, useEffect } from "react";
import { db } from "@/firebase/firebase.config";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Lenis from "@studio-freight/lenis";

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    hourly_rate: "",
    university: "",
    department: "",
    graduation_year: "",
    experience_level: "Beginner",
  });

  const experienceLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

  // ✅ Lenis Smooth Scrolling
  useEffect(() => {
    const lenis = new Lenis();
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, []);

  useEffect(() => {
    async function getUser() {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error) {
        toast.error("Failed to fetch user.");
      } else {
        setUser(userData.user);
        fetchFreelancerProfile(userData.user.id);
        fetchUserSkills(userData.user.id);
      }
    }
    getUser();
  }, []);

  // ✅ Fetch Freelancer Profile Data
  const fetchFreelancerProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("freelancer_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        toast.error("Failed to fetch profile.");
        return;
      }

      setFormData({
        title: data.title || "",
        description: data.description || "",
        hourly_rate: data.hourly_rate || "",
        university: data.university || "",
        department: data.department || "",
        graduation_year: data.graduation_year || "",
        experience_level: data.experience_level || "Beginner",
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
    }
  };

  // ✅ Fetch Freelancer Skills
  const fetchUserSkills = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("freelancer_skills")
        .select("skill_name")
        .eq("user_id", userId);

      if (error) {
        toast.error("Failed to load skills.");
        return;
      }

      setSkills(data.map((s) => s.skill_name) || []);
    } catch (error) {
      console.error("Skills fetch error:", error);
    }
  };

  // ✅ Handle Form Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle Adding Skills
  const addSkill = () => {
    if (!newSkill.trim() || skills.includes(newSkill)) return;
    setSkills([...skills, newSkill]);
    setNewSkill("");
  };

  // ✅ Handle Removing Skills
  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  // ✅ Handle Profile Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("User is not authenticated.");
      return;
    }

    setLoading(true);
    try {
      // Update freelancer profile
      const { error: profileError } = await supabase
        .from("freelancer_profiles")
        .update({
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
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Update skills
      await supabase.from("freelancer_skills").delete().eq("user_id", user.id);
      if (skills.length > 0) {
        const skillData = skills.map((skill) => ({
          user_id: user.id,
          skill_name: skill,
        }));
        await supabase.from("freelancer_skills").insert(skillData);
      }

      toast.success("Profile updated successfully!");
      router.push("/freelancer/profile");
    } catch (error) {
      console.error("Update failed:", error.message);
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-r from-blue-500 to-indigo-600"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="max-w-3xl w-full bg-white bg-opacity-90 backdrop-blur-md shadow-xl rounded-2xl p-8 border border-gray-200 lg:max-w-2xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Edit Your Profile
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {[
            "title",
            "description",
            "hourly_rate",
            "university",
            "department",
            "graduation_year",
          ].map((field, index) => (
            <motion.div key={index} className="w-full">
              <label className="block text-sm font-semibold text-gray-700 capitalize">
                {field.replace("_", " ")}
              </label>
              <input
                type={
                  field === "hourly_rate" || field === "graduation_year"
                    ? "number"
                    : "text"
                }
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="w-full px-4 py-3 border rounded-lg bg-gray-50 text-gray-700 shadow-sm hover:shadow-lg"
              />
            </motion.div>
          ))}

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700">
              Skills
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-grow px-4 py-3 border rounded-lg bg-gray-50 text-gray-700 shadow-sm"
                placeholder="Add a skill..."
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((skill, index) => (
                <div key={index} className="bg-blue-200 px-3 py-1 rounded-lg">
                  {skill} <button onClick={() => removeSkill(index)}>✖</button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="col-span-2 bg-blue-600 text-white rounded-lg py-3"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
