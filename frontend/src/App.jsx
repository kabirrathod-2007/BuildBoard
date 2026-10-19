import { useState, lazy, Suspense } from 'react'
import { Route, Routes, Navigate } from 'react-router'
import LandingPage from './pages/LandingPage.jsx'
import SkipToContent from './components/SkipToContent.jsx'
import OpeningIntro from './components/OpeningIntro.jsx'

const SignInPage = lazy(() => import('./pages/SignInPage.jsx'))
const SignUpPage = lazy(() => import('./pages/SignUpPage.jsx'))
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage.jsx'))
const ProfileSetupPage = lazy(() => import('./pages/ProfileSetupPage.jsx'))
const ExplorePage = lazy(() => import('./pages/ExplorePage.jsx'))
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage.jsx'))
const SubmitProductPage = lazy(() => import('./pages/SubmitProductPage.jsx'))
const BuilderDashboardPage = lazy(() => import('./pages/BuilderDashboardPage.jsx'))
const TesterActivityPage = lazy(() => import('./pages/TesterActivityPage.jsx'))
const ProblemsPage = lazy(() => import('./pages/ProblemsPage.jsx'))
const SubmitProblemPage = lazy(() => import('./pages/SubmitProblemPage.jsx'))
const ProblemDetailsPage = lazy(() => import('./pages/ProblemDetailsPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))

function PageFallback() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#d96b43] border-t-transparent" aria-label="Loading page..." />
    </div>
  )
}

function App() {
  const [introActive, setIntroActive] = useState(true)

  return (
    <>
      {introActive && (
        <OpeningIntro onDone={() => setIntroActive(false)} />
      )}
      <div>
        <SkipToContent />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/verify-email" element={<EmailVerificationPage />} />
            <Route path="/profile" element={<ProfileSetupPage />} />
            <Route path="/profile/setup" element={<ProfileSetupPage />} />
            <Route path="/profile/edit" element={<ProfileSetupPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/problems" element={<ProblemsPage />} />
            <Route path="/problems/new" element={<SubmitProblemPage />} />
            <Route path="/problems/:problemId" element={<ProblemDetailsPage />} />
            <Route path="/builder/dashboard" element={<BuilderDashboardPage />} />
            <Route path="/dashboard" element={<Navigate to="/builder/dashboard" replace />} />
            <Route path="/tester/activity" element={<TesterActivityPage />} />
            <Route path="/activity" element={<Navigate to="/tester/activity" replace />} />
            <Route path="/tester/recognition" element={<Navigate to="/tester/activity" replace />} />
            <Route path="/products/new" element={<SubmitProductPage />} />
            <Route path="/products/:productId" element={<ProductDetailsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
    </>
  )
}

export default App