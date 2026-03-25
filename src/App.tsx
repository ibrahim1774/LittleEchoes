import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { BottomTabBar } from '@/components/BottomTabBar';

// Screens
import { Splash } from '@/screens/Splash';
import { OnboardingFlow } from '@/screens/onboarding/OnboardingFlow';
import { PricingScreen } from '@/screens/onboarding/PricingScreen';
import { ParentSetup } from '@/screens/ParentSetup';
import { AddChild } from '@/screens/AddChild';
import { Home } from '@/screens/Home';
import { TodayScreen } from '@/screens/today/TodayScreen';
import { Memories } from '@/screens/Memories';
import { Settings } from '@/screens/Settings';
import { PaymentSuccessScreen } from '@/screens/auth/PaymentSuccessScreen';
import { SignupScreen } from '@/screens/auth/SignupScreen';
import { SigninScreen } from '@/screens/auth/SigninScreen';

const TAB_ROUTES = ['/home', '/today', '/memories', '/settings'];

function AppShell() {
  const { state } = useApp();
  const location = useLocation();
  const showTabs = TAB_ROUTES.some((r) => location.pathname.startsWith(r));

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-echo-cream">
        <div className="text-4xl animate-bounce-in">🎵</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-echo-cream dark:bg-echo-dark-bg font-nunito max-w-[480px] mx-auto relative">
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/onboarding" element={<OnboardingFlow />} />
        <Route path="/pricing" element={<PricingScreen />} />
        <Route path="/payment-success" element={<PaymentSuccessScreen />} />
        <Route path="/signup" element={<SignupScreen />} />
        <Route path="/signin" element={<SigninScreen />} />
        <Route path="/setup/parent" element={<ParentSetup />} />
        <Route path="/setup/child" element={<AddChild />} />
        <Route
          path="/home"
          element={
            !state.isOnboarded ? <Navigate to="/onboarding" replace /> :
            !state.user ? <Navigate to="/pricing" replace /> :
            <Home />
          }
        />
        <Route
          path="/today"
          element={
            !state.isOnboarded ? <Navigate to="/onboarding" replace /> :
            !state.user ? <Navigate to="/pricing" replace /> :
            <TodayScreen />
          }
        />
        <Route
          path="/memories"
          element={
            !state.isOnboarded ? <Navigate to="/onboarding" replace /> :
            !state.user ? <Navigate to="/pricing" replace /> :
            <Memories />
          }
        />
        <Route
          path="/settings"
          element={
            !state.isOnboarded ? <Navigate to="/onboarding" replace /> :
            !state.user ? <Navigate to="/pricing" replace /> :
            <Settings />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showTabs && <BottomTabBar />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  );
}
