import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { getUsername, setUsername } from "@/lib/storage/users"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

/**
 * GET /api/user/username
 * Get the current user's username
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const username = await getUsername(session.user.email)
    
    return NextResponse.json({
      username: username || null,
      hasUsername: !!username,
    })
  } catch (error) {
    console.error("[Username API] Error:", error)
    return NextResponse.json(
      { error: "Failed to get username" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/username
 * Set the current user's username
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { username } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      )
    }

    const result = await setUsername(session.user.email, username)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to set username" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      username,
    })
  } catch (error) {
    console.error("[Username API] Error:", error)
    return NextResponse.json(
      { error: "Failed to set username" },
      { status: 500 }
    )
  }
}

