export function getDashboardRouteForRole(role?: string, roles?: string[]): string {
    const primary = role || (roles && roles[0]) || 'student';

    if (['super_admin', 'admin', 'president', 'vice_president'].includes(primary)) {
        return '/admin/community/dashboard';
    }
    if (primary === 'student') return '/learn';
    if (primary === 'instructor' || primary === 'mentor') return '/instructor/dashboard';
    if (primary === 'hr') return '/dashboard/hr/onboarding';
    if (primary === 'pr') return '/dashboard/pr';
    if (
        ['committee_leader', 'vice_committee_leader', 'member', 'technical', 'media', 'marketing'].includes(primary)
    ) {
        return '/dashboard/committee';
    }
    return '/dashboard';
}
