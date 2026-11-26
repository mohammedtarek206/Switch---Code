import connectDB from './mongodb';
import Committee from '@/models/Committee';
import LMSTrack from '@/models/LMSTrack';

export const DEFAULT_COMMITTEES = [
    {
        name: 'HR Committee',
        slug: 'hr-committee',
        description: 'الموارد البشرية، التقديم، المقابلات، متابعة الأعضاء، وتقييم الأداء.',
        type: 'non_technical' as const,
        icon: 'FiUsers',
        color: '#3B82F6',
    },
    {
        name: 'PR & Partnerships Committee',
        slug: 'pr-partnerships-committee',
        description: 'العلاقات العامة، التواصل مع الشركات والجامعات والمجتمعات، وإدارة الشراكات.',
        type: 'non_technical' as const,
        icon: 'FiBriefcase',
        color: '#8B5CF6',
    },
    {
        name: 'Operations Committee',
        slug: 'operations-committee',
        description: 'تنظيم الفعاليات، إدارة المهام التشغيلية، والمتابعة والتنفيذ.',
        type: 'non_technical' as const,
        icon: 'FiSettings',
        color: '#10B981',
    },
    {
        name: 'Media & Design Committee',
        slug: 'media-design-committee',
        description: 'التصميمات، التصوير، الفيديو، الهوية البصرية، وتغطية الفعاليات.',
        type: 'non_technical' as const,
        icon: 'FiImage',
        color: '#EC4899',
    },
    {
        name: 'Marketing & Content Committee',
        slug: 'marketing-content-committee',
        description: 'التسويق، كتابة المحتوى، وإدارة الحملات والمنشورات.',
        type: 'non_technical' as const,
        icon: 'FiTrendingUp',
        color: '#F97316',
    },
    {
        name: 'Technical Committee',
        slug: 'technical-committee',
        description: 'البرمجة، تطوير المنصة، والمشروعات والحلول التقنية.',
        type: 'technical' as const,
        icon: 'FiCpu',
        color: '#2563EB',
    },
    {
        name: 'Education & Training Committee',
        slug: 'education-training-committee',
        description: 'تنظيم البرامج التعليمية، تنسيق المحاضرين، ومتابعة المسارات التعليمية.',
        type: 'technical' as const,
        icon: 'FiBookOpen',
        color: '#06B6D4',
    },
    {
        name: 'Community Management Committee',
        slug: 'community-management-committee',
        description: 'إدارة المجتمع والتفاعل مع الأعضاء ومتابعة التجربة العامة.',
        type: 'non_technical' as const,
        icon: 'FiMessageSquare',
        color: '#6366F1',
    },
    {
        name: 'Logistics Committee',
        slug: 'logistics-committee',
        description: 'التجهيزات، المكان، الأدوات، الحضور، والمواصلات الخاصة بالفعاليات.',
        type: 'non_technical' as const,
        icon: 'FiTruck',
        color: '#EAB308',
    },
    {
        name: 'Quality & Follow-up Committee',
        slug: 'quality-follow-up-committee',
        description: 'متابعة جودة التنفيذ، الالتزام بالمواعيد، والتقارير.',
        type: 'non_technical' as const,
        icon: 'FiCheckCircle',
        color: '#14B8A6',
    },
];

export const DEFAULT_TRACKS = [
    { name: 'Front-End Development', category: 'Web Development', description: 'HTML, CSS, JavaScript, React, Next.js & Modern UI Engineering.', level: 'Beginner' as const, duration: '12 Weeks' },
    { name: 'Back-End Development', category: 'Web Development', description: 'Node.js, Express, NestJS, Databases, APIs & System Architecture.', level: 'Intermediate' as const, duration: '12 Weeks' },
    { name: 'Full-Stack Development', category: 'Web Development', description: 'End-to-end web engineering with TypeScript, Next.js, and MongoDB/SQL.', level: 'Intermediate' as const, duration: '16 Weeks' },
    { name: 'Cybersecurity', category: 'Security', description: 'Network security, web exploitation, ethical hacking, and defensive practices.', level: 'Intermediate' as const, duration: '12 Weeks' },
    { name: 'Artificial Intelligence', category: 'AI & Data', description: 'Foundations of AI, search, reasoning, LLMs, and intelligent agents.', level: 'Intermediate' as const, duration: '14 Weeks' },
    { name: 'Machine Learning', category: 'AI & Data', description: 'Supervised & unsupervised learning, deep learning, and model evaluation.', level: 'Intermediate' as const, duration: '14 Weeks' },
    { name: 'Data Analysis', category: 'AI & Data', description: 'Excel, SQL, Python, Pandas, and data storytelling & dashboards.', level: 'Beginner' as const, duration: '10 Weeks' },
    { name: 'Data Science', category: 'AI & Data', description: 'Statistics, feature engineering, predictive modeling, and big data.', level: 'Intermediate' as const, duration: '14 Weeks' },
    { name: 'Mobile App Development', category: 'Mobile', description: 'Cross-platform mobile development with Flutter / React Native.', level: 'Beginner' as const, duration: '12 Weeks' },
    { name: 'Problem Solving', category: 'Algorithms', description: 'Data structures, algorithms, competitive programming, and interview prep.', level: 'Beginner' as const, duration: '12 Weeks' },
];

/**
 * Idempotently ensures default committees and tracks exist without overwriting
 * or deleting any existing records in the database.
 */
export async function ensureDefaultsSeeded(): Promise<{ committeesAdded: number; tracksAdded: number }> {
    await connectDB();
    let committeesAdded = 0;
    let tracksAdded = 0;

    for (const c of DEFAULT_COMMITTEES) {
        const exists = await Committee.findOne({
            $or: [{ slug: c.slug }, { name: c.name }],
        }).select('_id').lean();
        if (!exists) {
            await Committee.create({ ...c, isActive: true });
            committeesAdded++;
        }
    }

    for (let i = 0; i < DEFAULT_TRACKS.length; i++) {
        const t = DEFAULT_TRACKS[i];
        const exists = await LMSTrack.findOne({ name: t.name }).select('_id').lean();
        if (!exists) {
            await LMSTrack.create({ ...t, status: 'active', sortOrder: i + 1 });
            tracksAdded++;
        }
    }

    return { committeesAdded, tracksAdded };
}
