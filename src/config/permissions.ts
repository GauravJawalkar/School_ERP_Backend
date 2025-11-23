
// Complete School Management System Permissions
// Total: 120 permissions across 15 modules


export const PERMISSIONS = {
    // ========== STUDENT MODULE ==========
    STUDENT_VIEW: "student.view",
    STUDENT_CREATE: "student.create",
    STUDENT_UPDATE: "student.update",
    STUDENT_DELETE: "student.delete",
    STUDENT_PROMOTE: "student.promote",
    STUDENT_TRANSFER: "student.transfer",
    STUDENT_BULK_IMPORT: "student.bulk_import",
    STUDENT_EXPORT: "student.export",

    // ========== ATTENDANCE MODULE ==========
    ATTENDANCE_VIEW: "attendance.view",
    ATTENDANCE_MARK: "attendance.mark",
    ATTENDANCE_EDIT: "attendance.edit",
    ATTENDANCE_DELETE: "attendance.delete",
    ATTENDANCE_REPORT: "attendance.report",

    // ========== MARKS MODULE ==========
    MARKS_VIEW: "marks.view",
    MARKS_ENTRY: "marks.entry",
    MARKS_EDIT: "marks.edit",
    MARKS_DELETE: "marks.delete",
    MARKS_PUBLISH: "marks.publish",
    MARKS_REPORT: "marks.report",

    // ========== FEES MODULE ==========
    FEES_VIEW: "fees.view",
    FEES_CREATE: "fees.create",
    FEES_UPDATE: "fees.update",
    FEES_COLLECT: "fees.collect",
    FEES_REFUND: "fees.refund",
    FEES_WAIVER: "fees.waiver",
    FEES_RECEIPT: "fees.receipt",
    FEES_DEFAULTER_LIST: "fees.defaulter_list",
    FEES_REPORT: "fees.report",

    // ========== LIBRARY MODULE ==========
    LIBRARY_VIEW: "library.view",
    LIBRARY_BOOK_ADD: "library.book.add",
    LIBRARY_BOOK_UPDATE: "library.book.update",
    LIBRARY_BOOK_DELETE: "library.book.delete",
    LIBRARY_BOOK_ISSUE: "library.book.issue",
    LIBRARY_BOOK_RETURN: "library.book.return",
    LIBRARY_FINE: "library.fine",
    LIBRARY_REPORT: "library.report",

    // ========== TRANSPORT MODULE ==========
    TRANSPORT_VIEW: "transport.view",
    TRANSPORT_ROUTE_CREATE: "transport.route.create",
    TRANSPORT_ROUTE_UPDATE: "transport.route.update",
    TRANSPORT_ROUTE_DELETE: "transport.route.delete",
    TRANSPORT_STUDENT_ASSIGN: "transport.student.assign",
    TRANSPORT_DRIVER_MANAGE: "transport.driver.manage",
    TRANSPORT_VEHICLE_MANAGE: "transport.vehicle.manage",
    TRANSPORT_REPORT: "transport.report",

    // ========== ADMISSION MODULE ==========
    ADMISSION_VIEW: "admission.view",
    ADMISSION_CREATE: "admission.create",
    ADMISSION_UPDATE: "admission.update",
    ADMISSION_APPROVE: "admission.approve",
    ADMISSION_DELETE: "admission.delete",

    // ========== VISITOR MODULE ==========
    VISITOR_VIEW: "visitor.view",
    VISITOR_LOG: "visitor.log",
    VISITOR_DELETE: "visitor.delete",

    // ========== STAFF MODULE ==========
    TEACHER_VIEW: "teacher.view",
    TEACHER_CREATE: "teacher.create",
    TEACHER_UPDATE: "teacher.update",
    TEACHER_DELETE: "teacher.delete",
    STAFF_VIEW: "staff.view",
    STAFF_CREATE: "staff.create",
    STAFF_UPDATE: "staff.update",
    STAFF_DELETE: "staff.delete",
    STAFF_SALARY_VIEW: "staff.salary.view",
    STAFF_SALARY_PROCESS: "staff.salary.process",

    // ========== ACADEMIC MODULE ==========
    CLASS_VIEW: "class.view",
    CLASS_CREATE: "class.create",
    CLASS_UPDATE: "class.update",
    CLASS_DELETE: "class.delete",
    SUBJECT_VIEW: "subject.view",
    SUBJECT_CREATE: "subject.create",
    SUBJECT_UPDATE: "subject.update",
    SUBJECT_DELETE: "subject.delete",
    TIMETABLE_VIEW: "timetable.view",
    TIMETABLE_CREATE: "timetable.create",
    TIMETABLE_UPDATE: "timetable.update",
    ACADEMIC_YEAR_VIEW: "academic_year.view",
    ACADEMIC_YEAR_CREATE: "academic_year.create",
    ACADEMIC_YEAR_UPDATE: "academic_year.update",
    ACADEMIC_YEAR_DELETE: "academic_year.delete",

    // ========== EXAM MODULE ==========
    EXAM_VIEW: "exam.view",
    EXAM_CREATE: "exam.create",
    EXAM_UPDATE: "exam.update",
    EXAM_DELETE: "exam.delete",

    // ========== COMMUNICATION MODULE ==========
    NOTICE_VIEW: "notice.view",
    NOTICE_CREATE: "notice.create",
    NOTICE_UPDATE: "notice.update",
    NOTICE_DELETE: "notice.delete",
    MESSAGE_SEND: "message.send",
    MESSAGE_VIEW: "message.view",

    // ========== HOMEWORK MODULE ==========
    HOMEWORK_VIEW: "homework.view",
    HOMEWORK_CREATE: "homework.create",
    HOMEWORK_UPDATE: "homework.update",
    HOMEWORK_DELETE: "homework.delete",

    // ========== DOCUMENT MODULE ==========
    CERTIFICATE_VIEW: "certificate.view",
    CERTIFICATE_GENERATE: "certificate.generate",
    REPORT_CARD_VIEW: "report_card.view",
    REPORT_CARD_GENERATE: "report_card.generate",

    // ========== SYSTEM MODULE ==========
    ROLE_VIEW: "role.view",
    ROLE_CREATE: "role.create",
    ROLE_UPDATE: "role.update",
    ROLE_DELETE: "role.delete",
    USER_VIEW: "user.view",
    USER_CREATE: "user.create",
    USER_UPDATE: "user.update",
    USER_DELETE: "user.delete",
    USER_ASSIGN_ROLE: "user.assign_role",

    // ========== INSTITUTE MODULE ==========
    INSTITUTE_VIEW: "institute.view",
    INSTITUTE_UPDATE: "institute.update",
    INSTITUTE_SETTINGS: "institute.settings",

    // ========== REPORTS MODULE ==========
    REPORT_ACADEMIC: "report.academic",
    REPORT_FINANCIAL: "report.financial",
    REPORT_STUDENT: "report.student",
    REPORT_ATTENDANCE: "report.attendance",
    REPORT_CUSTOM: "report.custom",

    // ========== DASHBOARD MODULE ==========
    DASHBOARD_VIEW: "dashboard.view",
    DASHBOARD_ADMIN: "dashboard.admin",

    // ========== SAAS MODULE (Platform Level) ==========
    SAAS_INSTITUTE_CREATE: "saas.institute.create",
    SAAS_INSTITUTE_DELETE: "saas.institute.delete",
    SAAS_INSTITUTE_VIEW_ALL: "saas.institute.view_all",
    SAAS_SUBSCRIPTION_MANAGE: "saas.subscription.manage",
    SAAS_BILLING_VIEW: "saas.billing.view",
    SAAS_SETTINGS: "saas.settings",
} as const;


