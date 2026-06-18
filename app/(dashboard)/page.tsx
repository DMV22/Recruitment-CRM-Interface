// app/(dashboard)/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Building2, Briefcase, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <span className="font-semibold text-sm">Recruitment CRM</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center space-y-6">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Manage your entire<br />
          <span className="text-primary">recruitment pipeline</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          One interface for your clients, vacancies, candidates and submissions.
          Built for recruitment agencies that move fast.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button size="lg" asChild>
            <Link href="/sign-up">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: Building2,
              title: 'Manage Clients',
              description: 'Track your client companies, contacts, and assigned job orders in one place.',
            },
            {
              icon: Briefcase,
              title: 'Track Vacancies',
              description: 'Manage open roles by priority, deadline and recruiter — see where each job stands.',
            },
            {
              icon: Users,
              title: 'Build Candidate Pipeline',
              description: 'Submit candidates to vacancies and track every stage from sourcing to hire.',
            },
          ].map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-lg border border-border p-6 space-y-3">
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-10">
          <h2 className="text-2xl font-bold text-center">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { step: '01', title: 'Add Job Order', description: 'Create a vacancy linked to a client with role details, stack and priority.' },
              { step: '02', title: 'Submit Candidates', description: 'Match candidates to open vacancies and submit them with one click.' },
              { step: '03', title: 'Track to Hire', description: 'Move candidates through pipeline stages and log every action automatically.' },
            ].map(({ step, title, description }) => (
              <div key={step} className="space-y-3">
                <span className="text-3xl font-bold text-primary/30">{step}</span>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>Recruitment CRM</span>
          <div className="flex gap-4">
            <Link href="/sign-in" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/sign-up" className="hover:text-foreground transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}