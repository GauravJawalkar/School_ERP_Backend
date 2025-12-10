import type { Request, Response } from "express"
import { ApiError } from "../utils/ApiError";
import { db } from "../db";
import { classesTable, classSubjectsTable, instituteProfileTable, rolesTable, sectionsTable, subjectAllocationsTable, subjectsTable, teacherProfileTable, userRoleTable, usersTable } from "../models";
import { and, eq } from "drizzle-orm";
import { uploadImageToCloudinary } from "../helpers/uploadToCloudinary";
import bcrypt from "bcrypt";
import type { TokenUser } from "../interface";

const createSchool = async (req: Request, res: Response) => {
    try {
        const { schoolName, affiliationNumber, address, main_phone, primaryEmail, office_hours_Mon_Fri, office_hours_Sat, office_hours_Sun, website, landmark, area, city, state, pincode, } = req.body;

        if ([schoolName, affiliationNumber, address, main_phone, primaryEmail, office_hours_Mon_Fri, office_hours_Sat, office_hours_Sun, website, landmark, area, city, state, pincode].some(field => field.trim() === "" || !field)) {
            return res.json(new ApiError(400, "Missing required fields")).status(400);
        }

        const contactInformation = {
            main_phone,
            emails: {
                primary: primaryEmail
            },
            office_hours: {
                monday_to_friday: office_hours_Mon_Fri,
                saturday: office_hours_Sat,
                sunday: office_hours_Sun
            },
            website,
            address_details: {
                landmark,
                area,
                city,
                state,
                pincode
            }
        }

        // Logic to create institute profile goes here
        const [existingInstitute] = await db.select().from(instituteProfileTable).where(eq(instituteProfileTable.schoolName, schoolName));

        if (existingInstitute) {
            return res.json(new ApiError(409, "This school already exists!")).status(409);
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const logoImageLocalPath = files?.instituteLogo?.[0]?.path;

        if (!logoImageLocalPath) {
            return res.json(new ApiError(400, "Logo-image file is missing")).status(400)
        }

        const logoImage = await uploadImageToCloudinary(logoImageLocalPath, "School_Erp_Logos");

        if (!logoImage) {
            return res.json(new ApiError(500, "Failed to upload logo image")).status(500);
        }

        const [newInstitute] = await db.insert(instituteProfileTable).values({
            schoolName,
            affiliationNumber,
            address,
            logoUrl: logoImage?.secure_url,
            contactInfo: contactInformation
        }).returning();

        // Check if institute creation was successful
        if (!newInstitute) {
            return res.json(new ApiError(404, "Failed to register the institute")).status(404);
        }

        return res.status(201).json({ message: "Institute created Successfully", data: newInstitute });

    } catch (error) {
        console.error("Errro Creating institute : ", error);
        return res.json(new ApiError(500, "Internal Server Error")).status(500);
    }
}

const createSchoolAdmin = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, instituteId, email, phone, gender, password, isActive, roleName } = req.body;

        if ([firstName, lastName, email, phone, gender, password, roleName].some(field => field.trim() === "" || !field)) {
            return res.status(400).json({ status: 400, message: "Provide all required fields" });
        }

        if (!instituteId) {
            return res.status(400).json(new ApiError(400, "Institute Id is required"));
        }

        const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));

        if (existingUser) {
            return res.status(409).json({ message: "User with this email already exists!", status: 409 });
        }

        if (roleName === "SUPER_ADMIN") {
            return res.status(403).json({ status: 403, message: "You Cannot assign SUPER_ADMIN role" });
        }

        const [targetRole] = await db.select({ id: rolesTable.id, name: rolesTable.name }).from(rolesTable).where(eq(rolesTable.name, roleName)).limit(1);

        if (!targetRole) {
            return res.status(404).json({ status: 404, message: `Role '${roleName}' not found in the database.` });
        }

        const encryptedPassword = bcrypt.hashSync(password, Number(process.env.SALT_ROUNDS)).toString();

        const [schoolAdmin] = await db.insert(usersTable).values({
            firstName,
            lastName,
            instituteId,
            email,
            phone,
            gender,
            password_hash: encryptedPassword,
            isActive,
        }).returning({
            id: usersTable.id,
            firstName: usersTable.firstName,
            lastName: usersTable.lastName,
            email: usersTable.email
        });

        if (!schoolAdmin) {
            return res.status(404).json({ message: "Failed to register the admin" });
        }

        // Safely resolve assignedBy from req.user which can be string | JwtPayload
        const assignedBy = (req.user && typeof req.user !== "string" && "id" in req.user) ? (req.user as TokenUser).id : undefined;

        const [userRoleAssignment] = await db.insert(userRoleTable).values({
            userId: schoolAdmin.id,         // The user we just created
            roleId: targetRole.id,      // The role they should have (TEACHER, ACCOUNTANT, etc.)
            assignedBy: assignedBy      // Assigned by super admin only
        }).returning();

        if (!userRoleAssignment) {
            // Rollback: Delete the user if role assignment fails
            await db.delete(usersTable).where(eq(usersTable.id, schoolAdmin.id));
            return res
                .status(500)
                .json(new ApiError(500, "Failed to assign role to user"));
        }

        return res.status(201).json({
            success: true,
            message: `School Admin created successfully with ${roleName} role`,
            data: {
                user: schoolAdmin,
                role: targetRole.name,
                schoolId: instituteId
            },
        });

    } catch (error) {
        console.error("Error Creating School Admin : ", error);
        return res.status(500).json({ status: 500, message: "Internal Server Error Creating School Admin" })
    }
}