// Get all permission values as array

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);


// Role Definitions with Permissions

export const ROLE_PERMISSIONS = {
    // ========================================
    // 1. SUPER_ADMIN (SaaS Level - 120 permissions)
    // ========================================
    SUPER_ADMIN: Object.values(PERMISSIONS), // ALL permissions

    // ========================================
    // 2. SCHOOL_ADMIN (89 permissions)
    // ========================================
    SCHOOL_ADMIN: [
        // Student Management (8)
        PERMISSIONS.STUDENT_VIEW,
        PERMISSIONS.STUDENT_CREATE,
        PERMISSIONS.STUDENT_UPDATE,
        PERMISSIONS.STUDENT_DELETE,
        PERMISSIONS.STUDENT_PROMOTE,
        PERMISSIONS.STUDENT_TRANSFER,
        PERMISSIONS.STUDENT_BULK_IMPORT,
        PERMISSIONS.STUDENT_EXPORT,

        // Attendance (5)
        PERMISSIONS.ATTENDANCE_VIEW,
        PERMISSIONS.ATTENDANCE_MARK,
        PERMISSIONS.ATTENDANCE_EDIT,
        PERMISSIONS.ATTENDANCE_DELETE,
        PERMISSIONS.ATTENDANCE_REPORT,

        // Marks (6)
        PERMISSIONS.MARKS_VIEW,
        PERMISSIONS.MARKS_ENTRY,
        PERMISSIONS.MARKS_EDIT,
        PERMISSIONS.MARKS_DELETE,
        PERMISSIONS.MARKS_PUBLISH,
        PERMISSIONS.MARKS_REPORT,

        // Fees (9)
        PERMISSIONS.FEES_VIEW,
        PERMISSIONS.FEES_CREATE,
        PERMISSIONS.FEES_UPDATE,
        PERMISSIONS.FEES_COLLECT,
        PERMISSIONS.FEES_REFUND,
        PERMISSIONS.FEES_WAIVER,
        PERMISSIONS.FEES_RECEIPT,
        PERMISSIONS.FEES_DEFAULTER_LIST,
        PERMISSIONS.FEES_REPORT,

        // Library (8)
        PERMISSIONS.LIBRARY_VIEW,
        PERMISSIONS.LIBRARY_BOOK_ADD,
        PERMISSIONS.LIBRARY_BOOK_UPDATE,
        PERMISSIONS.LIBRARY_BOOK_DELETE,
        PERMISSIONS.LIBRARY_BOOK_ISSUE,
        PERMISSIONS.LIBRARY_BOOK_RETURN,
        PERMISSIONS.LIBRARY_FINE,
        PERMISSIONS.LIBRARY_REPORT,

        // Transport (8)
        PERMISSIONS.TRANSPORT_VIEW,
        PERMISSIONS.TRANSPORT_ROUTE_CREATE,
        PERMISSIONS.TRANSPORT_ROUTE_UPDATE,
        PERMISSIONS.TRANSPORT_ROUTE_DELETE,
        PERMISSIONS.TRANSPORT_STUDENT_ASSIGN,
        PERMISSIONS.TRANSPORT_DRIVER_MANAGE,
        PERMISSIONS.TRANSPORT_VEHICLE_MANAGE,
        PERMISSIONS.TRANSPORT_REPORT,

        // Admission (5)
        PERMISSIONS.ADMISSION_VIEW,
        PERMISSIONS.ADMISSION_CREATE,
        PERMISSIONS.ADMISSION_UPDATE,
        PERMISSIONS.ADMISSION_APPROVE,
        PERMISSIONS.ADMISSION_DELETE,

        // Visitor (3)
        PERMISSIONS.VISITOR_VIEW,
        PERMISSIONS.VISITOR_LOG,
        PERMISSIONS.VISITOR_DELETE,

        // Staff Management (10)
        PERMISSIONS.TEACHER_VIEW,
        PERMISSIONS.TEACHER_CREATE,
        PERMISSIONS.TEACHER_UPDATE,
        PERMISSIONS.TEACHER_DELETE,
        PERMISSIONS.STAFF_VIEW,
        PERMISSIONS.STAFF_CREATE,
        PERMISSIONS.STAFF_UPDATE,
        PERMISSIONS.STAFF_DELETE,
        PERMISSIONS.STAFF_SALARY_VIEW,
        PERMISSIONS.STAFF_SALARY_PROCESS,

        // Academic (15)
        PERMISSIONS.CLASS_VIEW,
        PERMISSIONS.CLASS_CREATE,
        PERMISSIONS.CLASS_UPDATE,
        PERMISSIONS.CLASS_DELETE,
        PERMISSIONS.SUBJECT_VIEW,
        PERMISSIONS.SUBJECT_CREATE,
        PERMISSIONS.SUBJECT_UPDATE,
        PERMISSIONS.SUBJECT_DELETE,
        PERMISSIONS.TIMETABLE_VIEW,
        PERMISSIONS.TIMETABLE_CREATE,
        PERMISSIONS.TIMETABLE_UPDATE,
        PERMISSIONS.ACADEMIC_YEAR_VIEW,
        PERMISSIONS.ACADEMIC_YEAR_CREATE,
        PERMISSIONS.ACADEMIC_YEAR_UPDATE,
        PERMISSIONS.ACADEMIC_YEAR_DELETE,

        // Exam (4)
        PERMISSIONS.EXAM_VIEW,
        PERMISSIONS.EXAM_CREATE,
        PERMISSIONS.EXAM_UPDATE,
        PERMISSIONS.EXAM_DELETE,

        // Communication (6)
        PERMISSIONS.NOTICE_VIEW,
        PERMISSIONS.NOTICE_CREATE,
        PERMISSIONS.NOTICE_UPDATE,
        PERMISSIONS.NOTICE_DELETE,
        PERMISSIONS.MESSAGE_SEND,
        PERMISSIONS.MESSAGE_VIEW,

        // Homework (4)
        PERMISSIONS.HOMEWORK_VIEW,
        PERMISSIONS.HOMEWORK_CREATE,
        PERMISSIONS.HOMEWORK_UPDATE,
        PERMISSIONS.HOMEWORK_DELETE,

        // Documents (4)
        PERMISSIONS.CERTIFICATE_VIEW,
        PERMISSIONS.CERTIFICATE_GENERATE,
        PERMISSIONS.REPORT_CARD_VIEW,
        PERMISSIONS.REPORT_CARD_GENERATE,

        // System (9)
        PERMISSIONS.ROLE_VIEW,
        PERMISSIONS.ROLE_CREATE,
        PERMISSIONS.ROLE_UPDATE,
        PERMISSIONS.ROLE_DELETE,
        PERMISSIONS.USER_VIEW,
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_UPDATE,
        PERMISSIONS.USER_DELETE,
        PERMISSIONS.USER_ASSIGN_ROLE,

        // Institute (3)
        PERMISSIONS.INSTITUTE_VIEW,
        PERMISSIONS.INSTITUTE_UPDATE,
        PERMISSIONS.INSTITUTE_SETTINGS,

        // Reports (5)
        PERMISSIONS.REPORT_ACADEMIC,
        PERMISSIONS.REPORT_FINANCIAL,
        PERMISSIONS.REPORT_STUDENT,
        PERMISSIONS.REPORT_ATTENDANCE,
        PERMISSIONS.REPORT_CUSTOM,

        // Dashboard (2)
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.DASHBOARD_ADMIN,
    ],

    // ========================================
    // 3. TEACHER (18 permissions)
    // ========================================
    TEACHER: [
        PERMISSIONS.STUDENT_VIEW,
        PERMISSIONS.ATTENDANCE_VIEW,
        PERMISSIONS.ATTENDANCE_MARK,
        PERMISSIONS.MARKS_VIEW,
        PERMISSIONS.MARKS_ENTRY,
        PERMISSIONS.CLASS_VIEW,
        PERMISSIONS.SUBJECT_VIEW,
        PERMISSIONS.TIMETABLE_VIEW,
        PERMISSIONS.EXAM_VIEW,
        PERMISSIONS.NOTICE_VIEW,
        PERMISSIONS.MESSAGE_VIEW,
        PERMISSIONS.MESSAGE_SEND,
        PERMISSIONS.HOMEWORK_VIEW,
        PERMISSIONS.HOMEWORK_CREATE,
        PERMISSIONS.HOMEWORK_UPDATE,
        PERMISSIONS.HOMEWORK_DELETE,
        PERMISSIONS.REPORT_CARD_VIEW,
        PERMISSIONS.DASHBOARD_VIEW,
    ],

    // ========================================
    // 4. ACCOUNTANT (16 permissions)
    // ========================================
    ACCOUNTANT: [
        PERMISSIONS.STUDENT_VIEW,
        PERMISSIONS.FEES_VIEW,
        PERMISSIONS.FEES_CREATE,
        PERMISSIONS.FEES_UPDATE,
        PERMISSIONS.FEES_COLLECT,
        PERMISSIONS.FEES_REFUND,
        PERMISSIONS.FEES_WAIVER,
        PERMISSIONS.FEES_RECEIPT,
        PERMISSIONS.FEES_DEFAULTER_LIST,
        PERMISSIONS.FEES_REPORT,
        PERMISSIONS.TEACHER_VIEW,
        PERMISSIONS.STAFF_VIEW,
        PERMISSIONS.STAFF_SALARY_VIEW,
        PERMISSIONS.STAFF_SALARY_PROCESS,
        PERMISSIONS.REPORT_FINANCIAL,
        PERMISSIONS.DASHBOARD_VIEW,
    ],

    // ========================================
    // 5. LIBRARIAN (9 permissions)
    // ========================================
    LIBRARIAN: [
        PERMISSIONS.STUDENT_VIEW,
        PERMISSIONS.LIBRARY_VIEW,
        PERMISSIONS.LIBRARY_BOOK_ADD,
        PERMISSIONS.LIBRARY_BOOK_UPDATE,
        PERMISSIONS.LIBRARY_BOOK_DELETE,
        PERMISSIONS.LIBRARY_BOOK_ISSUE,
        PERMISSIONS.LIBRARY_BOOK_RETURN,
        PERMISSIONS.LIBRARY_FINE,
        PERMISSIONS.LIBRARY_REPORT,
        PERMISSIONS.DASHBOARD_VIEW,
    ],

    // ========================================
    // 6. RECEPTIONIST (10 permissions)
    // ========================================
    RECEPTIONIST: [
        PERMISSIONS.STUDENT_VIEW,
        PERMISSIONS.ADMISSION_VIEW,
        PERMISSIONS.ADMISSION_CREATE,
        PERMISSIONS.ADMISSION_UPDATE,
        PERMISSIONS.ADMISSION_APPROVE,
        PERMISSIONS.VISITOR_VIEW,
        PERMISSIONS.VISITOR_LOG,
        PERMISSIONS.NOTICE_VIEW,
        PERMISSIONS.MESSAGE_VIEW,
        PERMISSIONS.DASHBOARD_VIEW,
    ],

    // ========================================
    // 7. TRANSPORT_MANAGER (9 permissions)
    // ========================================
    TRANSPORT_MANAGER: [
        PERMISSIONS.STUDENT_VIEW,
        PERMISSIONS.TRANSPORT_VIEW,
        PERMISSIONS.TRANSPORT_ROUTE_CREATE,
        PERMISSIONS.TRANSPORT_ROUTE_UPDATE,
        PERMISSIONS.TRANSPORT_ROUTE_DELETE,
        PERMISSIONS.TRANSPORT_STUDENT_ASSIGN,
        PERMISSIONS.TRANSPORT_DRIVER_MANAGE,
        PERMISSIONS.TRANSPORT_VEHICLE_MANAGE,
        PERMISSIONS.TRANSPORT_REPORT,
        PERMISSIONS.DASHBOARD_VIEW,
    ],

    // ========================================
    // 8. STUDENT (11 permissions - Read Only)
    // ========================================
    STUDENT: [
        PERMISSIONS.ATTENDANCE_VIEW,
        PERMISSIONS.MARKS_VIEW,
        PERMISSIONS.FEES_VIEW,
        PERMISSIONS.LIBRARY_VIEW,
        PERMISSIONS.TIMETABLE_VIEW,
        PERMISSIONS.EXAM_VIEW,
        PERMISSIONS.NOTICE_VIEW,
        PERMISSIONS.MESSAGE_VIEW,
        PERMISSIONS.HOMEWORK_VIEW,
        PERMISSIONS.REPORT_CARD_VIEW,
        PERMISSIONS.DASHBOARD_VIEW,
    ],

    // ========================================
    // 9. PARENT (11 permissions - Child's Data + Payment)
    // ========================================
    PARENT: [
        PERMISSIONS.ATTENDANCE_VIEW,
        PERMISSIONS.MARKS_VIEW,
        PERMISSIONS.FEES_VIEW,
        PERMISSIONS.FEES_COLLECT, // Can pay fees online
        PERMISSIONS.TIMETABLE_VIEW,
        PERMISSIONS.EXAM_VIEW,
        PERMISSIONS.NOTICE_VIEW,
        PERMISSIONS.MESSAGE_VIEW,
        PERMISSIONS.HOMEWORK_VIEW,
        PERMISSIONS.REPORT_CARD_VIEW,
        PERMISSIONS.DASHBOARD_VIEW,
    ],
};

