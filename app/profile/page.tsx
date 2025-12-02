"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Header } from "@/app/(components)/Header"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.email) {
      fetchUsername()
    }
  }, [session])

  const fetchUsername = async () => {
    try {
      const response = await fetch("/api/user/username")
      const data = await response.json()
      if (data.username) {
        setCurrentUsername(data.username)
        setUsername(data.username)
      }
    } catch (error) {
      console.error("Error fetching username:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch("/api/user/username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to set username")
        setLoading(false)
        return
      }

      setSuccess(true)
      setCurrentUsername(username)
      setLoading(false)
      
      // Refresh session to update username
      window.location.reload()
    } catch (error) {
      setError("Failed to set username. Please try again.")
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#FAFAF6] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#FAFAF6]">
      <Header
        selectedCategory="ALL"
        onCategoryChange={() => {}}
      />

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Account Information</h2>
            <div className="text-gray-600">
              <p><strong>Email:</strong> {session.user?.email}</p>
              <p><strong>Name:</strong> {session.user?.name}</p>
              {currentUsername && (
                <p><strong>Username:</strong> @{currentUsername}</p>
              )}
            </div>
          </div>

          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold mb-4">
              {currentUsername ? "Change Username" : "Set Username"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">@</span>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                      setError("")
                      setSuccess(false)
                    }}
                    placeholder="your_username"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    pattern="[a-zA-Z0-9_]{3,20}"
                    minLength={3}
                    maxLength={20}
                    required
                    disabled={loading}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  Username updated successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={loading || username === currentUsername}
                className="w-full px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : currentUsername ? "Update Username" : "Set Username"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

