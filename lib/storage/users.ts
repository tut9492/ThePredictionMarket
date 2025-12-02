/**
 * User Storage Utility
 * Handles storing and retrieving user data (usernames) from Vercel KV
 */

import { kv } from '@vercel/kv'

const USERNAME_KEY_PREFIX = 'user:username:'
const USER_ID_KEY_PREFIX = 'user:id:'

/**
 * Get username by user ID (email)
 */
export async function getUsername(userId: string): Promise<string | null> {
  try {
    const username = await kv.get<string>(`${USERNAME_KEY_PREFIX}${userId}`)
    return username || null
  } catch (error) {
    console.error('[User Storage] Error getting username:', error)
    return null
  }
}

/**
 * Set username for a user
 * Returns true if successful, false if username is taken
 */
export async function setUsername(userId: string, username: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return { success: false, error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' }
    }

    // Check if username is already taken
    const existingUserId = await kv.get<string>(`${USER_ID_KEY_PREFIX}${username.toLowerCase()}`)
    if (existingUserId && existingUserId !== userId) {
      return { success: false, error: 'Username is already taken' }
    }

    // Get current username if exists
    const currentUsername = await getUsername(userId)
    
    // If user had a previous username, remove the old mapping
    if (currentUsername && currentUsername.toLowerCase() !== username.toLowerCase()) {
      await kv.del(`${USER_ID_KEY_PREFIX}${currentUsername.toLowerCase()}`)
    }

    // Set new username mappings
    await kv.set(`${USERNAME_KEY_PREFIX}${userId}`, username)
    await kv.set(`${USER_ID_KEY_PREFIX}${username.toLowerCase()}`, userId)

    return { success: true }
  } catch (error) {
    console.error('[User Storage] Error setting username:', error)
    return { success: false, error: 'Failed to set username' }
  }
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const existingUserId = await kv.get<string>(`${USER_ID_KEY_PREFIX}${username.toLowerCase()}`)
    return !existingUserId
  } catch (error) {
    console.error('[User Storage] Error checking username availability:', error)
    return false
  }
}

