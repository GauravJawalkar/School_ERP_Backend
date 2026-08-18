import { db } from "../db";
import { classesTable } from "../models";
import { eq, and } from "drizzle-orm";


// Gets the next class in the next academic year Example: Grade 1 (2024-25) → Grade 2 (2025-26)

export const getNextYearClass = async (
    currentClassId: number,
    targetAcademicYearId: number
): Promise<number | null> => {

    // Get current class details
    const [currentClass] = await db
        .select()
        .from(classesTable)
        .where(eq(classesTable.id, currentClassId))
        .limit(1);

    if (!currentClass) {
        throw new Error("Current class not found");
    }

    // Find next class by orderIndex in target year and matching board
    const [nextClass] = await db
        .select()
        .from(classesTable)
        .where(
            and(
                eq(classesTable.academicYearId, targetAcademicYearId),
                eq(classesTable.orderIndex, (currentClass.orderIndex || 0) + 1),
                eq(classesTable.board, currentClass.board)
            )
        )
        .limit(1);

    return nextClass?.id || null;
};


//  Gets the same level class in next academic year (for detained students)

export const getSameLevelNextYearClass = async (
    currentClassId: number,
    targetAcademicYearId: number
): Promise<number | null> => {

    const [currentClass] = await db
        .select()
        .from(classesTable)
        .where(eq(classesTable.id, currentClassId))
        .limit(1);

    if (!currentClass) {
        throw new Error("Current class not found");
    }

    // Find SAME orderIndex in next year and matching board
    const [sameClass] = await db
        .select()
        .from(classesTable)
        .where(
            and(
                eq(classesTable.academicYearId, targetAcademicYearId),
                eq(classesTable.orderIndex, currentClass.orderIndex || 0),
                eq(classesTable.board, currentClass.board)
            )
        )
        .limit(1);

    return sameClass?.id || null;
};


//  Gets class details with academic year info

export const getClassDetails = async (classId: number) => {
    const [classDetails] = await db
        .select({
            id: classesTable.id,
            className: classesTable.className,
            board: classesTable.board,
            orderIndex: classesTable.orderIndex,
            academicYearId: classesTable.academicYearId,
            instituteId: classesTable.instituteId
        })
        .from(classesTable)
        .where(eq(classesTable.id, classId))
        .limit(1);

    return classDetails;
};