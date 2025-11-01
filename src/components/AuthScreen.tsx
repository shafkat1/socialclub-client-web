import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Phone, Mail, Calendar } from "lucide-react";
import { config } from "../utils/config";

interface AuthScreenProps {
  onAuthSuccess: (session: any) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Sign up state
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    name: "",
    dateOfBirth: "",
  });

  // Sign in state
  const [signinData, setSigninData] = useState({
    email: "",
    password: "",
  });

  // OTP state (disabled for now)
  const [otpData, setOtpData] = useState({
    email: "",
    otp: "",
  });

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    // Age validation
    if (!signupData.dateOfBirth) {
      setError("Date of birth is required");
      setLoading(false);
      return;
    }

    const age = calculateAge(signupData.dateOfBirth);
    
    // US federal minimum drinking age is 21
    if (age < 21) {
      setError(`You must be at least 21 years old to use this service. You are currently ${age} years old.`);
      setLoading(false);
      return;
    }

    // Additional check for future dates
    if (new Date(signupData.dateOfBirth) > new Date()) {
      setError("Date of birth cannot be in the future");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${config.api.baseUrl}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(signupData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const serverMessage =
          (typeof data === 'string' && data) ||
          (Array.isArray(data?.message) && data.message[0]) ||
          data?.message ||
          (typeof data?.error === 'string' ? data.error : data?.error?.message) ||
          `Sign up failed`;
        console.error("Signup error:", data, response.status);
        throw new Error(serverMessage);
      }

      // Map backend token response to expected session shape
      if (data && (data.accessToken || data.access_token)) {
        const session = {
          access_token: data.accessToken || data.access_token,
          refresh_token: data.refreshToken || data.refresh_token,
          user: data.user,
          expires_in: data.expiresIn || data.expires_in,
        };
        onAuthSuccess(session);
        return;
      }

      console.log("Signup successful, checking for session...");

      // Check if session was returned from signup
      if (data.session) {
        console.log("Session returned from signup");
        onAuthSuccess(data.session);
      } else if (data.message) {
        // Backend told us to sign in manually
        console.log("No session from signup, message:", data.message);
        throw new Error(data.message);
      } else {
        console.log("No session from signup, attempting manual sign in...");
        // If no session, try to sign in
        const signinResponse = await fetch(
          `${config.api.baseUrl}/auth/signin`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: signupData.email,
              password: signupData.password,
            }),
          }
        );

        const signinData = await signinResponse.json();

        if (!signinResponse.ok) {
          console.error("Auto sign-in error:", signinData.error);
          setSuccessMessage(`Account created! Email: ${signupData.email}`);
          setError("Please sign in using the credentials above in the Sign In tab.");
          setLoading(false);
          return;
        }

        console.log("Auto sign-in successful");
        const session = signinData.session || {
          access_token: signinData.accessToken || signinData.access_token,
          refresh_token: signinData.refreshToken || signinData.refresh_token,
          user: signinData.user,
          expires_in: signinData.expiresIn || signinData.expires_in,
        };
        onAuthSuccess(session);
      }
    } catch (err: any) {
      console.error("Signup exception:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${config.api.baseUrl}/auth/signin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(signinData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const serverMessage =
          (typeof data === 'string' && data) ||
          (Array.isArray(data?.message) && data.message[0]) ||
          data?.message ||
          (typeof data?.error === 'string' ? data.error : data?.error?.message) ||
          `Sign in failed`;
        console.error("Signin error:", data);
        throw new Error(serverMessage);
      }

      console.log("Signin successful");
      const session = data.session || {
        access_token: data.accessToken || data.access_token,
        refresh_token: data.refreshToken || data.refresh_token,
        user: data.user,
        expires_in: data.expiresIn || data.expires_in,
      };
      onAuthSuccess(session);
    } catch (err: any) {
      console.error("Signin exception:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${config.api.baseUrl}/auth/send-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: otpData.email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpSent(true);
      setSuccessMessage("OTP sent to your email");
    } catch (err: any) {
      console.error("Send OTP exception:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${config.api.baseUrl}/auth/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(otpData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "OTP verification failed");
      }

      console.log("OTP verification successful");
      onAuthSuccess(data.session);
    } catch (err: any) {
      console.error("Verify OTP exception:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setError(`${provider} sign-in is available. Please configure it in your backend at /api/auth/social/${provider.toLowerCase()}`);
  };

  const checkAuthDebug = async () => {
    try {
      const response = await fetch(
        `${config.api.baseUrl}/auth/debug`,
        {
          headers: {
            // No Authorization header as it's not a protected endpoint
          },
        }
      );
      const data = await response.json();
      console.log("Auth Debug Info:", data);
      alert(`Auth Debug:\n${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      console.error("Debug check failed:", err);
    }
  };

  const createTestUser = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("Creating test user... (this takes ~1 second)");
    
    try {
      const response = await fetch(
        `${config.api.baseUrl}/auth/create-test-user`,
        {
          method: "POST",
          headers: {
            // No Authorization header as it's not a protected endpoint
          },
        }
      );
      const data = await response.json();
      console.log("Test user creation result:", data);
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create test user");
      }

      if (data.success) {
        setSuccessMessage(`✅ Test user created!\n\nEmail: ${data.email}\nPassword: ${data.password}\n\n${data.instructions}`);
        
        // Auto-fill signin form
        setSigninData({
          email: data.email,
          password: data.password,
        });
      } else {
        setSuccessMessage(`⚠️ ${data.instructions}\n\nEmail: ${data.email}\nPassword: ${data.password}`);
        setSigninData({
          email: data.email,
          password: data.password,
        });
      }
    } catch (err: any) {
      console.error("Test user creation failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cleanupTestUsers = async () => {
    if (!confirm("Delete all test users? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    
    try {
      const response = await fetch(
        `${config.api.baseUrl}/auth/cleanup-test-users`,
        {
          method: "POST",
          headers: {
            // No Authorization header as it's not a protected endpoint
          },
        }
      );
      const data = await response.json();
      console.log("Cleanup result:", data);
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to cleanup users");
      }

      setSuccessMessage(`Deleted ${data.deleted} test user(s). Failed: ${data.failed}`);
    } catch (err: any) {
      console.error("Cleanup failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testSignIn = async () => {
    if (!signinData.email || !signinData.password) {
      setError("Enter email and password first");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    
    try {
      const response = await fetch(
        `${config.api.baseUrl}/auth/test-signin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(signinData),
        }
      );
      const data = await response.json();
      console.log("Test signin result:", data);
      
      if (!response.ok) {
        throw new Error(data.error || "Test signin failed");
      }

      if (data.success) {
        setSuccessMessage(`✅ Sign-in test PASSED!\n\nDiagnostics:\n${JSON.stringify(data.diagnostics, null, 2)}`);
        
        // If successful, actually sign in
        if (data.session) {
          setTimeout(() => {
            handleSignIn(new Event('submit') as any);
          }, 1000);
        }
      } else {
        setError(`❌ Sign-in test FAILED\n\nError: ${data.error}\n\nDiagnostics:\n${JSON.stringify(data.diagnostics, null, 2)}`);
      }
    } catch (err: any) {
      console.error("Test signin failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <Card className="w-full max-w-md relative shadow-modern-xl border-0">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto mb-2 text-5xl">🍹</div>
          <CardTitle className="text-3xl gradient-text">Welcome to TreatMe</CardTitle>
          <CardDescription className="text-base">
            Connect with people and share drinks at venues near you (21+ only)
          </CardDescription>
          
          {/* First-time user help */}
          {!error && !successMessage && (
            <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded text-sm text-left">
              <p className="font-medium mb-1">🎉 First time here?</p>
              <p className="text-xs text-gray-700">
                Scroll to the bottom and click <span className="font-semibold">🧪 Create Test User</span> for instant access!
              </p>
            </div>
          )}
          
          {/* Error-specific help */}
          {error && error.includes("Invalid") && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-left">
              <p className="font-medium mb-2">💡 Quick Fix (scroll to bottom):</p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-blue-900">
                <li>Scroll down and click "🗑️ Cleanup"</li>
                <li>Click "🧪 Create Test User"</li>
                <li>Switch to "Sign In" tab</li>
                <li>Click "🔍 Test" to verify</li>
                <li>Click "Sign In"</li>
              </ol>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm whitespace-pre-wrap">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm whitespace-pre-wrap font-mono">
              {successMessage}
            </div>
          )}
          
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="otp">OTP</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="flex gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground mt-3" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signinData.email}
                      onChange={(e) =>
                        setSigninData({ ...signinData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signinData.password}
                    onChange={(e) =>
                      setSigninData({ ...signinData, password: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={testSignIn}
                    disabled={loading}
                    className="flex-1 border-indigo-200 hover:bg-indigo-50"
                  >
                    🔍 Test
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    value={signupData.name}
                    onChange={(e) =>
                      setSignupData({ ...signupData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-dob">Date of Birth</Label>
                  <div className="flex gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-3" />
                    <Input
                      id="signup-dob"
                      type="date"
                      value={signupData.dateOfBirth}
                      onChange={(e) =>
                        setSignupData({ ...signupData, dateOfBirth: e.target.value })
                      }
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You must be 21+ to use this service (U.S. federal minimum)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="flex gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground mt-3" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupData.email}
                      onChange={(e) =>
                        setSignupData({ ...signupData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupData.password}
                    onChange={(e) =>
                      setSignupData({ ...signupData, password: e.target.value })
                    }
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="otp">
              <div className="space-y-4 p-6 text-center">
                <div className="bg-muted/50 rounded-lg p-6">
                  <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">SMS OTP Authentication</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    SMS-based OTP authentication requires additional Supabase configuration with an SMS provider like Twilio.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    For prototyping, please use <strong>Email & Password</strong> authentication instead.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <Separator className="my-4" />
            <p className="text-center text-sm text-muted-foreground mb-4">
              Or continue with
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("Google")}
                type="button"
              >
                Google
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("Facebook")}
                type="button"
              >
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("Apple")}
                type="button"
              >
                Apple
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("Instagram")}
                type="button"
              >
                Instagram
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Social sign-in requires configuration in Supabase
            </p>
          </div>

          {/* Debug Buttons */}
          <div className="mt-4 pt-4 border-t space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={createTestUser}
              className="w-full"
              type="button"
              disabled={loading}
            >
              {loading ? "Creating..." : "🧪 Create Test User"}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={checkAuthDebug}
                className="flex-1 text-xs"
                type="button"
              >
                📊 Debug Info
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={cleanupTestUsers}
                className="flex-1 text-xs"
                type="button"
                disabled={loading}
              >
                🗑️ Cleanup
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
