import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, TokenPayload } from './auth';

export const PERMISSIONS = {
    CREATE_COMMITTEE: 'create_committee',
    EDIT_COMMITTEE: 'edit_committee',
    DELETE_COMMITTEE: 'delete_committee',
    ASSIGN_LEADER: 'assign_leader',
    ASSIGN_VICE_LEADER: 'assign_vice_leader',

    CREATE_EVENT: 'create_event',
    EDIT_EVENT: 'edit_event',
    DELETE_EVENT: 'delete_event',

    MANAGE_TRACKS: 'manage_tracks',
    MANAGE_INSTRUCTORS: 'manage_instructors',
    MANAGE_PARTNER_LEADS: 'manage_partner_leads',

    MANAGE_APPLICATIONS: 'manage_applications',
    MANAGE_MEMBERS: 'manage_members',
    MANAGE_TASKS: 'manage_tasks',
    MANAGE_INTERVIEWS: 'manage_interviews',
    MANAGE_CERTIFICATES: 'manage_certificates',
    MANAGE_GALLERY: 'manage_gallery',
    MANAGE_NEWS: 'manage_news',
    MANAGE_WEBSITE: 'manage_website',
    MANAGE_USERS: 'manage_users',
    MANAGE_RECRUITMENTS: 'manage_recruitments',
    MANAGE_ANNOUNCEMENTS: 'manage_announcements',
    MANAGE_AWARDS: 'manage_awards',
    MANAGE_BADGES: 'manage_badges',
    VIEW_LOGS: 'view_logs',
    MANAGE_PERMISSIONS: 'manage_permissions',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    super_admin: Object.values(PERMISSIONS) as Permission[],
    admin: [
        PERMISSIONS.CREATE_COMMITTEE,
        PERMISSIONS.EDIT_COMMITTEE,
        PERMISSIONS.DELETE_COMMITTEE,
        PERMISSIONS.ASSIGN_LEADER,
        PERMISSIONS.ASSIGN_VICE_LEADER,
        PERMISSIONS.CREATE_EVENT,
        PERMISSIONS.EDIT_EVENT,
        PERMISSIONS.DELETE_EVENT,
        PERMISSIONS.MANAGE_TRACKS,
        PERMISSIONS.MANAGE_INSTRUCTORS,
        PERMISSIONS.MANAGE_PARTNER_LEADS,
        PERMISSIONS.MANAGE_APPLICATIONS,
        PERMISSIONS.MANAGE_MEMBERS,
        PERMISSIONS.MANAGE_TASKS,
        PERMISSIONS.MANAGE_INTERVIEWS,
        PERMISSIONS.MANAGE_CERTIFICATES,
        PERMISSIONS.MANAGE_GALLERY,
        PERMISSIONS.MANAGE_NEWS,
        PERMISSIONS.MANAGE_WEBSITE,
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.MANAGE_RECRUITMENTS,
        PERMISSIONS.MANAGE_ANNOUNCEMENTS,
        PERMISSIONS.MANAGE_AWARDS,
        PERMISSIONS.MANAGE_BADGES,
        PERMISSIONS.VIEW_LOGS,
    ],
    president: [
        PERMISSIONS.MANAGE_MEMBERS,
        PERMISSIONS.MANAGE_TASKS,
        PERMISSIONS.MANAGE_ANNOUNCEMENTS,
        PERMISSIONS.MANAGE_TRACKS,
        PERMISSIONS.MANAGE_INSTRUCTORS,
        PERMISSIONS.CREATE_EVENT,
        PERMISSIONS.EDIT_EVENT,
    ],
    vice_president: [
        PERMISSIONS.MANAGE_MEMBERS,
        PERMISSIONS.MANAGE_TASKS,
        PERMISSIONS.MANAGE_ANNOUNCEMENTS,
    ],
    committee_leader: [
        PERMISSIONS.MANAGE_TASKS,
        PERMISSIONS.MANAGE_MEMBERS,
    ],
    vice_committee_leader: [
        PERMISSIONS.MANAGE_TASKS,
    ],
    hr: [
        PERMISSIONS.MANAGE_MEMBERS,
        PERMISSIONS.MANAGE_TASKS,
    ],
    pr: [
        PERMISSIONS.MANAGE_PARTNER_LEADS,
        PERMISSIONS.MANAGE_ANNOUNCEMENTS,
    ],
    media: [
        PERMISSIONS.MANAGE_GALLERY,
    ],
    marketing: [
        PERMISSIONS.MANAGE_ANNOUNCEMENTS,
    ],
    technical: [],
    instructor: [],
    mentor: [],
    committee_applicant: [],
    member: [],
    student: [],
};

export function userHasRole(
    user: { role?: string; roles?: string[] } | null | undefined,
    targetRole: string
): boolean {
    if (!user) return false;
    if (user.role === targetRole) return true;
    return Array.isArray(user.roles) && user.roles.includes(targetRole);
}

export function userHasAnyRole(
    user: { role?: string; roles?: string[] } | null | undefined,
    targetRoles: string[]
): boolean {
    return targetRoles.some((r) => userHasRole(user, r));
}

export function hasPermission(
    userRole: string,
    userPermissions: string[],
    permission: Permission,
    userRoles?: string[]
): boolean {
    const allRoles = [userRole, ...(userRoles || [])].filter(Boolean);
    if (allRoles.includes('super_admin')) return true;
    if (userPermissions && userPermissions.includes(permission)) return true;
    return allRoles.some((r) => (ROLE_PERMISSIONS[r] || []).includes(permission));
}

export function withPermission(permission: Permission) {
    return async function checkPermission(
        req: NextRequest,
        handler: (req: NextRequest, user: TokenPayload) => Promise<NextResponse>
    ): Promise<NextResponse> {
        const user = await authenticateRequest(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userPerms = user.permissions || [];
        if (!hasPermission(user.role, userPerms, permission, user.roles)) {
            return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 });
        }

        return handler(req, user);
    };
}

export function isAdminRole(role?: string, roles?: string[]): boolean {
    const allRoles = [role, ...(roles || [])].filter((r): r is string => Boolean(r));
    return allRoles.some((r) => ['super_admin', 'admin', 'president', 'vice_president'].includes(r));
}

export function canManageCommittee(user: TokenPayload, committeeId: string): boolean {
    if (isAdminRole(user.role, user.roles)) return true;
    if (
        userHasAnyRole(user, ['committee_leader', 'vice_committee_leader']) &&
        user.committeeId &&
        user.committeeId === committeeId
    ) {
        return true;
    }
    return false;
}

export function canAccessCommittee(user: TokenPayload, committeeId: string): boolean {
    if (isAdminRole(user.role, user.roles)) return true;
    if (user.committeeId && user.committeeId === committeeId) {
        return true;
    }
    return false;
}

export { getDashboardRouteForRole } from './roleRoutes';
