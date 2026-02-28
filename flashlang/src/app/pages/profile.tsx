import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, Mail, Lock, Globe, Chrome, LogOut } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type ProfileData = {
  name: string;
  email: string;
  targetLanguage: string;
  dailyGoal: string;
  extensionConnected: boolean;
  totalWords: number;
  storiesRead: number;
  quizzesPassed: number;
  currentStreak: number;
};

export function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchProfile() {
      try {
        setError(null);
        const res = await fetch(`${API_BASE}/api/profile`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ProfileData;
        if (!cancelled) {
          console.log("[Profile] data from backend:", data);
          setProfile(data);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProfile();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-600">Loading profile…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-red-600">Profile unavailable: {error ?? "No data"}</p>
      </div>
    );
  }

  const {
    name,
    email,
    targetLanguage,
    dailyGoal,
    extensionConnected,
    totalWords,
    storiesRead,
    quizzesPassed,
    currentStreak,
  } = profile;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl mb-2 text-gray-900">Profile & Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gradient-to-r from-[#3B82F6] to-[#14B8A6] rounded-full flex items-center justify-center mb-4">
                <User className="size-16 text-white" />
              </div>
              <h3 className="text-xl mb-1 text-gray-900">{name}</h3>
              <p className="text-sm text-gray-600 mb-4">{email}</p>
              <Button variant="outline" size="sm">
                Change Photo
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Words</span>
                <span className="text-sm text-gray-900">{totalWords}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Stories Read</span>
                <span className="text-sm text-gray-900">{storiesRead}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Quizzes Passed</span>
                <span className="text-sm text-gray-900">{quizzesPassed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Streak</span>
                <span className="text-sm text-[#F97316]">{currentStreak} days 🔥</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="size-5 text-gray-600" />
              <h3 className="text-lg text-gray-900">Account Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  readOnly
                  className="mt-1 bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    readOnly
                    className="pl-10 bg-gray-50"
                  />
                </div>
              </div>
              <Button variant="outline" className="gap-2" disabled>
                <Lock className="size-4" />
                Change Password
              </Button>
            </div>
          </div>

          {/* Learning Preferences */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="size-5 text-gray-600" />
              <h3 className="text-lg text-gray-900">Learning Preferences</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="language">Target Language</Label>
                <Input
                  id="language"
                  value={targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1)}
                  readOnly
                  className="mt-1 bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="goal">Daily Goal (flashcards)</Label>
                <Input
                  id="goal"
                  value={`${dailyGoal} flashcards`}
                  readOnly
                  className="mt-1 bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Extension Integration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Chrome className="size-5 text-gray-600" />
              <h3 className="text-lg text-gray-900">Browser Extension</h3>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    extensionConnected ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <div>
                  <p className="text-sm text-gray-900">Extension Status</p>
                  <p className="text-xs text-gray-600">
                    {extensionConnected ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
              <Switch checked={extensionConnected} disabled />
            </div>
            {!extensionConnected && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 mb-2">
                  Install the FlashLan browser extension to automatically create flashcards
                  from text you highlight while reading online.
                </p>
                <Button size="sm" className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                  Install Extension
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons (display only – no edit) */}
          <div className="flex gap-3">
            <Button
              type="button"
              className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white"
              disabled
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
