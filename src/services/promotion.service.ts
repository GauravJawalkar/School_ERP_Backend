import { db } from "../db";
import type { PromoteStudentParams } from "../interface";
import { studentsTable, studentEnrollmentTable, sectionsTable, classesTable } from "../models";
import { eq, and, } from "drizzle-orm";

export type PromotionType = 'PROMOTED' | 'DETAINED' | 'REPEATED';

//  CORE FUNCTION: Promotes a single student This is used by all other promotion functions

export const promoteSingleStudent = async ({
    studentId,
    targetAcademicYearId,
    targetClassId,
    targetSectionId,
    promotionType = 'PROMOTED'
}: PromoteStudentParams) => {

    try {
        // 1. GET STUDENT'S CURRENT STATE
        const [student] = await db
            .select()
            .from(studentsTable)
            .where(eq(studentsTable.id, studentId))
            .limit(1);

        if (!student) {
            throw new Error(`Student ${studentId} not found`);
        }

        if (student.status !== 'ACTIVE') {
            throw new Error(`Student ${studentId} is not active (status: ${student.status})`);
        }

        // 2. GET CURRENT ENROLLMENT
        const [currentEnrollment] = await db
            .select()
            .from(studentEnrollmentTable)
            .where(
                and(
                    eq(studentEnrollmentTable.studentId, studentId),
                    eq(studentEnrollmentTable.status, 'ACTIVE')
                )
            ).limit(1);

        if (!currentEnrollment) {
            throw new Error(`No active enrollment found for student ${studentId}`);
        }

        // 3. VALIDATE TARGET CLASS
        const [targetClass] = await db
            .select()
            .from(classesTable)
            .where(eq(classesTable.id, targetClassId))
            .limit(1);

        if (!targetClass) {
            throw new Error(`Target class ${targetClassId} not found`);
        }

        if (targetClass.academicYearId !== targetAcademicYearId) {
            throw new Error('Target class does not belong to target academic year');
        }

        // 4. DETERMINE TARGET SECTION
        let finalSectionId = targetSectionId;

        if (!finalSectionId) {
            // Auto-assign to first available section
            const [firstSection] = await db
                .select()
                .from(sectionsTable)
                .where(eq(sectionsTable.classId, targetClassId))
                .limit(1);

            finalSectionId = Number(firstSection?.id) || undefined;
        }

        // Validate section belongs to target class
        if (finalSectionId) {
            const [section] = await db
                .select()
                .from(sectionsTable)
                .where(eq(sectionsTable.id, finalSectionId))
                .limit(1);

            if (!section || section.classId !== targetClassId) {
                throw new Error('Section does not belong to target class');
            }
        }

        // 5. CLOSE CURRENT ENROLLMENT
        const exitReasonMap = {
            'PROMOTED': `Promoted to ${targetClass.className}`,
            'DETAINED': `Detained in ${targetClass.className}`,
            'REPEATED': `Repeated ${targetClass.className}`
        };

        await db
            .update(studentEnrollmentTable)
            .set({
                status: 'COMPLETED',
                exitDate: new Date().toISOString().split('T')[0], // Convert to YYYY-MM-DD,
                exitReason: exitReasonMap[promotionType],
                updatedAt: new Date()
            })
            .where(eq(studentEnrollmentTable.id, currentEnrollment.id));


        // 6. CREATE NEW ENROLLMENT
        const [newEnrollment] = await db
            .insert(studentEnrollmentTable)
            .values({
                studentId: studentId,
                classId: targetClassId,
                sectionId: finalSectionId,
                academicYearId: targetAcademicYearId,
                enrollmentDate: String(new Date().toISOString().split('T')[0]), // Convert to YYYY-MM-DD
                status: 'ACTIVE',
            })
            .returning();

        // 7. UPDATE STUDENT RECORD
        await db
            .update(studentsTable)
            .set({
                currentClassId: targetClassId,
                currentSectionId: finalSectionId,
                rollNo: null,  // Reset roll number
            })
            .where(eq(studentsTable.id, studentId));

        // 8. RETURN SUCCESS
        return {
            success: true,
            studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            oldEnrollmentId: currentEnrollment.id,
            newEnrollmentId: newEnrollment?.id,
            fromClassId: currentEnrollment.classId,
            toClassId: targetClassId,
            toSectionId: finalSectionId,
            promotionType
        };

    } catch (error: any) {
        console.error(`❌ Failed to promote student ${studentId}:`, error);
        throw error;
    }
};