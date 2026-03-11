import React from "react";
import axios from "axios";
import { BRAND, IMAGES, SERVICES, WHY_US, FAQS } from "../mock/mock.js";
import PROPERTIES from "../services/propertiesService.js";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "../hooks/use-toast.js";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Building,
  KeyRound,
  Handshake,
  MapPin,
  ShieldCheck,
  UserRound,
  BadgeCheck,
  Star,
  Heart,
  ArrowRight,
  Play,
  Clock,
  Users,
  TrendingUp,
  Award,
  LayoutGrid,
  List,
  BedDouble,
  Bath,
  Ruler,
  Phone,
  Mail,
  Send,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import CountUp from "./CountUp";
import { smoothScrollTo, interceptAnchorClicks } from "../utils/smoothScroll.js";
import SiteHeader from "./layout/SiteHeader.jsx";
import SiteFooter from "./layout/SiteFooter.jsx";
import AUTH from "../services/authService.js";

const ICONS = { Home, Building, KeyRound, Handshake, MapPin, ShieldCheck, UserRound, BadgeCheck };

const currency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const FALLBACK_IMG = {
  hero: "https://images.unsplash.com/photo-1505691723518-36a1f0d3a808?auto=format&fit=crop&w=1920&q=60",
  about: "https://images.unsplash.com/photo-1527030280862-64139fba04ca?auto=format&fit=crop&w=1200&q=60",
  property: "https://images.unsplash.com/photo-1600585154154-7ef9d53f6cfb?auto=format&fit=crop&w=1200&q=60",
};

// Map API property to landing card shape
function mapApiPropertyToCard(p) {
  const type = p.sale ? "sale" : "rent";
  const category = p.type ? String(p.type).charAt(0).toUpperCase() + String(p.type).slice(1).toLowerCase() : "Residential";
  return {
    id: p.id,
    title: p.title,
    location: p.location,
    image: (p.images && p.images[0]) || FALLBACK_IMG.property,
    price: p.price != null ? Number(p.price) : 0,
    pricePerMonth: type === "rent" && p.price != null ? Number(p.price) : undefined,
    beds: p.beds,
    baths: p.baths,
    area: p.sqft,
    desc: p.description,
    features: Array.isArray(p.tags) ? p.tags : [],
    type,
    category,
  };
}

const formatSalePrice = (n) => {
  if (n >= 10000000) {
    const c = n / 10000000; // Crores
    return `₹${c.toFixed(1)} Crores`;
  }
  if (n >= 100000) {
    const l = n / 100000; // Lakhs
    return `₹${l.toFixed(1)} Lakhs`;
  }
  return currency(n);
};