const createSchoolClass = async (req: Request, res: Response) => {
    try {
        const { instituteId, className, academicYearId, capacity } = req.body;

        if (!instituteId || !className || !academicYearId) {
            return res.status(400).json({ message: 'Please provide required fields', status: 400 })
        }

        const [existingClass] = await db
            .select()
            .from(classesTable)
            .where(
                and(
                    eq(classesTable.className, className),
                    eq(classesTable.academicYearId, academicYearId)
                )
            ).limit(1);

        if (existingClass) {
            return res.status(400).json({ message: 'Class with the same name already exists for this academic year.', status: 400 });
        }

        const [newClass] = await db.insert(classesTable).values({
            instituteId,
            className,
            academicYearId,
            capacity
        }).returning();

        if (!newClass) {
            return res.status(400).json({ message: 'Failed to create the class', status: 400 });
        }

        return res.status(201).json({ message: 'Class Created Successfully', data: newClass, status: 201 });

    } catch (error) {
        return res.status(500).json({ message: `Internal Server Error creating class`, error: error })
    }
}

const createClassSection = async (req: Request, res: Response) => {
    try {
        const { name, classId, capacity, classTeacherId, roomNumber } = req.body;

        if (!name || !classId) {
            return res.status(400).json({ message: 'Please provide required fields', status: 400 });
        }

        const [existingSection] = await db
            .select()
            .from(sectionsTable)
            .where(
                and(
                    eq(sectionsTable.name, name),
                    eq(sectionsTable.classId, classId)
                )
            ).limit(1);

        if (existingSection) {
            return res.status(400).json({ message: 'The section with this name already exist for this class', status: 400 });
        }

        const [newSection] = await db.insert(sectionsTable).values({
            name,
            classId,
            classTeacherId,
            capacity,
            roomNumber
        }).returning();

        if (!newSection) {
            return res.status(400).json({ message: 'Failed to create the section', status: 400 });
        }

        return res.status(201).json({ message: 'Section created Successfully', data: newSection, status: 201 });

    } catch (error) {
        return res.status(500).json({ message: 'Internal server error creating section for class', error: error, status: 500 })
    }
}

