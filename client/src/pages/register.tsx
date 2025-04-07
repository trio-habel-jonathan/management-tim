import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/register-form";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/constants";

export default function RegisterPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      setLocation(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-dark p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-lg bg-primary text-white p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Create an Account
          </CardTitle>
          <CardDescription className="text-center">
            Register to start managing your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <p className="text-xs text-muted-foreground text-center mt-2">
            By creating an account, you agree to our terms of service and privacy policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
