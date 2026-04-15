'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, LogIn, Lock, Mail, Zap, Shield, TrendingUp, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '@/components/Logo';

interface LoginForm {
    email: string;
    password: string;
}

// useSearchParams() must be inside a Suspense boundary
function LoginFormInner() {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email.trim().toLowerCase(), password: data.password }),
            });
            const result = await res.json();
            if (result.success) {
                toast.success(`Welcome back, ${result.user.name}!`);
                window.location.href = searchParams.get('from') || '/dashboard';
            } else {
                toast.error(result.message || 'Invalid credentials');
                setLoading(false);
            }
        } catch {
            toast.error('Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="glass-card-static p-8 animate-scale-in">
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Secure Login</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-100">Welcome back</h2>
                <p className="text-slate-500 text-sm mt-1">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email */}
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        <input
                            type="email"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' },
                            })}
                            placeholder="you@company.com"
                            autoComplete="email"
                            className={`input-premium pl-11 ${errors.email ? 'border-red-500/50' : ''}`}
                        />
                    </div>
                    {errors.email && (
                        <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />{errors.email.message}
                        </p>
                    )}
                </div>

                {/* Password */}
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            {...register('password', {
                                required: 'Password is required',
                                minLength: { value: 6, message: 'Min 6 characters' },
                            })}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className={`input-premium pl-11 pr-12 ${errors.password ? 'border-red-500/50' : ''}`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />{errors.password.message}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-premium w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold disabled:opacity-60 mt-2"
                >
                    {loading ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
                    ) : (
                        <><LogIn className="w-4 h-4" />Sign In</>
                    )}
                </button>
            </form>

            <div className="divider mt-6" />
            <p className="text-center text-xs text-slate-600 mt-4">
                Protected by JWT authentication · Session expires in 7 days
            </p>
        </div>
    );
}

export default function LoginPage() {
    const features = [
        { icon: FileText, label: 'Smart Invoicing', desc: 'Create GST-compliant invoices in seconds' },
        { icon: TrendingUp, label: 'Revenue Analytics', desc: 'Track payments and business growth' },
        { icon: Shield, label: 'Secure & Private', desc: 'Your data is encrypted and protected' },
    ];

    return (
        <div className="min-h-screen flex">
            {/* Left Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-indigo-950/30 to-dark-950" />
                <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

                <div className="relative z-10"><Logo size="lg" showText={true} /></div>

                <div className="relative z-10 space-y-8">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-100 leading-tight mb-3">
                            Manage invoices<br /><span className="gradient-text">like a pro.</span>
                        </h1>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            The complete billing solution for modern businesses. GST-ready, fast, and beautifully designed.
                        </p>
                    </div>
                    <div className="space-y-4">
                        {features.map(({ icon: Icon, label, desc }) => (
                            <div key={label} className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/5 backdrop-blur-sm">
                                <div className="icon-box bg-indigo-500/20 flex-shrink-0"><Icon className="w-5 h-5 text-indigo-400" /></div>
                                <div>
                                    <p className="text-slate-200 font-semibold text-sm">{label}</p>
                                    <p className="text-slate-500 text-xs">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-slate-600 text-xs">© 2025 Bytesflare Infotech. All rights reserved.</p>
                </div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
                <div className="absolute inset-0 bg-dark-950" />
                <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 70%)` }} />

                <div className="relative z-10 w-full max-w-md">
                    <div className="lg:hidden mb-8 flex justify-center">
                        <Logo size="lg" showText={true} />
                    </div>

                    <Suspense fallback={
                        <div className="glass-card-static p-8 flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        </div>
                    }>
                        <LoginFormInner />
                    </Suspense>

                    <p className="text-center text-xs text-slate-700 mt-6">Bytesflare Infotech Invoice Manager v2.0</p>
                </div>
            </div>
        </div>
    );
}