const createSubject = async (req: Request, res: Response) => {
    try {
        const { instituteId, name, code, type, description, isActive } = req.body;

        if (!instituteId || !name || !type) {
            return res.status(400).json({ message: "Please provide the required fields", status: 400 });
        }

        const [existingSubject] = await db
            .select()
            .from(subjectsTable)
            .where(
                and(
                    eq(subjectsTable.name, name),
                    eq(subjectsTable.instituteId, instituteId),
                    eq(subjectsTable.type, type)
                )
            ).limit(1);

        if (existingSubject) {
            return res.status(400).json({ message: "The subject already exists for this school", status: 400 })
        }

        const [newSubject] = await db
            .insert(subjectsTable)
            .values({
                instituteId,
                name,
                type,
                code,
                description,
                isActive
            }).returning();

        if (!newSubject) {
            return res.status(400).json({ message: "Failed to create the subject", status: 400 })
        }

        return res.status(201).json({ message: "Subject created successfully", status: 201 });

    } catch (error) {
        return res.status(500).json({ message: 'Internal server error creating subject', status: 500 })
    }
}

const createClassSubject = async (req: Request, res: Response) => {
    try {
        const { classId, subjectId, academicYearId, displayName, maxMarks, minPassingMarks, isCompulsory, isActive } = req.body;

        if (!classId || !subjectId || !academicYearId || !displayName) {
            return res.status(400).json({
                message: "Please provide required fields for creating subject for this class",
                status: 400
            });
        }

        const [exstingClassSubject] = await db
            .select()
            .from(classSubjectsTable)
            .where(
                and(
                    eq(classSubjectsTable.classId, classId),
                    eq(classSubjectsTable.academicYearId, academicYearId),
                    eq(classSubjectsTable.subjectId, subjectId),
                )
            ).limit(1);

        if (exstingClassSubject) {
            return res.status(400).json({
                message: "This subject already exists for this class",
                status: 400
            });
        }

        const [newClassSubject] = await db
            .insert(classSubjectsTable)
            .values({
                classId,
                subjectId,
                academicYearId,
                displayName,
                maxMarks,
                minPassingMarks,
                isCompulsory,
                isActive
            }).returning();

        if (!newClassSubject) {
            return res.status(400).json({
                message: "Failed to create the classSubject",
                status: 400
            })
        }

        return res.status(201).json({
            message: "New Class Subject created successfully",
            status: 201
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error creating subject for a class",
            status: 500
        })
    }
}

const allocateTeacherToSubject = async (req: Request, res: Response) => {
    try {
        const { academicYearId, classId, sectionId, subjectId, staffId, instituteId } = req.body;

        if (!academicYearId || !classId || !sectionId || !subjectId || !staffId || !instituteId) {
            return res.status(400).json({
                message: "Please provide all the required fields",
                status: 400
            });
        }

        // Check if he/she is already a teacher
        const [isTeacherCheck] = await db
            .select()
            .from(teacherProfileTable)
            .where(
                and(
                    eq(teacherProfileTable.staffId, staffId),
                    eq(teacherProfileTable.instituteId, instituteId)
                )
            ).limit(1);

        if (!isTeacherCheck) {
            return res.status(400).json({
                message: "Please check if the user to which subject is being assigned is a teacher and is enrolled in your institute only",
                status: 400
            })
        }

        const [alreadyAllocated] = await db
            .select()
            .from(subjectAllocationsTable)
            .where(
                and(
                    eq(subjectAllocationsTable.academicYearId, academicYearId),
                    eq(subjectAllocationsTable.classSubjectId, subjectId),
                    eq(subjectAllocationsTable.classId, classId),
                    eq(subjectAllocationsTable.sectionId, sectionId),
                    eq(subjectAllocationsTable.teacherId, staffId)
                )
            ).limit(1);

        if (alreadyAllocated) {
            return res.status(400).json({
                success: false,
                message: "This subject is already allocated to this teacher for this class and section"
            });
        }

        const [newAllocation] = await db
            .insert(subjectAllocationsTable)
            .values(
                {
                    academicYearId,
                    instituteId,
                    classId,
                    sectionId,
                    classSubjectId: subjectId,
                    teacherId: staffId
                }
            ).returning();

        if (!newAllocation) {
            return res.status(400).json({
                message: "Failed to allocate the teacher for this subject",
                status: 400
            })
        }

        return res.status(201).json({
            message: "Teacher allocated successfully",
            status: 201
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error allocating teacher to subject", status: 500 })
    }
}

export { createSchool, createSchoolAdmin, createSchoolClass, createClassSection, createSubject, createClassSubject, allocateTeacherToSubject }