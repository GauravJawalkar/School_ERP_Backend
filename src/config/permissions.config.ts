export const AllPermissions = [

    // 0. SUPER ADMIN (SAAS LEVEL)

    { slug: "saas.subscription.manage", module: "SAAS", description: "Create and manage school subscriptions and plans." },
    { slug: "saas.school.manage", module: "SAAS", description: "Add new schools to the SaaS platform and manage existing ones." },

    // 1. CONFIGURATION & RBAC (CONFIG)

    { slug: "config.rbac.manage", module: "CONFIG", description: "Create/Edit roles, permissions, and the access matrix." },
    { slug: "config.academic_year.manage", module: "CONFIG", description: "Define, activate, and manage academic years." },
    { slug: "config.institute.manage", module: "CONFIG", description: "Edit school profile (logo, name, address, affiliation)." },
    { slug: "config.certificate.template_manage", module: "CONFIG", description: "Design and edit ID Card/TC/Bonafide certificate templates." },
    { slug: "config.certificate.generate", module: "CONFIG", description: "Generate a student certificate (TC/Bonafide)." },

    // 2. ADMISSIONS / CRM (ADMISSIONS)

    { slug: "admissions.inquiry.create", module: "ADMISSIONS", description: "Log a new student inquiry/lead." },
    { slug: "admissions.inquiry.update", module: "ADMISSIONS", description: "Update lead status (Kanban board movement)." },
    { slug: "admissions.followup.manage", module: "ADMISSIONS", description: "Schedule and manage follow-up calls." },
    { slug: "admissions.fee.collect", module: "ADMISSIONS", description: "Collect application/form purchase fees." },

    // 3. STUDENT INFORMATION SYSTEM (SIS)

    { slug: "student.profile.create", module: "SIS", description: "Create a new student record after admission." },
    { slug: "student.profile.view_full", module: "SIS", description: "View all tabs of the 360° student profile (health, history, docs)." },
    { slug: "student.profile.view_basic", module: "SIS", description: "View only basic details (Name, Class, Parent contact)." },
    { slug: "student.profile.edit", module: "SIS", description: "Edit student personal or parent details." },
    { slug: "student.profile.delete", module: "SIS", description: "Permanently delete a student record (High privilege)." },
    { slug: "student.promotion.execute", module: "SIS", description: "Execute bulk class promotion (e.g., Grade 5 -> Grade 6)." },
    { slug: "student.document.manage", module: "SIS", description: "Upload, view, and validate Aadhar/TC documents." },

    // 4. HUMAN RESOURCES (HR)

    { slug: "staff.profile.create", module: "HR", description: "Create a new staff member (Teacher/Admin) and their login." },
    { slug: "staff.profile.edit", module: "HR", description: "Edit staff details, designation, or role." },
    { slug: "staff.leave.apply", module: "HR", description: "Submit a leave request (Self-service)." },
    { slug: "staff.leave.approve", module: "HR", description: "Approve or reject staff leave requests." },
    { slug: "staff.attendance.view", module: "HR", description: "View staff attendance records." },

    // 5. PAYROLL

    { slug: "payroll.structure.manage", module: "PAYROLL", description: "Define and modify salary components (Basic, DA, PF)." },
    { slug: "payroll.processor.run", module: "PAYROLL", description: "Execute the monthly salary calculation." },
    { slug: "payroll.slip.generate", module: "PAYROLL", description: "Generate and download salary slips." },
    { slug: "payroll.deduction.manage", module: "PAYROLL", description: "Apply custom LOP or other deductions." },

    // 6. ACADEMICS

    { slug: "academics.class.manage", module: "ACADEMICS", description: "Create and edit classes and sections." },
    { slug: "academics.timetable.manage", module: "ACADEMICS", description: "Create, edit, and check conflicts for the school timetable." },
    { slug: "academics.lesson_plan.manage", module: "ACADEMICS", description: "Create, view, and track weekly lesson plans." },
    { slug: "academics.assignment.create", module: "ACADEMICS", description: "Post new homework or assignments." },
    { slug: "academics.assignment.grade", module: "ACADEMICS", description: "Review and grade submitted assignments." },

    // 7. ATTENDANCE

    { slug: "attendance.mark", module: "ATTENDANCE", description: "Mark daily student attendance for an assigned class/section." },
    { slug: "attendance.view_all", module: "ATTENDANCE", description: "View attendance records across all classes." },
    { slug: "attendance.override", module: "ATTENDANCE", description: "Edit or override past attendance entries." },

    // 8. EXAMS & GRADING

    { slug: "exam.schedule.manage", module: "EXAMS", description: "Define exam names, dates, and max marks." },
    { slug: "marks.entry", module: "EXAMS", description: "Input marks for assigned students/subjects." },
    { slug: "marks.results.approve", module: "EXAMS", description: "Final approval of results before publication (Principal)." },
    { slug: "exam.report_card.generate", module: "EXAMS", description: "Generate the final NEP Report Card." },
    { slug: "exam.analysis.view", module: "EXAMS", description: "View dashboard analytics (class average, weak subjects)." },

    // 9. FINANCE

    { slug: "fees.structure.manage", module: "FINANCE", description: "Define Fee Heads, fee structures, and late fee rules." },
    { slug: "fees.invoice.create", module: "FINANCE", description: "Generate new fee invoices for students." },
    { slug: "fees.payment.collect", module: "FINANCE", description: "Record a payment (Cash, UPI, Cheque) against an invoice." },
    { slug: "fees.payment.refund", module: "FINANCE", description: "Process a fee refund." },
    { slug: "fees.concession.manage", module: "FINANCE", description: "Apply and approve sibling/staff concessions." },
    { slug: "fees.report.view", module: "FINANCE", description: "View day book, outstanding reports, and transaction logs." },
    { slug: "fees.tally.export", module: "FINANCE", description: "Export financial data for accounting software (Tally)." },

    // 10. OPERATIONS & LOGISTICS

    { slug: "transport.vehicle.manage", module: "OPERATIONS", description: "Manage bus numbers, drivers, and maintenance records." },
    { slug: "transport.route.manage", module: "OPERATIONS", description: "Define routes, stops, sequence, and fee per stop." },
    { slug: "transport.gps.view", module: "OPERATIONS", description: "View real-time GPS location of school vehicles." },
    { slug: "library.book.add", module: "OPERATIONS", description: "Add new books to the inventory (ISBN)." },
    { slug: "library.book.issue", module: "OPERATIONS", description: "Issue books to users." },
    { slug: "library.book.return", module: "OPERATIONS", description: "Process book returns and close the issue log." },
    { slug: "library.fine.update", module: "OPERATIONS", description: "Apply or waive late return fines." },
    { slug: "operations.visitor.manage", module: "OPERATIONS", description: "Log visitor entry and exit details." },

    // 11. COMMUNICATION

    { slug: "communication.notice.publish", module: "COMMUNICATION", description: "Post circulars or notices to the digital notice board." },
    { slug: "communication.message.send_bulk", module: "COMMUNICATION", description: "Send school-wide WhatsApp/SMS alerts." },
    { slug: "communication.gallery.upload", module: "COMMUNICATION", description: "Upload photos and media to the school gallery." },

    // 12. END-USER (PARENT/STUDENT READ-ONLY)

    { slug: "app.view.timetable", module: "END_USER", description: "View the academic timetable." },
    { slug: "app.view.grades", module: "END_USER", description: "View marks and report cards." },
    { slug: "app.view.attendance", module: "END_USER", description: "View personal or child's attendance." },
    { slug: "app.view.bus_location", module: "END_USER", description: "View child's bus location." },
    { slug: "app.assignment.submit", module: "END_USER", description: "Submit homework or assignment replies." },
    { slug: "app.message.teacher", module: "END_USER", description: "Send a private message to the class/subject teacher." },
];