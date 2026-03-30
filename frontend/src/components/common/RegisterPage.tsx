import React, { useState } from 'react';
import { Truck, Eye, EyeOff, ArrowLeft, User, Phone, Lock, Mail, Building2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types';

interface RegisterPageProps {
  onNavigate: (view: 'landing' | 'login' | 'register') => void;
  onRegisterSuccess: () => void;
}

export function RegisterPage({ onNavigate, onRegisterSuccess }: RegisterPageProps) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>('shipper');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    businessName: '',
    businessType: '',
    vehicleType: 'pickup',
    agreeTerms: false
  });

  const { register } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        role,
        ...(role === 'shipper' && {
          businessName: formData.businessName,
          businessType: formData.businessType
        }),
        ...(role === 'driver' && {
          vehicle: {
            type: formData.vehicleType,
            make: '',
            model: '',
            year: new Date().getFullYear(),
            registrationNumber: '',
            capacity: { weight: 0, volume: 0 },
            photos: []
          }
        })
      };

      await register(userData);
      onRegisterSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[#0B1F3A] mb-4">I want to...</h2>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setRole('shipper')}
          className={`p-6 border-2 rounded-xl text-center transition-all duration-200 ${
            role === 'shipper'
              ? 'border-[#FF6B00] bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <User className={`w-8 h-8 mx-auto mb-3 ${role === 'shipper' ? 'text-[#FF6B00]' : 'text-gray-400'}`} />
          <p className={`font-semibold ${role === 'shipper' ? 'text-[#FF6B00]' : 'text-gray-700'}`}>
            Ship Goods
          </p>
          <p className="text-sm text-gray-500 mt-1">I need transport</p>
        </button>
        <button
          type="button"
          onClick={() => setRole('driver')}
          className={`p-6 border-2 rounded-xl text-center transition-all duration-200 ${
            role === 'driver'
              ? 'border-[#FF6B00] bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Truck className={`w-8 h-8 mx-auto mb-3 ${role === 'driver' ? 'text-[#FF6B00]' : 'text-gray-400'}`} />
          <p className={`font-semibold ${role === 'driver' ? 'text-[#FF6B00]' : 'text-gray-700'}`}>
            Drive & Deliver
          </p>
          <p className="text-sm text-gray-500 mt-1">I have a vehicle</p>
        </button>
      </div>
      <Button
        type="button"
        onClick={() => setStep(2)}
        className="w-full bg-[#FF6B00] hover:bg-[#E55F00] text-white py-3 rounded-xl font-semibold mt-6"
      >
        Continue
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="John Kamau"
            className="input-tranzit pl-12"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+254 712 345 678"
            className="input-tranzit pl-12"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email (Optional)
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="john@example.com"
            className="input-tranzit pl-12"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Create a password"
            className="input-tranzit pl-12 pr-12"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {role === 'shipper' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Your Business Name"
                className="input-tranzit pl-12"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type
            </label>
            <select
              name="businessType"
              value={formData.businessType}
              onChange={handleInputChange}
              className="input-tranzit"
            >
              <option value="">Select business type</option>
              <option value="Retail">Retail Shop</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Construction">Construction</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </>
      )}

      {role === 'driver' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Type
          </label>
          <select
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleInputChange}
            className="input-tranzit"
          >
            <option value="motorcycle">Motorcycle (Boda)</option>
            <option value="tuk-tuk">Tuk-tuk</option>
            <option value="pickup">Pickup</option>
            <option value="van">Van</option>
            <option value="truck">Truck</option>
            <option value="lorry">Lorry</option>
          </select>
        </div>
      )}

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="agreeTerms"
          checked={formData.agreeTerms}
          onChange={handleInputChange}
          className="mt-1 rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00]"
          required
        />
        <span className="text-sm text-gray-600">
          I agree to the{' '}
          <button type="button" className="text-[#FF6B00] hover:underline">Terms of Service</button>
          {' '}and{' '}
          <button type="button" className="text-[#FF6B00] hover:underline">Privacy Policy</button>
        </span>
      </label>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => setStep(1)}
          variant="outline"
          className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 py-3 rounded-xl"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !formData.agreeTerms}
          className="flex-1 bg-[#FF6B00] hover:bg-[#E55F00] text-white py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </span>
          ) : (
            'Create Account'
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1F3A] via-[#0B1F3A] to-[#1a3a5c] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#FF6B00]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#FF6B00]/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <button
          onClick={() => step === 1 ? onNavigate('landing') : setStep(1)}
          className="absolute -top-12 left-0 text-white/70 hover:text-white flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {step === 1 ? 'Back to Home' : 'Back'}
        </button>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B00] to-[#ff8533] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#0B1F3A]">Create Account</h1>
            <p className="text-gray-500 mt-1">Join Kenya's #1 logistics platform</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 1 ? 'bg-[#FF6B00] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div className={`w-12 h-1 rounded-full ${step >= 2 ? 'bg-[#FF6B00]' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 2 ? 'bg-[#FF6B00] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
          </div>

          {/* Form Content */}
          {step === 1 ? renderStep1() : renderStep2()}

          {/* Sign In Link */}
          <p className="mt-8 text-center text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-[#FF6B00] font-semibold hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
