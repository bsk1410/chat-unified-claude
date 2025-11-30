// ============================================================================
// Landing Page
// Beautiful hero landing page with features and CTA
// ============================================================================

import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Database,
  FileText,
  Zap,
  Check,
  ArrowRight,
  Github,
  Star,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LandingLayout } from '@/components/layout';
import { ROUTES, APP } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Feature data
const features = [
  {
    icon: Shield,
    title: 'Row Level Security',
    description:
      'Built-in RLS policies ensure users can only access their own data. No accidental data leaks.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Lock,
    title: 'Secure Authentication',
    description:
      'Email/password, OAuth, and magic links with proper session management and token refresh.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Database,
    title: 'Audit Logging',
    description:
      'Immutable audit trail for all data changes. Know who did what and when.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: FileText,
    title: 'Secure File Storage',
    description:
      'User-scoped file storage with signed URLs. Files are automatically protected.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: Zap,
    title: 'Type-Safe Queries',
    description:
      'Auto-generated TypeScript types from your database schema. Catch errors at compile time.',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    icon: Check,
    title: 'Security Checklist',
    description:
      'Pre-launch security checklist ensures you don\'t miss critical security configurations.',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
];

// Tech stack
const techStack = [
  { name: 'React', logo: '⚛️' },
  { name: 'TypeScript', logo: '📘' },
  { name: 'Supabase', logo: '⚡' },
  { name: 'Tailwind', logo: '🎨' },
  { name: 'Vite', logo: '⚡' },
  { name: 'Zod', logo: '✅' },
];

export function Landing() {
  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-l from-blue-500/20 to-primary/20 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="container py-24 md:py-32 lg:py-40">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-muted/50 border rounded-full px-4 py-1.5 text-sm font-medium">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span>Open Source & Free</span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                Star on GitHub
                <Github className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Build Secure SaaS Apps{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                Without the Headache
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              A production-ready starter kit with Supabase, React, and TypeScript.
              Authentication, row-level security, audit logging, and more — all pre-configured.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="xl" className="group">
                <Link to={ROUTES.SIGNUP}>
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </a>
              </Button>
            </div>

            {/* Tech Stack */}
            <div className="pt-8">
              <p className="text-sm text-muted-foreground mb-4">Built with</p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                {techStack.map((tech) => (
                  <div
                    key={tech.name}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="text-lg">{tech.logo}</span>
                    <span>{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Security Built-In, Not Bolted-On
            </h2>
            <p className="text-lg text-muted-foreground">
              Stop worrying about security fundamentals. Start shipping features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group hover:shadow-lg transition-all duration-300 border-transparent hover:border-primary/20"
              >
                <CardContent className="p-6">
                  <div
                    className={cn(
                      'inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4',
                      feature.bgColor
                    )}
                  >
                    <feature.icon className={cn('h-6 w-6', feature.color)} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Code Preview Section */}
      <section className="py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Add Security in One Line
              </h2>
              <p className="text-lg text-muted-foreground">
                Our helper functions make it trivial to add row-level security,
                audit logging, and soft delete to any table.
              </p>
              <ul className="space-y-3">
                {[
                  'Auto-generated RLS policies',
                  'Audit triggers for change tracking',
                  'Soft delete pattern built-in',
                  'Updated_at timestamp automation',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/10">
                      <Check className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline">
                <Link to={ROUTES.SIGNUP}>
                  Try It Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Code Block */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-2xl opacity-30 rounded-3xl" />
              <div className="relative bg-zinc-950 rounded-2xl p-6 overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <pre className="text-sm text-zinc-300 overflow-x-auto">
                  <code>{`-- Add security to any table in 3 lines
SELECT apply_standard_rls('your_table');
SELECT apply_updated_at_trigger('your_table');
SELECT apply_audit_trigger('your_table');

-- That's it! Your table now has:
-- ✓ Row-level security policies
-- ✓ Auto-updating timestamps
-- ✓ Full audit logging`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-purple-600 p-8 md:p-12 lg:p-16">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Ship Secure?
              </h2>
              <p className="text-lg text-white/80 mb-8">
                Join developers who trust {APP.NAME} for their security foundation.
                It's free, open source, and ready for production.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  asChild
                  size="xl"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <Link to={ROUTES.SIGNUP}>
                    Start Building Today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}

export default Landing;