function Underline({ align = 'center', width = 'w-[7.5rem] sm:w-[9rem] md:w-[10.5rem]', className = '' }) {
  const alignClass = align === 'center' ? 'mx-auto' : '';
  const marks = [20, 45, 70, 95, 120, 145, 170];
  return (
    <div className={`${alignClass} mt-1 ${width} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 200 8" preserveAspectRatio="none" className="w-full h-[2px] block pointer-events-none" style={{ filter: 'drop-shadow(0 0 2px rgba(212,175,55,0.22))' }}>
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5E37A" />
            <stop offset="48%" stopColor="#FFFFFF" />
            <stop offset="52%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F5E37A" />
          </linearGradient>
          <linearGradient id="topShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <path d="M2 4 C 50 0, 150 0, 198 4 C 150 8, 50 8, 2 4 Z" fill="url(#goldGrad)" opacity="0.9" />
        <path d="M2 4 C 50 0, 150 0, 198 4" stroke="url(#topShine)" strokeWidth="0.3" fill="none" opacity="0.7" />
        <g stroke="rgba(255,255,255,0.55)" strokeWidth="0.25" opacity="0.22" strokeLinecap="round">
          {marks.map((x, i) => (
            <path key={i} d={`M ${x - 3} 4 L ${x} 5 M ${x + 3} 4 L ${x} 5`} />
          ))}
        </g>
      </svg>
    </div>
  );
}

function LoginModal({ open, setOpen }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const res = await AUTH.LOGIN(email, password);

      console.log("LOGIN RES:", res); // ✅ debug

      if (!res) {
        toast({
          title: "Login failed",
          description: "No response from server",
        });
        return;
      }

      if (res.status !== 200) {
        toast({
          title: "Login failed",
          description: res?.data?.error || res?.data?.message || "Invalid credentials",
        });
        return;
      }

      toast({
        title: "Login successful",
        description: "Welcome to Vespera Admin Panel",
      });

      setOpen(false);
      navigate("/dashboard/admin", { replace: true });
    } catch (error) {
      console.log("Login Error:", error);

      toast({
        title: "Login failed",
        description:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Server error, please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="gold-panel border border-white/10 text-white backdrop-blur-xl bg-white/[0.04] max-w-md w-[92%] sm:w-full p-6 sm:p-8 rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-white/10">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-gold">
            Welcome back
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Vespera Estates Admin Access
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input
              type="email"
              required
              placeholder="admin@vespera.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/40 border-white/15 text-white"
            />
          </div>

          <div className="grid gap-2">
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/40 border-white/15 text-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-2 flex items-center text-white/60"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <DialogFooter>
            <Button type="submit" className="gold-btn gold-shine" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


function ConsultationModal({ open, setOpen, defaults = {} }) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const title = defaults.title || 'Schedule a Consultation';

  // Country code mapping (simple)
  const getCountryCode = (num) => {
    if (num.startsWith('1')) return '+1'; // USA/Canada
    if (num.startsWith('44')) return '+44'; // UK
    if (num.startsWith('61')) return '+61'; // Australia
    if (num.startsWith('65')) return '+65'; // Singapore
    if (num.startsWith('971')) return '+971'; // UAE
    return '+91'; // default India
  };

  // Handle form submit
  const onSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const full_name = data.get('name');
    const email = data.get('email');
    let phone = data.get('phone');
    const date_time = data.get('datetime');
    const interest = data.get('interest');
    const message = data.get('message');

    if (!full_name || !email) {
      toast({ title: 'Error', description: 'Full name and email are required.', variant: 'destructive' });
      return;
    }

    // Normalize phone number before sending
    // Remove everything except digits
    let clean = phone.replace(/\D/g, '');
    // Guess country code
    const code = getCountryCode(clean);
    // Remove local prefix if duplicated
    clean = clean.replace(/^91|^1|^44|^61|^65|^971/, '');
    // Final E.164 format
    const finalPhone = code + clean;

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5174/api/userDetails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, phone: finalPhone, date_time, interest, message }),
      });

      if (!res.ok) throw new Error('Failed to submit form');

      const result = await res.json();

      toast({
        title: 'Success!',
        description: result.message || 'Your consultation request has been submitted.',
      });

      e.target.reset();
      setOpen(false);
    } catch (err) {
      console.error('Error submitting form:', err);
      toast({
        title: 'Error',
        description: 'Failed to send details. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="gold-panel border border-white/10 text-white backdrop-blur-xl bg-white/[0.04] max-w-md w-[92%] sm:w-full p-6 sm:p-8 rounded-2xl shadow-2xl ring-1 ring-white/10">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-gold">{title}</DialogTitle>
          <DialogDescription className="text-white/70">
            Pick a convenient date and time. Our team will confirm your appointment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="cons_name">Full Name</Label>
            <Input id="cons_name" name="name" required placeholder="Your full name" defaultValue={defaults.name || ''} className="bg-black/40 border-white/15 text-white" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cons_email">Email</Label>
              <Input id="cons_email" name="email" type="email" required placeholder="you@domain.com" defaultValue={defaults.email || ''} className="bg-black/40 border-white/15 text-white w-full" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cons_phone">Phone</Label>
              <Input
                id="cons_phone"
                name="phone"
                type="tel"
                required
                placeholder="+91 98/65 43210"
                defaultValue={defaults.phone || ''}
                className="bg-black/40 border-white/15 text-white w-full"
                onChange={(e) => {
                  let input = e.target.value.replace(/\D/g, '');

                  // Guess country code dynamically
                  const code = getCountryCode(input);
                  input = input.replace(/^91|^1|^44|^61|^65|^971/, '');
                  input = input.slice(0, 10);

                  let formatted = code;
                  if (input.length > 0) {
                    formatted += ' ';
                    if (input.length > 5) {
                      formatted += input.slice(0, 5) + ' ' + input.slice(5);
                    } else {
                      formatted += input;
                    }
                  }

                  e.target.value = formatted;
                }}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cons_datetime">Preferred Date & Time</Label>
              <Input id="cons_datetime" name="datetime" type="datetime-local" required defaultValue={defaults.datetime || ''} className="bg-black/40 border-white/15 text-white appearance-none" style={{ width: '197px' }} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cons_interest">Interest</Label>
              <select id="cons_interest" name="interest" defaultValue={defaults.interest || 'Consultation'} className="bg-black/40 border border-white/15 text-white rounded-md h-10 px-3">
                <option>Buying</option>
                <option>Selling</option>
                <option>Renting</option>
                <option>Consultation</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cons_msg">Message (optional)</Label>
            <textarea id="cons_msg" name="message" rows={3} placeholder="Tell us anything specific you'd like to discuss" defaultValue={defaults.message || ''} className="bg-black/40 border border-white/15 text-white rounded-md p-3" />
          </div>

          <DialogFooter>
            <Button type="submit" className="gold-btn gold-shine" disabled={loading}>
              {loading ? 'Booking...' : 'Book Appointment'}
            </Button>
            <Button type="button" variant="ghost" className="text-white/70 hover:text-white" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


function Hero() {
  const [hasVideo, setHasVideo] = React.useState(false);
  const heroBg = `${import.meta.env.BASE_URL}assets/Hero_BG.jpeg`;
  const videoHref = `${import.meta.env.BASE_URL}assets/Theme/Full%20Landing%20With%20Animations.mp4`;
  React.useEffect(() => {
    fetch(videoHref, { method: 'HEAD' })
      .then((res) => setHasVideo(res.ok))
      .catch(() => setHasVideo(false));
  }, [videoHref]);
  return (
    <section
      id="home"
      className="relative h-screen h-[100svh] min-h-[560px] w-full overflow-hidden bg-black scroll-mt-24 md:scroll-mt-28"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/60 z-[1]" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 z-[2]" aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none z-[3]" aria-hidden="true" style={{
        background:
          "radial-gradient(800px 400px at 20% 20%, rgba(200,170,110,0.06), transparent 60%), radial-gradient(700px 400px at 80% 20%, rgba(200,170,110,0.04), transparent 60%)",
      }} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 h-full flex items-start pt-32 md:pt-40">
        <div className="max-w-2xl">
          <span className="inline-block text-[11px] md:text-xs px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur-md mb-4">
            Premium Real Estate Services in Pune
          </span>
          <h1 className="h1-hero leading-tight text-white">
            Your Property Goals,
            <span className="block text-gold">Our Priority</span>
          </h1>
          <p className="mt-4 text-white/80 text-lg md:text-xl">
            Buy, Sell, or Rent Residential & Commercial Properties with Ease.
          </p>
          <p className="mt-1 text-gold font-medium">Get the Luxury You Desire in Life</p>
          <div className="mt-8 flex items-center gap-4">
            <a href="#properties">
              <Button className="gold-btn gold-shine">Get Started</Button>
            </a>
            {hasVideo && (
              <a href={videoHref} target="_blank" rel="noopener">
                <Button className="border border-white/20 bg-white/10 hover:bg-white/15 text-white">
                  <Play className="h-4 w-4 mr-2" /> Watch Video
                </Button>
              </a>
            )}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:hidden">
            <div className="stats-card rounded-2xl px-4 py-3 text-center">
              <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center">
                <Building className="h-4 w-4" />
              </div>
              <div className="stats-value text-gold text-lg font-extrabold"><CountUp end={500} suffix="+" className="inline" /></div>
              <div className="text-xs text-white/70">Properties</div>
            </div>
            <div className="stats-card rounded-2xl px-4 py-3 text-center">
              <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <div className="stats-value text-gold text-lg font-extrabold"><CountUp end={1200} suffix="+" className="inline" /></div>
              <div className="text-xs text-white/70">Clients</div>
            </div>
            <div className="stats-card rounded-2xl px-4 py-3 text-center">
              <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <div className="stats-value text-gold text-lg font-extrabold"><CountUp end={15} suffix="+" className="inline" /></div>
              <div className="text-xs text-white/70">Years</div>
            </div>
            <div className="stats-card rounded-2xl px-4 py-3 text-center">
              <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center">
                <BadgeCheck className="h-4 w-4" />
              </div>
              <div className="stats-value text-gold text-lg font-extrabold"><CountUp end={25} suffix="+" className="inline" /></div>
              <div className="text-xs text-white/70">Experts</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 md:bottom-10 inset-x-0 px-0 md:px-6 hidden sm:block">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="stats-card rounded-2xl px-4 py-3 text-center hover-glow-gold">
                <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center">
                  <Building className="h-4 w-4" />
                </div>
                <div className="stats-value text-gold text-xl md:text-2xl font-extrabold"><CountUp end={500} suffix="+" className="inline" /></div>
                <div className="text-xs md:text-sm text-white/70">Properties Sold</div>
              </div>
              <div className="stats-card rounded-2xl px-4 py-3 text-center hover-glow-gold">
                <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <div className="stats-value text-gold text-xl md:text-2xl font-extrabold"><CountUp end={1200} suffix="+" className="inline" /></div>
                <div className="text-xs md:text-sm text-white/70">Happy Clients</div>
              </div>
              <div className="stats-card rounded-2xl px-4 py-3 text-center hover-glow-gold">
                <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="stats-value text-gold text-xl md:text-2xl font-extrabold"><CountUp end={15} suffix="+" className="inline" /></div>
                <div className="text-xs md:text-sm text-white/70">Years Experience</div>
              </div>
              <div className="stats-card rounded-2xl px-4 py-3 text-center hover-glow-gold">
                <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center">
                  <BadgeCheck className="h-4 w-4" />
                </div>
                <div className="stats-value text-gold text-xl md:text-2xl font-extrabold"><CountUp end={25} suffix="+" className="inline" /></div>
                <div className="text-xs md:text-sm text-white/70">Expert Team</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="relative bg-[#0A0A0A] py-20 md:py-28 scroll-mt-24 md:scroll-mt-28">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-12 lg:space-y-16">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <span className="inline-block text-[11px] md:text-xs px-3 py-1 rounded-full border border-white/15 bg-white/5 text-white/70 backdrop-blur-md mb-4">
              About {BRAND.name}
            </span>
            <h2 className="h2-section text-white leading-tight">
              Trusted Real Estate
              <span className="block text-gold">Partner in Pune</span>
            </h2>
            <Underline align="left" />
            <p className="mt-6 text-white/80 leading-relaxed">
              With years of experience, {BRAND.name} is a trusted real estate agency offering transparent commissions,
              local market expertise, and reliable after-sale support. We help clients find their dream home or sell their
              property hassle-free.
            </p>
            <p className="mt-4 text-white/70">
              Our commitment to excellence and deep understanding of Pune's real estate market makes us the preferred choice for discerning clients seeking luxury properties and professional service.
            </p>
            <ul className="mt-6 space-y-3 text-white/85">
              <li className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: 'var(--gold)' }} /> Transparent commission structure</li>
              <li className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: 'var(--gold)' }} /> Deep local market knowledge</li>
              <li className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: 'var(--gold)' }} /> Comprehensive after-sale support</li>
              <li className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: 'var(--gold)' }} /> Expert property valuation</li>
            </ul>
          </div>
          <div className="space-y-4 self-center">
            <div className="grid grid-cols-2 gap-4">
              <div className="stats-card rounded-2xl px-5 py-6 text-center hover-glow-gold">
                <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-gold text-2xl font-extrabold"><CountUp end={100} suffix="%" className="inline" /></div>
                <div className="text-xs md:text-sm text-white/70">Transparent Dealings</div>
              </div>
              <div className="stats-card rounded-2xl px-5 py-6 text-center hover-glow-gold">
                <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
                <div className="text-gold text-2xl font-extrabold"><CountUp end={15} suffix="+" className="inline" /></div>
                <div className="text-xs md:text-sm text-white/70">Years of Excellence</div>
              </div>
              <div className="stats-card rounded-2xl px-5 py-6 text-center hover-glow-gold">
                <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div className="text-gold text-2xl font-extrabold"><CountUp end={1200} suffix="+" className="inline" /></div>
                <div className="text-xs md:text-sm text-white/70">Happy Families</div>
              </div>
              <div className="stats-card rounded-2xl px-5 py-6 text-center hover-glow-gold">
                <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="text-gold text-2xl font-extrabold"><CountUp end={500} suffix="+" className="inline" /></div>
                <div className="text-xs md:text-sm text-white/70">Properties Sold</div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-stretch">
          <div className="flex">
            <div className="relative gold-panel rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl px-6 md:px-10 py-8 md:py-10 text-center my-auto w-full">
              <h3 className="h3-section text-white mb-4">Our Mission</h3>
              <p className="text-white/80 max-w-3xl mx-auto">
                "To provide exceptional real estate services that exceed client expectations, combining market expertise with personalized attention to help every client achieve their property dreams in Pune's dynamic real estate landscape."
              </p>
            </div>
          </div>
          <div className="relative group rounded-2xl border border-white/10 hover-glow-gold">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#D4AF37]/30 to-transparent blur-xl opacity-60 transition-opacity group-hover:opacity-80" />
            <img src={IMAGES.about} alt="About" loading="lazy" className="relative rounded-2xl shadow-2xl object-cover w-full h-[300px] md:h-[360px] lg:h-[420px] transition-transform duration-300 group-hover:scale-[1.01]" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG.about; }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ title, desc, icon: Icon }) {
  return (
    <Card className="card-surface hover-glow-gold transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-gold">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-white text-lg">{title}</h3>
            <p className="mt-2 text-white/70 text-sm leading-relaxed">{desc}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Services({ onOpenConsultation }) {
  const CARDS = [
    {
      title: 'Buy a Property',
      desc:
        "Find your dream home from our curated selection of luxury properties across Pune.",
      icon: Home,
      bullets: ['Property Search', 'Legal Verification', 'Loan Assistance', 'Documentation'],
    },
    {
      title: 'Sell a Property',
      desc:
        'Get the best value for your property with our expert marketing and negotiation.',
      icon: TrendingUp,
      bullets: ['Market Analysis', 'Property Staging', 'Marketing', 'Negotiation'],
    },
    {
      title: 'Rent a Property',
      desc:
        'Hassle‑free rental solutions for both tenants and property owners.',
      icon: KeyRound,
      bullets: ['Tenant Screening', 'Lease Management', 'Maintenance', 'Legal Support'],
    },
    {
      title: 'Property Consultation',
      desc:
        'Expert advice on investment, valuation, and market trends to guide decisions.',
      icon: UserRound,
      bullets: ['Investment Advice', 'Valuation', 'Market Research', 'Portfolio Management'],
    },
  ];
  const [openService, setOpenService] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState(null);

  return (
    <section id="services" className="bg-[#0A0A0A] py-20 scroll-mt-24 md:scroll-mt-28">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center">
          <h2 className="h2-section text-white">
            Comprehensive Real Estate
          </h2>
          <div className="h2-section text-gold">Solutions</div>
          <Underline align="center" />
          <p className="mt-4 text-white/75 max-w-3xl mx-auto">
            From buying your first home to expanding your property portfolio, we provide end‑to‑end real estate services tailored to your needs.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CARDS.map((c, idx) => {
            const Icon = c.icon;
            return (
              <div key={idx} className="card-surface hover-glow-gold rounded-2xl p-6 flex flex-col">
                <div className="h-10 w-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-white font-semibold text-lg">{c.title}</h3>
                <p className="mt-2 text-white/70 text-sm flex-1">{c.desc}</p>
                <ul className="mt-4 space-y-2 text-sm text-white/80">
                  {c.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: 'var(--gold)' }} />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  <button onClick={() => { setSelectedService(c); setOpenService(true); }} className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10">
                    Learn More <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-14 flex justify-center">
          <div className="relative gold-panel rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl px-6 md:px-10 py-8 md:py-10 text-center max-w-3xl w-full">
            <h3 className="h3-section text-white">Ready to Get Started?</h3>
            <p className="mt-3 text-white/75">
              Let our experienced team help you navigate Pune's real estate market and achieve your property goals with confidence.
            </p>
            <div className="mt-5">
              <button onClick={() => onOpenConsultation?.()} className="gold-btn gold-shine rounded-md inline-flex items-center gap-2">
                Schedule Consultation <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={openService} onOpenChange={setOpenService}>
        <DialogContent className="gold-panel border border-white/10 text-white backdrop-blur-xl bg-white/[0.04] max-w-md w-[92%] sm:w-full p-6 sm:p-8 rounded-2xl shadow-2xl ring-1 ring-white/10">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-gold">{selectedService?.title}</DialogTitle>
            {selectedService?.desc && (
              <DialogDescription className="text-white/70">{selectedService.desc}</DialogDescription>
            )}
          </DialogHeader>
          {selectedService?.bullets && (
            <ul className="mt-4 space-y-2 text-sm text-white/85">
              {selectedService.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: 'var(--gold)' }} />
                  {b}
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <a href="#contact">
              <Button className="gold-btn gold-shine">Talk to an expert</Button>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function PropertyCard({ item, type, category, onToggleSave, saved, view = 'grid', onViewDetails, onContact }) {
  const container = `group rounded-2xl overflow-hidden card-surface hover-glow-gold transition-colors ${view === 'list' ? 'flex' : ''}`
  const imgWrap = view === 'list' ? 'relative group h-28 w-36 sm:h-32 sm:w-40 md:h-64 md:w-1/2 flex-shrink-0' : 'relative group h-56'
  const detailsWrap = view === 'list' ? 'p-4 md:p-6 flex-1 md:flex-1' : 'p-5'
  const price = type === 'sale' ? formatSalePrice(item.price) : `${currency(item.pricePerMonth)}/month`
  return (
    <div className={container}>
      <div className={imgWrap}>
        <img src={item.image} alt={item.title} loading="lazy" sizes={view === 'list' ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG.property; }} />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#D4AF37]/25 to-transparent blur-sm opacity-0 transition-opacity group-hover:opacity-70 mix-blend-screen pointer-events-none" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="rounded-full bg-[color:var(--gold)] text-black text-xs px-2 py-0.5">
            {type === 'sale' ? 'For Sale' : 'For Rent'}
          </span>
          {category && (
            <span className="rounded-full bg-white/10 border border-white/20 text-white/85 text-xs px-2 py-0.5">{category}</span>
          )}
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-[color:var(--gold)] text-black text-sm font-semibold px-3 py-1">
          {price}
        </span>
        <button onClick={() => onToggleSave(item.id)} aria-label="save" className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:text-gold hover:bg-black/80 transition-colors">
          <Heart className={`h-5 w-5 ${saved ? 'fill-current text-gold' : ''}`} />
        </button>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className={detailsWrap}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">{item.title}</h3>
        </div>
        <div className="mt-2 flex items-center gap-3 text-white/70 text-sm">
          <MapPin className="h-4 w-4" /> {item.location}
        </div>
        {item.desc && (
          <p className="mt-2 text-white/75 text-sm">{item.desc}</p>
        )}
        <div className="mt-3 flex items-center gap-4 text-white/70 text-sm">
          <span className="inline-flex items-center gap-1"><BedDouble className="h-4 w-4" /> {item.beds} Beds</span>
          <span className="inline-flex items-center gap-1"><Bath className="h-4 w-4" /> {item.baths} Baths</span>
          <span className="inline-flex items-center gap-1"><Ruler className="h-4 w-4" /> {item.area} sq ft</span>
        </div>
        {Array.isArray(item.features) && item.features.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.features.slice(0, 3).map((f, i) => (
              <span key={i} className="rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-gold px-2 py-1 text-xs">{f}</span>
            ))}
            {item.features.length > 3 && (
              <span className="rounded-md border border-white/15 bg-white/10 text-white/70 px-2 py-1 text-xs">+{item.features.length - 3} more</span>
            )}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <Button className="gold-btn gold-shine strong" onClick={() => onViewDetails?.(item)}>View Details</Button>
          <Button variant="ghost" className="text-white/70 hover:text-white" onClick={() => onContact?.(item)}>Contact</Button>
        </div>
      </div>
    </div>
  );
}

function Featured({ onOpenConsultation }) {
  const { toast } = useToast();
  const [filter, setFilter] = React.useState('all');
  const [view, setView] = React.useState('grid');
  const [limit, setLimit] = React.useState(4);
  const [openDetails, setOpenDetails] = React.useState(false);
  const [active, setActive] = React.useState(null);
  const [propertiesFromApi, setPropertiesFromApi] = React.useState([]);
  const [propertiesLoading, setPropertiesLoading] = React.useState(true);
  const [saved, setSaved] = React.useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("vespera_shortlist") || "[]"));
    } catch {
      return new Set();
    }
  });

  // Fetch properties from public API (same list admin manages)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setPropertiesLoading(true);
      try {
        const res = await PROPERTIES.GET_PUBLIC(1, 100);
        if (!cancelled && res?.data?.data) {
          setPropertiesFromApi(res.data.data.map(mapApiPropertyToCard));
        }
      } catch (_) {
        if (!cancelled) setPropertiesFromApi([]);
      } finally {
        if (!cancelled) setPropertiesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    localStorage.setItem("vespera_shortlist", JSON.stringify(Array.from(saved)));
  }, [saved]);

  // Force grid view on small screens and prevent list view on phones
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const enforceGrid = () => setView('grid');
    if (mq.matches) enforceGrid();
    const onChange = (e) => { if (e.matches) enforceGrid(); };
    if (mq.addEventListener) {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    } else {
      mq.addListener(onChange);
      return () => mq.removeListener(onChange);
    }
  }, []);

  const toggle = (id) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast({ title: "Removed from shortlist", description: "This property is no longer saved." });
      } else {
        next.add(id);
        toast({ title: "Saved to shortlist", description: "Find it later in your account (mock)." });
      }
      return next;
    });
  };

  const saleList = React.useMemo(() => propertiesFromApi.filter(p => p.type === 'sale'), [propertiesFromApi]);
  const rentList = React.useMemo(() => propertiesFromApi.filter(p => p.type === 'rent'), [propertiesFromApi]);
  const allList = React.useMemo(() => [...saleList, ...rentList], [saleList, rentList]);

  const counts = {
    all: allList.length,
    sale: saleList.length,
    rent: rentList.length,
    residential: allList.filter(p => p.category === 'Residential').length,
    commercial: allList.filter(p => p.category === 'Commercial').length,
  }

  const filtered = React.useMemo(() => {
    switch (filter) {
      case 'sale': return allList.filter(p => p.type === 'sale')
      case 'rent': return allList.filter(p => p.type === 'rent')
      case 'residential': return allList.filter(p => p.category === 'Residential')
      case 'commercial': return allList.filter(p => p.category === 'Commercial')
      default: return allList
    }
  }, [filter, allList])

  const visible = React.useMemo(() => filtered.slice(0, limit), [filtered, limit])

  const FilterBtn = ({ value, label, count }) => (
    <button onClick={() => setFilter(value)} className={`px-4 py-2 rounded-md text-sm border ${filter === value ? 'bg-[color:var(--gold)] text-black border-transparent' : 'bg-white/5 text-white/80 hover:text-white border-white/10'}`}>
      <span className="mr-2">{label}</span>
      <span className={`inline-flex items-center justify-center h-5 w-5 rounded-sm ${filter === value ? 'bg-black/20 text-black' : 'bg-white/10 text-white/80'}`}>{count}</span>
    </button>
  )

  return (
    <section id="properties" className="bg-black py-20 scroll-mt-24 md:scroll-mt-28">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center">
          <span className="inline-block text-[11px] md:text-xs px-3 py-1 rounded-full border border-white/15 bg-white/5 text-white/70 backdrop-blur-md mb-4">Featured Properties</span>
          <h2 className="h2-section text-white">Discover Premium</h2>
          <div className="h2-section text-gold">Properties in Pune</div>
          <Underline align="center" />
          <p className="mt-4 text-white/75 max-w-3xl mx-auto">Explore our handpicked selection of luxury residential and commercial properties across Pune's most sought-after locations.</p>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <FilterBtn value="all" label="All Properties" count={counts.all} />
            <FilterBtn value="sale" label="For Sale" count={counts.sale} />
            <FilterBtn value="rent" label="For Rent" count={counts.rent} />
            <FilterBtn value="residential" label="Residential" count={counts.residential} />
            <FilterBtn value="commercial" label="Commercial" count={counts.commercial} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('grid')} className={`inline-flex items-center justify-center h-9 w-10 rounded-md border ${view === 'grid' ? 'bg-[color:var(--gold)] text-black border-transparent' : 'bg-white/5 text-white/80 border-white/10'}`}><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setView('list')} className={`hidden sm:inline-flex items-center justify-center h-9 w-10 rounded-md border ${view === 'list' ? 'bg-[color:var(--gold)] text-black border-transparent' : 'bg-white/5 text-white/80 border-white/10'}`}><List className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="mt-4 text-white/60">
          {propertiesLoading ? "Loading properties…" : `Showing ${Math.min(limit, filtered.length)} of ${filtered.length} properties`}
        </div>

        {propertiesLoading ? (
          <div className="mt-8 flex justify-center py-12 text-white/60">Loading properties…</div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            No properties listed yet. Check back later or contact us for options.
          </div>
        ) : (
          <div className={view === 'grid' ? 'mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'mt-8 space-y-6'}>
            {visible.map((p) => (
              <PropertyCard
                key={p.id}
                item={p}
                type={p.type}
                category={p.category}
                onToggleSave={toggle}
                saved={saved.has(p.id)}
                view={view}
                onViewDetails={(it) => { setActive(it); setOpenDetails(true); }}
                onContact={() => smoothScrollTo('contact')}
              />
            ))}
          </div>
        )}

        {filtered.length > limit && (
          <div className="mt-8 flex justify-center">
            <button onClick={() => setLimit((prev) => prev + 6)} className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium bg-[#D4AF37]/20 text-gold border border-[#D4AF37]/40 hover:bg-[#D4AF37]/30 transition-colors">
              Load More Properties
            </button>
          </div>
        )}

        <div className="mt-12">
          <div className="relative gold-panel rounded-2xl border border-[#D4AF37]/20 bg-black/40 backdrop-blur-xl px-6 md:px-10 py-8 md:py-10 text-center max-w-4xl mx-auto">
            <h3 className="h3-section text-white">Don't See What You're Looking For?</h3>
            <p className="mt-3 text-white/75 max-w-3xl mx-auto">Our team has access to exclusive off-market properties and can help you find exactly what you're looking for in Pune's real estate market.</p>
            <div className="mt-5 flex items-center justify-center gap-4 flex-wrap">
              <Button className="gold-btn gold-shine rounded-full" onClick={() => onOpenConsultation?.({ title: 'Request Custom Search', interest: 'Buying', message: 'I would like a custom property search tailored to my preferences.' })}>Request Custom Search</Button>
              <Button className="rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15" onClick={() => onOpenConsultation?.({ title: 'Talk to an Expert', interest: 'Consultation', message: 'I want to speak with an expert about my requirements.' })}>Talk to Expert</Button>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent className="gold-panel border border-white/10 text-white backdrop-blur-xl bg-white/[0.04] max-w-2xl w-[92%] sm:w-full p-0 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
          {active && (
            <div className="grid md:grid-cols-2">
              <img src={active.image} alt={active.title} loading="lazy" className="w-full h-56 md:h-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1600585154154-7ef9d53f6cfb?auto=format&fit=crop&w=1200&q=60'; }} />
              <div className="p-6">
                <h3 className="font-serif text-xl text-gold">{active.title}</h3>
                <div className="mt-2 text-white/80 text-sm flex items-center gap-2"><MapPin className="h-4 w-4" /> {active.location}</div>
                {active.desc && <p className="mt-3 text-white/75 text-sm">{active.desc}</p>}
                <div className="mt-3 text-white/80 text-sm">
                  {active.beds != null && <div>Bedrooms: {active.beds}</div>}
                  {active.baths != null && <div>Bathrooms: {active.baths}</div>}
                  {active.area != null && <div>Area: {active.area} sq ft</div>}
                </div>
                {Array.isArray(active.features) && active.features.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {active.features.map((f, i) => (
                      <span key={i} className="rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-gold px-2 py-1 text-xs">{f}</span>
                    ))}
                  </div>
                )}
                <div className="mt-5 flex items-center gap-3">
                  <Button className="gold-btn gold-shine" onClick={() => { setOpenDetails(false); smoothScrollTo('contact'); }}>Contact</Button>
                  <Button variant="ghost" className="text-white/70 hover:text-white" onClick={() => setOpenDetails(false)}>Close</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function WhyChooseUs() {
  return (
    <section className="bg-[#0A0A0A] py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center">
          <span className="inline-block text-[11px] md:text-xs px-3 py-1 rounded-full border border-white/15 bg-white/5 text-white/70 backdrop-blur-md mb-4">Why Choose {BRAND.name}</span>
          <h2 className="h2-section text-white">Your Trusted Partner in</h2>
          <div className="h2-section text-gold">Real Estate Excellence</div>
          <Underline align="center" />
          <p className="mt-4 text-white/75 max-w-3xl mx-auto">Experience the difference with our commitment to transparency, expertise, and personalized service that sets us apart in Pune's real estate market.</p>
        </div>
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_US.map((w) => {
            const Icon = ICONS[w.icon] || Star;
            return (
              <div key={w.id} className="rounded-2xl p-6 card-surface hover-glow-gold transition-colors">
                <div className="h-10 w-10 rounded-md bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-gold mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-white font-medium">{w.title}</h3>
                <p className="mt-2 text-white/70 text-sm leading-relaxed">{w.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const TESTIMONIALS = [
    {
      quote:
        "Vespera Estates helped me find the perfect villa in Koregaon Park. Their transparency and expertise made the entire process smooth and stress‑free.",
      name: "Rajesh Sharma",
      role: "Property Investor",
      avatar: "https://i.pravatar.cc/80?img=12",
    },
    {
      quote:
        "The team at Vespera Estates went above and beyond to help us find our dream home. Their local knowledge of Pune market is exceptional.",
      name: "John Smith",
      role: "Home Buyer",
      avatar: "https://i.pravatar.cc/80?img=8",
    },
    {
      quote:
        "Excellent service for commercial property transactions. Vespera Estates made finding the right office space effortless with their professional approach.",
      name: "Amit Desai",
      role: "Commercial Client",
      avatar: "/assets/TestimonialImage3.jpeg",
    },
  ];
  return (
    <section className="bg-black py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center">
          <h2 className="h2-section text-white">What Our <span className="text-gold">Clients Say</span></h2>
          <Underline align="center" />
        </div>
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div key={idx} className="rounded-2xl p-6 card-surface hover-glow-gold transition-colors">
              <div className="flex items-center gap-1 text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 italic text-white/80 leading-relaxed">“{t.quote}”</p>
              <div className="mt-6 flex items-center gap-3">
                <img src={t.avatar} alt={t.name} loading="lazy" className="h-10 w-10 rounded-full ring-1 ring-white/20 object-cover" />
                <div className="text-sm">
                  <div className="text-white font-medium">{t.name}</div>
                  <div className="text-gold text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-[#D4AF37]/25 bg-[#0A0A0A] p-6 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-gold text-3xl md:text-4xl font-extrabold"><CountUp end={500} suffix="+" className="inline" /></div>
              <div className="text-white/70 text-sm">Properties Sold</div>
            </div>
            <div className="text-center">
              <div className="text-gold text-3xl md:text-4xl font-extrabold"><CountUp end={1200} suffix="+" className="inline" /></div>
              <div className="text-white/70 text-sm">Happy Clients</div>
            </div>
            <div className="text-center">
              <div className="text-gold text-3xl md:text-4xl font-extrabold"><CountUp end={15} suffix="+" className="inline" /></div>
              <div className="text-white/70 text-sm">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-gold text-3xl md:text-4xl font-extrabold"><CountUp end={100} suffix="%" className="inline" /></div>
              <div className="text-white/70 text-sm">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactSection({ onOpenConsultation }) {
  const { toast } = useToast();

  // ✅ Country code mapping (same as ConsultationModal)
  const getCountryCode = (num) => {
    if (num.startsWith('1')) return '+1'; // USA/Canada
    if (num.startsWith('44')) return '+44'; // UK
    if (num.startsWith('61')) return '+61'; // Australia
    if (num.startsWith('65')) return '+65'; // Singapore
    if (num.startsWith('971')) return '+971'; // UAE
    return '+91'; // default India
  };

  // ✅ Form submit logic (same as ConsultationModal)
  const onSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const full_name = data.get('full');
    const email = data.get('email');
    let phone = data.get('phone');
    const interest = data.get('interest');
    const message = data.get('message');

    if (!full_name || !email) {
      toast({
        title: 'Error',
        description: 'Full name and email are required.',
        variant: 'destructive',
      });
      return;
    }

    // ✅ Normalize phone number before sending
    let clean = phone.replace(/\D/g, '');
    const code = getCountryCode(clean);
    clean = clean.replace(/^91|^1|^44|^61|^65|^971/, '');
    const finalPhone = code + clean;

    try {
      const res = await fetch('http://localhost:5174/api/userDetails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name,
          email,
          phone: finalPhone,
          interest,
          message,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit form');

      const result = await res.json();

      toast({
        title: 'Success!',
        description: result.message || 'Your message has been sent successfully.',
      });

      e.target.reset();
    } catch (err) {
      console.error('❌ Error submitting form:', err);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <section id="contact" className="bg-[#0A0A0A] py-20 scroll-mt-24 md:scroll-mt-28">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center">
          <span className="inline-block text-[11px] md:text-xs px-3 py-1 rounded-full border border-white/15 bg-white/5 text-white/70 backdrop-blur-md mb-4">
            Get In Touch
          </span>
          <h2 className="h2-section text-white">Let's Find Your</h2>
          <div className="h2-section text-gold">Dream Property</div>
          <Underline align="center" />
          <p className="mt-4 text-white/75 max-w-3xl mx-auto">
            Ready to take the next step? Our expert team is here to guide you through every aspect of your real estate journey in Pune.
          </p>
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-6 items-start">
          {/* ✅ Contact form section */}
          <div className="rounded-2xl border border-white/10 bg-[#0B0B0B] p-6 md:p-8">
            <h3 className="h3-section text-white">Send Us a Message</h3>
            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="full">Full Name</Label>
                  <Input
                    id="full"
                    name="full"
                    required
                    placeholder="Enter your full name"
                    className="bg-black/40 border-white/15 text-white"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email2">Email Address</Label>
                  <Input
                    id="email2"
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    className="bg-black/40 border-white/15 text-white"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="+91 98/65 43210"
                    className="bg-black/40 border-white/15 text-white"
                    onChange={(e) => {
                      let input = e.target.value.replace(/\D/g, '');
                      const code = getCountryCode(input);
                      input = input.replace(/^91|^1|^44|^61|^65|^971/, '');
                      input = input.slice(0, 10);

                      let formatted = code;
                      if (input.length > 0) {
                        formatted += ' ';
                        if (input.length > 5) {
                          formatted += input.slice(0, 5) + ' ' + input.slice(5);
                        } else {
                          formatted += input;
                        }
                      }

                      e.target.value = formatted;
                    }}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="interest">Property Interest</Label>
                  <select
                    id="interest"
                    name="interest"
                    className="bg-black/40 border border-white/15 text-white rounded-md h-10 px-3"
                  >
                    <option>Buying</option>
                    <option>Selling</option>
                    <option>Renting</option>
                    <option>Consultation</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder="Tell us about your property requirements..."
                  className="bg-black/40 border border-white/15 text-white rounded-md p-3"
                />
              </div>

              <Button
                type="submit"
                className="gold-btn gold-shine rounded-full w-full inline-flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" /> Send Message
              </Button>
            </form>
          </div>

          {/* ✅ Contact info panel (unchanged) */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#0B0B0B] p-6 md:p-8">
              <h3 className="h3-section text-white">Get in Touch</h3>
              <div className="mt-6 space-y-5">
                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="text-sm text-white/80">
                    <div className="text-white">Call Us</div>
                    <div>
                      <a
                        href="tel:+919876543210"
                        aria-label="Call +91 98765 43210"
                        className="hover:text-gold hover:underline underline-offset-2"
                      >
                        +91 98765 43210
                      </a>
                    </div>
                    <div>
                      <a
                        href="tel:+91865432109"
                        aria-label="Call +91 8/654 32109"
                        className="hover:text-gold hover:underline underline-offset-2"
                      >
                        +91 8/654 32109
                      </a>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="text-sm text-white/80">
                    <div className="text-white">Email Us</div>
                    <div>
                      <a
                        href="mailto:info@vesperaestates.com"
                        className="hover:text-gold hover:underline underline-offset-2"
                      >
                        info@vesperaestates.com
                      </a>
                    </div>
                    <div>
                      <a
                        href="mailto:sales@vesperaestates.com"
                        className="hover:text-gold hover:underline underline-offset-2"
                      >
                        sales@vesperaestates.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="text-sm text-white/80">
                    <div className="text-white">Visit Us</div>
                    <a
                      href="https://www.google.com/maps?q=123%20ABC%20Complex%2C%20Koregaon%20Park%2C%20Pune%2C%20Maharashtra%20411001"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-gold hover:underline underline-offset-2"
                    >
                      <div>123 ABC Complex, Koregaon Park</div>
                      <div>Pune, Maharashtra 411001</div>
                    </a>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold flex items-center justify-center">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="text-sm text-white/80">
                    <div className="text-white">Office Hours</div>
                    <div>Monday – Saturday: 9:00 AM – 7:00 PM</div>
                    <div>Sunday: 10:00 AM – 5:00 PM</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative gold-panel rounded-2xl border border-[#D4AF37]/20 bg-black/40 backdrop-blur-xl p-6">
              <h4 className="text-white font-semibold">Ready to Get Started?</h4>
              <p className="mt-2 text-white/75">
                Schedule a free consultation with our property experts and discover the luxury you deserve in life.
              </p>
              <div className="mt-4">
                <Button
                  className="gold-btn gold-shine rounded-full"
                  onClick={() => onOpenConsultation?.()}
                >
                  Schedule Consultation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function CalloutCTA({ onOpenConsultation }) {
  return (
    <section id="work" className="relative py-20 bg-black scroll-mt-24 md:scroll-mt-28">
      <div className="absolute inset-0" style={{
        background:
          "radial-gradient(800px 300px at 50% 0%, rgba(200,170,110,0.12), transparent 60%)",
      }} />
      <div className="relative max-w-5xl mx-auto px-4 md:px-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 md:p-12">
          <h3 className="h3-section text-gold">{BRAND.tagline}</h3>
          <Underline align="left" className="mt-3" />
          <p className="mt-3 text-white/75 max-w-2xl">
            Partner with our expert advisors for a discreet, high-touch experience that delivers results.
          </p>
          <div className="mt-6">
            <Button className="gold-btn gold-shine" onClick={() => onOpenConsultation?.({ title: 'Work With Us', interest: 'Consultation' })}>Work With Us</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQs() {
  const mid = Math.ceil(FAQS.length / 2);
  const left = FAQS.slice(0, mid);
  const right = FAQS.slice(mid);
  return (
    <section className="bg-[#0A0A0A] py-20">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <h2 className="section-title">FAQs</h2>
        <Underline align="center" />
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <Accordion type="single" collapsible>
            {left.map((f, idx) => (
              <AccordionItem key={idx} value={`left-${idx}`} className="border-b border-white/10">
                <AccordionTrigger className="text-left text-white hover:text-gold transition-colors">{f.q}</AccordionTrigger>
                <AccordionContent className="text-white/70">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <Accordion type="single" collapsible>
            {right.map((f, idx) => (
              <AccordionItem key={idx} value={`right-${idx}`} className="border-b border-white/10">
                <AccordionTrigger className="text-left text-white hover:text-gold transition-colors">{f.q}</AccordionTrigger>
                <AccordionContent className="text-white/70">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="text-[13px] tracking-[0.25em] text-white">{BRAND.name}</div>
          <p className="mt-3 text-white/60 max-w-sm">Premium, transparent real estate services for Pune's discerning buyers and sellers.</p>
        </div>
        <div className="text-white/80 grid grid-cols-2 gap-2">
          <a href="#home" className="footer-link">Home</a>
          <a href="#about" className="footer-link">About</a>
          <a href="#services" className="footer-link">Services</a>
          <a href="#properties" className="footer-link">Properties</a>
          <a href="#work" className="footer-link">Work With Us</a>
        </div>
        <div className="text-white/60">
          © {new Date().getFullYear()} Vespera Estates. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const [openLogin, setOpenLogin] = React.useState(false);
  const [openConsult, setOpenConsult] = React.useState(false);
  const [consultDefaults, setConsultDefaults] = React.useState({});

  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Enable smooth scrolling for all in-page anchor links like #about, #services, etc.
  React.useEffect(() => {
    const cleanup = interceptAnchorClicks();
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader authMode="public" onLogin={() => setOpenLogin(true)} />
      <main>
        <Hero />
        <About />
        <Services onOpenConsultation={(d) => { setConsultDefaults(d || {}); setOpenConsult(true); }} />
        <Featured onOpenConsultation={(d) => { setConsultDefaults(d || {}); setOpenConsult(true); }} />
        <WhyChooseUs />
        <Testimonials />
        <ContactSection onOpenConsultation={(d) => { setConsultDefaults(d || {}); setOpenConsult(true); }} />
        <CalloutCTA onOpenConsultation={(d) => { setConsultDefaults(d || {}); setOpenConsult(true); }} />
        <FAQs />
      </main>
      <SiteFooter />
      <LoginModal open={openLogin} setOpen={setOpenLogin} />
      <ConsultationModal open={openConsult} setOpen={setOpenConsult} defaults={consultDefaults} />
    </div>
  );
}
