// ============================================================================
// Dashboard Page
// Main authenticated user dashboard
// ============================================================================

import { Link } from 'react-router-dom';
import {
  Activity,
  CreditCard,
  FileText,
  Settings,
  Shield,
  Users,
  ArrowUpRight,
  Clock,
} from 'lucide-react';

import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

import { useAuth, useUser } from '@/hooks';
import { ROUTES } from '@/lib/constants';
import { getInitials, formatRelativeTime } from '@/lib/utils';

// Quick action cards
const quickActions = [
  {
    title: 'Account Settings',
    description: 'Update your profile and preferences',
    icon: Settings,
    href: ROUTES.SETTINGS,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: 'Security',
    description: 'Review security settings and activity',
    icon: Shield,
    href: ROUTES.SETTINGS + '?tab=security',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    title: 'API Keys',
    description: 'Manage your API keys and tokens',
    icon: FileText,
    href: '/api-keys',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    title: 'Team',
    description: 'Invite and manage team members',
    icon: Users,
    href: '/team',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
];

// Stats cards data
const stats = [
  {
    title: 'Active Projects',
    value: '12',
    change: '+2 this month',
    icon: Activity,
  },
  {
    title: 'API Calls',
    value: '45.2K',
    change: '+12% from last week',
    icon: ArrowUpRight,
  },
  {
    title: 'Storage Used',
    value: '2.4 GB',
    change: '60% of quota',
    icon: CreditCard,
  },
];

export function Dashboard() {
  const { user } = useAuth();
  const { profile, loading } = useUser();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {loading ? (
              <Skeleton className="h-16 w-16 rounded-full" />
            ) : (
              <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  {getInitials(profile?.display_name || user?.email || 'U')}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              {loading ? (
                <>
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    Welcome back, {profile?.display_name || 'there'}!
                  </h1>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Last seen{' '}
                    {profile?.last_seen_at
                      ? formatRelativeTime(profile.last_seen_at)
                      : 'just now'}
                  </p>
                </>
              )}
            </div>
          </div>

          <Button asChild>
            <Link to={ROUTES.SETTINGS}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.href}>
                <Card className="h-full hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-6">
                    <div
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 ${action.bgColor}`}
                    >
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity to show</p>
              <p className="text-sm mt-1">
                Your activity will appear here as you use the app
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Complete Your Profile
                </h3>
                <p className="text-muted-foreground">
                  Add more details to your profile to get the most out of{' '}
                  SecureSaaS.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to={ROUTES.SETTINGS}>
                  Complete Profile
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
