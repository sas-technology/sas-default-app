"use client"

import { getProviders, signIn } from "next-auth/react"
import { useEffect, useState, type FormEvent } from "react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"

type Stage = "loading" | "email" | "code"

interface ProviderMap {
  google: boolean
  nodemailer: boolean
}

// ---------------------------------------------------------------------------
// Onboarding Dialog — collects credentials and writes .env.local via API
// ---------------------------------------------------------------------------
function OnboardingDialog() {
  const [tab, setTab] = useState<"google" | "email" | "both">("google")
  const [saving, setSaving] = useState(false)
  const [authUrl, setAuthUrl] = useState("http://localhost:11000")
  const [result, setResult] = useState<{
    success: boolean
    message: string
    restart: boolean
  } | null>(null)

  // Form fields
  const [setupToken, setSetupToken] = useState("")
  const [googleClientId, setGoogleClientId] = useState("")
  const [googleClientSecret, setGoogleClientSecret] = useState("")
  const [resendApiKey, setResendApiKey] = useState("")
  const [emailFrom, setEmailFrom] = useState("")

  useEffect(() => {
    fetch("/api/setup")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.authUrl === "string") {
          setAuthUrl(data.authUrl)
        }
      })
      .catch(() => {
        // keep default
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    setResult(null)

    const payload: Record<string, string> = {}
    if (tab === "google" || tab === "both") {
      payload.googleClientId = googleClientId
      payload.googleClientSecret = googleClientSecret
    }
    if (tab === "email" || tab === "both") {
      payload.resendApiKey = resendApiKey
      if (emailFrom) payload.emailFrom = emailFrom
    }

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-setup-token": setupToken,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        setResult({ success: false, message: data.error, restart: false })
        setSaving(false)
        return
      }

      setResult(data)

      // If the container is restarting, poll until it comes back
      if (data.restart) {
        const poll = setInterval(async () => {
          try {
            const ping = await fetch("/api/setup")
            if (ping.ok) {
              clearInterval(poll)
              window.location.reload()
            }
          } catch {
            // still restarting
          }
        }, 1500)
      }
    } catch {
      setResult({
        success: false,
        message: "Could not reach setup API.",
        restart: false,
      })
    }

    setSaving(false)
  }

  const providerFilled =
    (tab === "google" && googleClientId && googleClientSecret) ||
    (tab === "email" && resendApiKey) ||
    (tab === "both" && googleClientId && googleClientSecret && resendApiKey)
  const canSubmit = !!setupToken && !!providerFilled

  return (
    <Dialog defaultOpen>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Set up authentication</DialogTitle>
          <DialogDescription>
            Choose your auth method and enter your credentials. This is a
            one-time setup — your keys are saved locally inside the container.
          </DialogDescription>
        </DialogHeader>

        {/* Setup token (printed in the container logs at boot) */}
        <div className="space-y-2 pt-2">
          <Label htmlFor="setup-token">Setup token</Label>
          <Input
            id="setup-token"
            type="text"
            autoComplete="off"
            placeholder="Paste the token from the container logs"
            value={setupToken}
            onChange={(e) => setSetupToken(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            One-time token printed in the container logs at startup. Required to
            authorize this initial setup.
          </p>
        </div>

        {/* Provider selector */}
        <div className="flex gap-2 pt-2">
          {(["google", "email", "both"] as const).map((option) => (
            <Button
              key={option}
              variant={tab === option ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(option)}
            >
              {option === "google"
                ? "Google OAuth"
                : option === "email"
                  ? "Email OTP"
                  : "Both"}
            </Button>
          ))}
        </div>

        <div className="space-y-4 pt-2">
          {/* Google OAuth fields */}
          {(tab === "google" || tab === "both") && (
            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-medium">Google OAuth</h3>
              <p className="text-xs text-muted-foreground">
                From Google Cloud Console &rarr; APIs &amp; Services &rarr;
                Credentials. Set redirect URI to{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  {authUrl}/api/auth/callback/google
                </code>
              </p>
              <div className="space-y-2">
                <Label htmlFor="google-client-id">Client ID</Label>
                <Input
                  id="google-client-id"
                  placeholder="xxxxx.apps.googleusercontent.com"
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="google-client-secret">Client Secret</Label>
                <Input
                  id="google-client-secret"
                  type="password"
                  placeholder="GOCSPX-..."
                  value={googleClientSecret}
                  onChange={(e) => setGoogleClientSecret(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Resend fields */}
          {(tab === "email" || tab === "both") && (
            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-medium">Email OTP via Resend</h3>
              <p className="text-xs text-muted-foreground">
                Get an API key at resend.com/api-keys.
              </p>
              <div className="space-y-2">
                <Label htmlFor="resend-api-key">Resend API Key</Label>
                <Input
                  id="resend-api-key"
                  type="password"
                  placeholder="re_..."
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-from">
                  From Address{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="email-from"
                  type="email"
                  placeholder="onboarding@resend.dev"
                  value={emailFrom}
                  onChange={(e) => setEmailFrom(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Status */}
          {result && (
            <p
              className={`text-center text-sm ${result.success ? "text-muted-foreground" : "text-destructive"}`}
              role="alert"
            >
              {result.message}
              {result.restart && (
                <span className="mt-1 block animate-pulse">
                  Waiting for restart...
                </span>
              )}
            </p>
          )}

          <Separator />

          <Button
            className="w-full"
            disabled={!canSubmit || saving}
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Save and start"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Login page
// ---------------------------------------------------------------------------

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function LoginPage() {
  const [stage, setStage] = useState<Stage>("loading")
  const [providers, setProviders] = useState<ProviderMap>({
    google: false,
    nodemailer: false,
  })
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getProviders().then((result) => {
      setProviders({
        google: !!result?.google,
        nodemailer: !!result?.nodemailer,
      })
      setStage("email")
    })
  }, [])

  const hasAnyProvider = providers.google || providers.nodemailer

  async function handleGoogleSignIn() {
    await signIn("google", { callbackUrl: "/dashboard" })
  }

  async function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn("nodemailer", {
      email,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Could not send sign-in code. Please try again.")
      return
    }

    setStage("code")
  }

  async function handleCodeSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const code = (formData.get("code") as string).trim()

    const params = new URLSearchParams({
      callbackUrl: "/dashboard",
      token: code,
      email,
    })
    window.location.href = `/api/auth/callback/nodemailer?${params.toString()}`
  }

  if (stage === "loading") {
    return (
      <div className="w-full max-w-sm p-6 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (!hasAnyProvider) {
    return (
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
          <p className="text-sm text-muted-foreground">
            Let&apos;s set up your authentication
          </p>
        </div>
        <OnboardingDialog />
      </div>
    )
  }

  if (stage === "code") {
    return (
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to {email}
          </p>
        </div>

        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              Sign-in code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoComplete="one-time-code"
              autoFocus
              className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-center font-mono text-xl tracking-[0.4em] ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="000000"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Verify and sign in"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setStage("email")
              setError(null)
            }}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            Use a different email
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          {providers.google && providers.nodemailer
            ? "Choose how you\u2019d like to sign in"
            : providers.google
              ? "Sign in with your Google account"
              : "We\u2019ll email you a one-time sign-in code"}
        </p>
      </div>

      {providers.google && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
        >
          <GoogleIcon />
          Continue with Google
        </Button>
      )}

      {providers.google && providers.nodemailer && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              or continue with email
            </span>
          </div>
        </div>
      )}

      {providers.nodemailer && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="user@example.com"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending code..." : "Send sign-in code"}
          </Button>
        </form>
      )}
    </div>
  )
}
