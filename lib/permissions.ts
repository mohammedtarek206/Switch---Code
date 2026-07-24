import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

// ─── All available permissions ──────────────────────────────────────────────
export const PERMISSIONS = {
    // Committees
    CREATE_COMMITTEE: 'create_committee',
    EDIT_COMMITTEE: 'edit_committee',
    DELETE_COMMITTEE: 'delete_committee',
    ASSIGN_LEADER: 'assign_leader',
    ASSIGN_VICE_LEADER: 'assign_vice_leader',

    // Events
    CREATE_EVENT: 'create_event',
    EDIT_EVENT: 'edit_event',
    DELETE_EVENT: 'delete_event',

    // Management
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

// ─── Role → default permissions mapping ─────────────────────────────────────
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
    ],
    vice_president: [
        PERMISSIONS.MANAGE_MEMBERS,
        PERMISSIONS.MANAGE_TASKS,
    ],
    committee_leader: [
        PERMISSIONS.MANAGE_TASKS,
        PERMISSIONS.MANAGE_MEMBERS,
    ],
    vice_committee_leader: [
        PERMISSIONS.MANAGE_TASKS,
    ],
    hr: [PERMISSIONS.MANAGE_APPLICATIONS, PERMISSIONS.MANAGE_INTERVIEWS],
    member: [],
    student: [],
};

// ─── Check if a user has a specific permission ───────────────────────────────
export function hasPermission(
    userRole: string,
    userPermissions: string[],
    permission: Permission
): boolean {
    // super_admin always has all permissions
    if (userRole === 'super_admin') return true;
    // Check explicit permissions array first
    if (userPermissions && userPermissions.includes(permission)) return true;
    // Fall back to role default permissions
    const rolePerms = ROLE_PERMISSIONS[userRole] || [];
    return rolePerms.includes(permission);
}

// ─── Middleware helper for API routes ────────────────────────────────────────
export function withPermission(permission: Permission) {
    return async function checkPermission(
        req: NextRequest,
        handler: (req: NextRequest, user: { userId: string; role: string; email?: string; permissions?: string[] }) => Promise<NextResponse>
    ): Promise<NextResponse> {
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userPerms = (payload as { userId: string; role: string; email?: string; permissions?: string[] }).permissions || [];
        if (!hasPermission(payload.role, userPerms, permission)) {
            return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 });
        }

        return handler(req, payload as { userId: string; role: string; email?: string; permissions?: string[] });
    };
}

// ─── Simple admin check for non-community APIs ───────────────────────────────
export function isAdminRole(role: string): boolean {
    return ['super_admin', 'admin', 'president', 'vice_president'].includes(role);
}
