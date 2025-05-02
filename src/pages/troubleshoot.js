import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase.config";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function Troubleshoot() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({
    connection: "checking",
    tablesExist: {
      profiles: "checking",
      freelancer_profiles: "checking",
      freelancer_education: "checking",
      freelancer_skills: "checking",
    },
    storage: {
      bucket: "checking",
      permissions: "checking",
    },
    userProfile: "checking",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    checkSystemStatus();
  }, [user, router]);

  const checkSystemStatus = async () => {
    setLoading(true);

    try {
      // Check connection to Supabase
      const { data: connectionTest, error: connectionError } = await supabase
        .from("_test")
        .select("*")
        .limit(1)
        .catch(() => ({
          data: null,
          error: new Error("Connection test failed"),
        }));

      setStatus((prev) => ({
        ...prev,
        connection: connectionError ? "error" : "success",
      }));

      // Check if tables exist
      const tableChecks = [
        "profiles",
        "freelancer_profiles",
        "freelancer_education",
        "freelancer_skills",
      ];

      for (const table of tableChecks) {
        const { error: tableError } = await supabase
          .from(table)
          .select("count")
          .limit(1)
          .catch(() => ({ error: new Error(`Table ${table} does not exist`) }));

        setStatus((prev) => ({
          ...prev,
          tablesExist: {
            ...prev.tablesExist,
            [table]: tableError ? "error" : "success",
          },
        }));
      }

      // Check storage bucket
      try {
        const { data: buckets, error: bucketsError } =
          await supabase.storage.listBuckets();

        const bucketExists =
          buckets && buckets.some((b) => b.name === "profile-images");

        setStatus((prev) => ({
          ...prev,
          storage: {
            ...prev.storage,
            bucket: bucketsError || !bucketExists ? "error" : "success",
          },
        }));

        // Check storage permissions
        if (bucketExists) {
          const testFile = new File(["test"], "test.txt", {
            type: "text/plain",
          });

          const { error: uploadError } = await supabase.storage
            .from("profile-images")
            .upload(`test-${Date.now()}.txt`, testFile);

          setStatus((prev) => ({
            ...prev,
            storage: {
              ...prev.storage,
              permissions: uploadError ? "error" : "success",
            },
          }));
        }
      } catch (storageError) {
        setStatus((prev) => ({
          ...prev,
          storage: {
            bucket: "error",
            permissions: "error",
          },
        }));
      }

      // Check if user profile exists
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setStatus((prev) => ({
          ...prev,
          userProfile: profileError || !profile ? "error" : "success",
        }));
      }
    } catch (error) {
      console.error("Troubleshooting error:", error);
      toast.error("Error running diagnostics");
    } finally {
      setLoading(false);
    }
  };

  const fixIssues = async () => {
    setLoading(true);

    try {
      // Trigger the setup database API
      const response = await fetch("/api/setup-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fix issues");
      }

      toast.success("Setup completed successfully!");

      // Re-check status
      setTimeout(() => {
        checkSystemStatus();
      }, 2000);
    } catch (error) {
      console.error("Fix error:", error);
      toast.error(error.message || "Failed to fix issues");
    } finally {
      setLoading(false);
    }
  };

  const renderStatusIcon = (status) => {
    if (status === "checking") {
      return (
        <div className="h-4 w-4 rounded-full bg-gray-200 animate-pulse"></div>
      );
    } else if (status === "success") {
      return <div className="h-4 w-4 rounded-full bg-green-500"></div>;
    } else {
      return <div className="h-4 w-4 rounded-full bg-red-500"></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            System Troubleshooting
          </h1>
          <p className="mt-2 text-gray-600">
            Diagnose and fix issues with your account setup
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Database Connection</span>
              <div className="flex items-center">
                {renderStatusIcon(status.connection)}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium mb-2">Database Tables</h3>
              {Object.entries(status.tablesExist).map(
                ([table, tableStatus]) => (
                  <div
                    key={table}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2"
                  >
                    <span>{table}</span>
                    <div className="flex items-center">
                      {renderStatusIcon(tableStatus)}
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium mb-2">Storage</h3>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
                <span>Profile Images Bucket</span>
                <div className="flex items-center">
                  {renderStatusIcon(status.storage.bucket)}
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
                <span>Storage Permissions</span>
                <div className="flex items-center">
                  {renderStatusIcon(status.storage.permissions)}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium mb-2">User Profile</h3>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
                <span>Profile Exists</span>
                <div className="flex items-center">
                  {renderStatusIcon(status.userProfile)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={checkSystemStatus}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {loading ? "Checking..." : "Refresh Status"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fixIssues}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {loading ? "Fixing..." : "Fix Issues"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/setup-profile")}
            className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg font-medium shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Try Profile Setup Again
          </motion.button>
        </div>
      </div>
    </div>
  );
}
