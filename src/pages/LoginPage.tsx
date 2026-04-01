import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import LaserFlow from '@/components/LaserFlow'
import LightRays from '@/components/LightRays'
import Stepper, { Step } from '@/components/Stepper'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, user, initialized } = useAuthStore()
  const { t } = useTranslation('auth')
  useEffect(() => {
    if (initialized && user && location.pathname === '/login') {
      navigate('/dashboard', { replace: true })
    }
  }, [initialized, user, location.pathname, navigate])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState(false)

  const [name, setName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(false)
    const ok = await login(username, password)
    if (ok) {
      navigate('/dashboard')
    } else {
      setLocalError(true)
    }
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white selection:bg-purple-500/30 flex items-center justify-center">
      {/* Background Animation Layer */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <div className="absolute inset-0" style={{ width: '100vw', height: '100vh', position: 'absolute' }}>
          <LaserFlow
            color="#FF79C6"
            wispDensity={1.6}
            flowSpeed={0.4}
            verticalSizing={2}
            horizontalSizing={2.1}
            fogIntensity={0.75}
            fogScale={0.3}
            wispSpeed={15}
            wispIntensity={5}
            flowStrength={0.25}
            decay={1.1}
            horizontalBeamOffset={0}
            verticalBeamOffset={-0.5}
          />
        </div>
        <div className="absolute inset-0 mix-blend-screen" style={{ width: '100vw', height: '100vh', position: 'absolute' }}>
          <LightRays
            raysOrigin="top-center"
            raysColor="#ffffff"
            raysSpeed={1}
            lightSpread={0.5}
            rayLength={3}
            pulsating={false}
            fadeDistance={1}
            saturation={1}
            followMouse
            mouseInfluence={0.1}
            noiseAmount={0}
            distortion={0}
          />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md p-4">
        <Card className="w-full border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-[0_32px_80px_rgba(0,0,0,0.8)] overflow-hidden rounded-[30px] text-white">
          <div className="absolute top-0 inset-x-0 h-px w-2/3 mx-auto bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>
          
          <CardHeader className="text-center pt-8">
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 mb-2">SubManager</h1>
            <CardTitle className="text-xl text-white/90">{isRegistering ? 'Create Account' : t('title')}</CardTitle>
            <CardDescription className="text-white/60">{isRegistering ? 'Follow the steps to get started' : t('description')}</CardDescription>
          </CardHeader>
          <CardContent className="pb-8 overflow-hidden">
            {isRegistering ? (
              <Stepper
                initialStep={1}
                onStepChange={(step) => {
                  console.log(step);
                }}
                onFinalStepCompleted={() => {
                  console.log("All steps completed!");
                  setIsRegistering(false);
                }}
                backButtonText="Previous"
                nextButtonText="Next"
              >
                <Step>
                  <h2 className="text-xl font-bold mb-2">Welcome to the React Bits stepper!</h2>
                  <p className="text-white/70">Check out the next step!</p>
                </Step>
                <Step>
                  <h2 className="text-xl font-bold">Step 2</h2>
                  <img style={{ height: '100px', width: '100%', objectFit: 'cover', objectPosition: 'center -70px', borderRadius: '15px', marginTop: '1em' }} src="https://www.purrfectcatgifts.co.uk/cdn/shop/collections/Funny_Cat_Cards_640x640.png?v=1663150894" alt="Funny Cat" />
                  <p className="text-white/70 mt-4">Custom step content!</p>
                </Step>
                <Step>
                  <h2 className="text-xl font-bold mb-4">How about an input?</h2>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Your name?"
                    className="bg-black/20 border-white/10 text-white placeholder-white/40 focus-visible:ring-purple-500/50 focus-visible:border-purple-500/50 h-12 rounded-xl"
                  />
                </Step>
                <Step>
                  <h2 className="text-xl font-bold mb-2">Final Step</h2>
                  <p className="text-white/70">You made it!</p>
                </Step>
              </Stepper>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label htmlFor="username" className="text-sm font-medium text-white/80">{t('username')}</label>
                  <Input 
                    id="username" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    autoFocus 
                    autoCapitalize="none"
                    autoComplete="username"
                    autoCorrect="off"
                    className="bg-black/20 border-white/10 text-white placeholder-white/40 focus-visible:ring-purple-500/50 focus-visible:border-purple-500/50 h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <label htmlFor="password" className="text-sm font-medium text-white/80">{t('password')}</label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="bg-black/20 border-white/10 text-white placeholder-white/40 focus-visible:ring-purple-500/50 focus-visible:border-purple-500/50 h-12 rounded-xl"
                  />
                </div>
                {(localError || error) && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                    <p className="text-sm text-red-400 font-medium">{localError ? t('invalidCredentials') : error}</p>
                  </div>
                )}
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-12 rounded-xl font-bold text-white transition-all duration-300 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 border-0 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]"
                >
                  {isLoading ? t('signingIn') : t('submit')}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-white/50">
              {isRegistering ? (
                <p>Already have an account? <button onClick={() => setIsRegistering(false)} className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">Sign in here</button></p>
              ) : (
                <p>Don't have an account? <button onClick={() => setIsRegistering(true)} className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">Register now</button></p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
