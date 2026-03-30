// Landing Page Component
import { Truck, MapPin, Shield, Clock, ChevronRight, Star, Users, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LandingPageProps {
  onNavigate: (view: 'landing' | 'login' | 'register') => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const features = [
    {
      icon: Truck,
      title: 'Reliable Transport',
      description: 'Connect with verified drivers and vehicles for all your logistics needs'
    },
    {
      icon: MapPin,
      title: 'Live Tracking',
      description: 'Track your shipments in real-time from pickup to delivery'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Pay safely with M-Pesa. Your money is protected until delivery'
    },
    {
      icon: Clock,
      title: 'On-Demand',
      description: 'Get a driver in minutes. No more waiting or calling around'
    }
  ];

  const stats = [
    { value: '10K+', label: 'Deliveries' },
    { value: '500+', label: 'Verified Drivers' },
    { value: '4.8', label: 'Average Rating' },
    { value: '99%', label: 'On-Time Rate' }
  ];

  const testimonials = [
    {
      name: 'James Mwangi',
      role: 'Business Owner',
      content: 'Tranzit has transformed how we handle deliveries. Fast, reliable, and affordable!',
      rating: 5
    },
    {
      name: 'Sarah Ochieng',
      role: 'Shop Owner',
      content: 'The live tracking feature gives me peace of mind. I can see exactly where my goods are.',
      rating: 5
    },
    {
      name: 'Peter Kamau',
      role: 'Driver',
      content: 'As a driver, Tranzit has helped me earn more with consistent job requests.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B00] to-[#ff8533] rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-[#0B1F3A]">Tranzit</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => onNavigate('login')}
                className="text-[#0B1F3A] hover:text-[#FF6B00]"
              >
                Sign In
              </Button>
              <Button
                onClick={() => onNavigate('register')}
                className="bg-[#FF6B00] hover:bg-[#E55F00] text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0B1F3A] via-[#0B1F3A] to-[#1a3a5c] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#FF6B00] rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#FF6B00] rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/80 text-sm">Now available in Nairobi</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Move Goods <span className="text-[#FF6B00]">Faster</span>, Cheaper, Smarter
              </h1>
              <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto lg:mx-0">
                Kenya's most reliable logistics marketplace. Connect with verified drivers, 
                track deliveries in real-time, and pay securely with M-Pesa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() => onNavigate('register')}
                  className="bg-[#FF6B00] hover:bg-[#E55F00] text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-orange-500/25"
                >
                  Ship Now
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => onNavigate('register')}
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl"
                >
                  Become a Driver
                </Button>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative">
                <img
                  src="/images/hero-delivery.jpg"
                alt="Delivery truck"
                  className="rounded-2xl shadow-2xl shadow-black/30 w-full"
                />
                {/* Floating Stats Card */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#0B1F3A]">2,847</p>
                      <p className="text-sm text-gray-500">Deliveries today</p>
                    </div>
                  </div>
                </div>
                {/* Floating Rating Card */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-[#0B1F3A]">4.9</span>
                    <span className="text-sm text-gray-500">Rating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-bold text-[#0B1F3A] mb-2">{stat.value}</p>
                <p className="text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1F3A] mb-4">
              Why Choose Tranzit?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We have built the most efficient logistics platform in Kenya, 
              connecting businesses with reliable transport solutions.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card-tranzit-hover p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#FF6B00] to-[#ff8533] rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1F3A] mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get your goods moving in just a few simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Shipment',
                description: 'Enter pickup and dropoff locations, cargo details, and get an instant price estimate.'
              },
              {
                step: '02',
                title: 'Match with Driver',
                description: 'Our system finds the nearest verified driver and sends them your request.'
              },
              {
                step: '03',
                title: 'Track & Receive',
                description: 'Track your delivery in real-time and pay securely via M-Pesa upon completion.'
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-gray-100 absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="relative pt-8">
                  <h3 className="text-xl font-semibold text-[#0B1F3A] mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0B1F3A] to-[#1a3a5c]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              What Our Users Say
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Join thousands of satisfied customers and drivers using Tranzit daily
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white/90 mb-6">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FF6B00] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{testimonial.name}</p>
                    <p className="text-white/60 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FF6B00]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Join Kenya's fastest-growing logistics marketplace. 
            Whether you're shipping goods or looking for delivery jobs, Tranzit has you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => onNavigate('register')}
              className="bg-white text-[#FF6B00] hover:bg-gray-100 px-8 py-6 text-lg rounded-xl"
            >
              <Users className="w-5 h-5 mr-2" />
              Sign Up as Shipper
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate('register')}
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl"
            >
              <Truck className="w-5 h-5 mr-2" />
              Become a Driver
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[#0B1F3A]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B00] to-[#ff8533] rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Tranzit</span>
              </div>
              <p className="text-white/60 text-sm">
                Kenya's most reliable logistics marketplace connecting shippers with verified drivers.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Shippers</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>How it Works</li>
                <li>Pricing</li>
                <li>Business Accounts</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Drivers</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>Driver Requirements</li>
                <li>Earnings</li>
                <li>Safety</li>
                <li>Driver App</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>About Us</li>
                <li>Careers</li>
                <li>Press</li>
                <li>Contact</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">
              © 2024 Tranzit Logistics. All rights reserved.
            </p>
            <div className="flex gap-6 text-white/40 text-sm">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Cookie Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