//
//   Get module for a permission slug

export function getPermissionModule(slug: string): string {
    const prefix = slug.split(".")[0] ?? "";
    const moduleMap: Record<string, string> = {
        student: "Student",
        attendance: "Attendance",
        marks: "Marks",
        fees: "Fees",
        library: "Library",
        transport: "Transport",
        admission: "Admission",
        visitor: "Visitor",
        teacher: "Staff",
        staff: "Staff",
        class: "Academic",
        subject: "Academic",
        timetable: "Academic",
        academic_year: "Academic",
        exam: "Exam",
        notice: "Communication",
        message: "Communication",
        homework: "Academic",
        certificate: "Document",
        report_card: "Document",
        role: "System",
        user: "System",
        institute: "Institute",
        report: "Reports",
        dashboard: "Dashboard",
        saas: "SaaS",
    };
    return moduleMap[prefix] || "General";
}


//   Permission count per role

export const ROLE_PERMISSION_COUNT = {
    SUPER_ADMIN: ROLE_PERMISSIONS.SUPER_ADMIN.length,        // 120
    SCHOOL_ADMIN: ROLE_PERMISSIONS.SCHOOL_ADMIN.length,      // 89
    TEACHER: ROLE_PERMISSIONS.TEACHER.length,                // 18
    ACCOUNTANT: ROLE_PERMISSIONS.ACCOUNTANT.length,          // 16
    LIBRARIAN: ROLE_PERMISSIONS.LIBRARIAN.length,            // 10
    RECEPTIONIST: ROLE_PERMISSIONS.RECEPTIONIST.length,      // 10
    TRANSPORT_MANAGER: ROLE_PERMISSIONS.TRANSPORT_MANAGER.length, // 10
    STUDENT: ROLE_PERMISSIONS.STUDENT.length,                // 11
    PARENT: ROLE_PERMISSIONS.PARENT.length,                  // 11
};