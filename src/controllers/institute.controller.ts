import type { Request, Response } from "express"
import { db } from "../db";
import { classesTable, classSubjectsTable, feeStructuresTable, instituteProfileTable, rolesTable, sectionsTable, staffTable, studentsTable, subjectAllocationsTable, subjectsTable, teacherProfileTable, userRoleTable, usersTable } from "../models";
import { and, countDistinct, eq, sql } from "drizzle-orm";
import { uploadImageToCloudinary } from "../helpers/uploadToCloudinary";
import bcrypt from "bcrypt";
import type { TokenUser } from "../interface";
import { getLoggedInUserDetails } from "../services/auth.service";
import { slugify } from "../helpers/slugifyDeslugify";

const createSchool = async (req: Request, res: Response) => {
    try {
        const { schoolName, affiliationNumber, address, main_phone, primaryEmail, office_hours_Mon_Fri, office_hours_Sat, office_hours_Sun = "Off", website, landmark, area, city, state, pincode, medium, establishedYear, founderName, missionStatement, visionStatement, coreValues, tags, boardsAffiliated, notableAlumni } = req.body;

        if ([schoolName, affiliationNumber, address, main_phone, primaryEmail, office_hours_Mon_Fri, office_hours_Sat, website, landmark, city, state, pincode].some(field => field.trim() === "" || !field)) {
            return res.json({ status: 400, message: "Missing required fields" }).status(400);
        }

        const slug = slugify(schoolName);

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

        const additionalInformation = {
            establishedYear,
            founderName,
            missionStatement,
            visionStatement,
            coreValues,
            notableAlumni,
            tags,
            boardsAffiliated,
        }

        // Logic to create institute profile goes here
        const [existingInstitute] = await db.select().from(instituteProfileTable).where(eq(instituteProfileTable.schoolName, schoolName));

        if (existingInstitute) {
            return res.status(409).json({ status: 409, message: "This school already exists!" });
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const logoImageLocalPath = files?.instituteLogo?.[0]?.path;

        if (!logoImageLocalPath) {
            return res.status(400).json({ status: 400, message: "Logo-image file is missing" })
        }

        const logoImage = await uploadImageToCloudinary(logoImageLocalPath, "School_Erp_Logos");

        if (!logoImage) {
            return res.status(500).json({ status: 500, message: "Failed to upload logo image" });
        }

        console.log("Running222");

        const [newInstitute] = await db.insert(instituteProfileTable).values({
            schoolName,
            affiliationNumber,
            slug,
            address,
            logoUrl: logoImage?.secure_url,
            medium,
            contactInfo: contactInformation,
            additionalInfo: additionalInformation,
        }).returning();

        // Check if institute creation was successful
        if (!newInstitute) {
            return res.status(404).json({ status: 404, message: "Failed to register the institute" });
        }

        return res.status(201).json({ message: "Institute created Successfully", data: newInstitute });

    } catch (error) {
        console.error("Errro Creating institute : ", error);
        return res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
}

// TODO: Send email to the school admin with his/her login credentials and other details after creating the school admin account.
const createSchoolAdmin = async (req: Request, res: Response) => {
    try {
        // const { instituteId } = await getLoggedInUserDetails(req)

        // Getting the instituteId from req.body because while creating school admin , the super admin will not be having instituteId in his token details as he is not linked to any institute but he can create multiple school admins for different schools using the same API and that is why sending instituteId in req.body
        const { firstName, lastName, email, phone, gender, password, isActive, roleName, instituteId } = req.body;

        if ([firstName, lastName, email, phone, gender, password, roleName].some(field => field.trim() === "" || !field)) {
            return res.status(400).json({ status: 400, message: "Provide all required fields" });
        }

        if (!instituteId) {
            return res.status(400).json({ status: 400, message: "Institute Id is required" });
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
                .json({ status: 500, message: "Failed to assign role to user" });
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
        const { className, academicYearId, capacity } = req.body;
        const { instituteId } = await getLoggedInUserDetails(req)

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
        const { instituteId } = await getLoggedInUserDetails(req)
        const { name, code, type, description, isActive } = req.body;

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
        const { instituteId } = await getLoggedInUserDetails(req)
        const { academicYearId, classId, sectionId, subjectId, staffId } = req.body;

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

// TODO: Create the plan , revenue tables and link it with the institutesTable id and then send it in the below API
const getAllSchools = async (req: Request, res: Response) => {
    try {
        const { roles } = await getLoggedInUserDetails(req);

        if (!roles.includes('SUPER_ADMIN')) {
            return res.status(401).json({ message: "Unauthorized User", status: 401 })
        }

        const getAllSchools = await db
            .select({
                // Institute fields
                schoolId: instituteProfileTable.id,
                schoolName: instituteProfileTable.schoolName,
                schoolSlug: instituteProfileTable.slug,
                affiliationNumber: instituteProfileTable.affiliationNumber,
                schoolStatus: instituteProfileTable.status,
                address: instituteProfileTable.address,
                schoolInfo: instituteProfileTable.contactInfo,
                createdAt: instituteProfileTable.createdAt,
                // Counts
                totalStudents: countDistinct(studentsTable.id),
                totalStaff: countDistinct(staffTable.id),
            })
            .from(instituteProfileTable)
            .leftJoin(studentsTable, eq(studentsTable.instituteId, instituteProfileTable.id))
            .leftJoin(staffTable, eq(staffTable.instituteId, instituteProfileTable.id))
            .groupBy(instituteProfileTable.id);

        if (getAllSchools?.length === 0) {
            return res.status(200).json({ message: "No Schools Found", data: getAllSchools, status: 200 })
        }

        return res.status(200).json({ message: "Fetched All Schools", data: getAllSchools, status: 200 })


    } catch (error) {
        console.error("Error fetching all the schools: ", error);
        return res.status(500).json({ message: "Internal Server Error fetching all schools", status: 500 })
    }
}

const getSchoolDetails = async (req: Request, res: Response) => {
    try {
        const { slug } = await req.params;

        if (!slug) {
            return res.status(400).json({ message: "Invalid School Slug", status: 400 });
        }

        const schoolDetails = await db
            .select({
                // --- HERO + QUICK STATS ---
                id: instituteProfileTable.id,
                schoolName: instituteProfileTable.schoolName,
                slug: instituteProfileTable.slug,
                affiliationNumber: instituteProfileTable.affiliationNumber,
                status: instituteProfileTable.status,
                address: instituteProfileTable.address,
                logoUrl: instituteProfileTable.logoUrl,
                medium: instituteProfileTable.medium,
                contactInfo: instituteProfileTable.contactInfo,
                additionalInfo: instituteProfileTable.additionalInfo,

                // --- CLASSES (Academics section) ---
                classes: sql<{
                    id: number;
                    className: string;
                    orderIndex: number | null;
                    capacity: number | null;
                }[]>`
                    COALESCE(
                        json_agg(DISTINCT jsonb_build_object(
                            'id', ${classesTable.id},
                            'className', ${classesTable.className},
                            'orderIndex', ${classesTable.orderIndex},
                            'capacity', ${classesTable.capacity}
                        )) FILTER (WHERE ${classesTable.id} IS NOT NULL),
                        '[]'
                    )
                `,

                // --- FEE STRUCTURES (Fee section) ---
                feeStructures: sql<{
                    classId: number;
                    amount: string;
                    frequency: string;
                    isCompulsory: boolean;
                    dueDay: number | null;
                }[]>`
                    COALESCE(
                        json_agg(DISTINCT jsonb_build_object(
                            'classId', ${feeStructuresTable.classId},
                            'amount', ${feeStructuresTable.amount},
                            'frequency', ${feeStructuresTable.frequency},
                            'isCompulsory', ${feeStructuresTable.isCompulsory},
                            'dueDay', ${feeStructuresTable.dueDay}
                        )) FILTER (WHERE ${feeStructuresTable.id} IS NOT NULL),
                        '[]'
                    )
                `,

                // --- STAFF (Faculty section) ---
                staff: sql<{
                    id: number;
                    firstName: string;
                    lastName: string;
                    designation: string;
                    department: string | null;
                    joiningDate: string;
                }[]>`
                    COALESCE(
                        json_agg(DISTINCT jsonb_build_object(
                            'id', ${staffTable.id},
                            'firstName', ${staffTable.firstName},
                            'lastName', ${staffTable.lastName},
                            'designation', ${staffTable.designation},
                            'department', ${staffTable.department},
                            'joiningDate', ${staffTable.joiningDate}
                        )) FILTER (WHERE ${staffTable.id} IS NOT NULL),
                        '[]'
                    )
                `,

                // --- STUDENT COUNT (Quick Stats) ---
                totalStudents: sql<number>`
                    COUNT(DISTINCT ${studentsTable.id})
                `,
            })
            .from(instituteProfileTable)
            .leftJoin(classesTable, eq(classesTable.instituteId, instituteProfileTable.id))
            .leftJoin(feeStructuresTable, eq(feeStructuresTable.instituteId, instituteProfileTable.id))
            .leftJoin(staffTable, eq(staffTable.instituteId, instituteProfileTable.id))
            .leftJoin(studentsTable, eq(studentsTable.instituteId, instituteProfileTable.id))
            .where(eq(instituteProfileTable.slug, slug))
            .groupBy(instituteProfileTable.id)
            .limit(1);

        if (!schoolDetails.length) {
            return res.status(404).json({
                message: "School not found",
                status: 404
            })
        }

        return res.status(200).json({
            message: "Fetched School Details Successfully",
            data: schoolDetails[0],
            status: 200
        });


    } catch (error) {
        console.error("Error fetching schoolDetails: ", error);
        return res.status(500).json({ message: "Internal Server Error fetching schoolDetails", status: 500 })
    }
}

const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const { userId, isActive } = req.body;

        if (!userId || typeof isActive !== "boolean") {
            return res.status(400).json({ message: "Please provide required fields", status: 400 })
        }

        const [existingUser] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, userId))
            .limit(1);

        if (!existingUser) {
            return res.status(404).json({ message: "User not found", status: 404 })
        }

        const [updatedUser] = await db.update(usersTable)
            .set({ isActive })
            .where(eq(usersTable.id, userId))
            .returning({
                firstName: usersTable.firstName,
                lastName: usersTable.lastName,
                email: usersTable.email,
                isActive: usersTable.isActive
            });

        if (!updatedUser) {
            return res.status(400).json({ message: "Failed to update user status", status: 400 })
        }

        return res.status(200).json({ message: "User status updated successfully", data: updatedUser, status: 200 })

    } catch (error) {
        console.error("Error updating userStatus: ", error);
        return res.status(500).json({ message: "Internal Server Error updating userStatus", status: 500 })
    }
}

const updateSchoolDetails = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;

        if (!slug) {
            return res.status(400).json({ status: 400, message: "Invalid School Slug" });
        }

        const [existingInstitute] = await db
            .select()
            .from(instituteProfileTable)
            .where(eq(instituteProfileTable.slug, slug))

        if (!existingInstitute) {
            return res.status(404).json({ status: 404, message: "Institute not found" })
        }

        // ── scalar fields from req.body ──
        const {
            schoolName,
            primaryEmail,
            affiliationNumber,
            main_phone,
            website,
            city,
            state,
            address,
            landmark,
            office_hours_Mon_Fri,
            office_hours_Sat,
            office_hours_Sun = "Off",
            pincode,
            medium,
            establishedYear,
            founderName,
            missionStatement,
            visionStatement,
        } = req.body

        // ── array fields — normalize string | string[] → string[] ──
        const toArray = (val: any): string[] => {
            if (!val) return []
            return Array.isArray(val) ? val : [val]
        }

        const coreValues = toArray(req.body.coreValues)
        const tags = toArray(req.body.tags)
        const boardsAffiliated = toArray(req.body.boardsAffiliated)
        const notableAlumni = toArray(req.body.notableAlumni)

        // ── logo — only update if a new file was uploaded ──
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined
        const logoFile = files?.instituteLogo?.[0]
        let logoUrl = existingInstitute.logoUrl  // keep existing by default

        if (logoFile) {
            const uploaded = await uploadImageToCloudinary(logoFile.path, "School_Erp_Logos")
            if (!uploaded) {
                return res.status(500).json({ status: 500, message: "Failed to upload logo image" })
            }
            logoUrl = uploaded.secure_url
        }

        // ── build updated nested objects ──
        const contactInfo = {
            main_phone,
            emails: {
                primary: primaryEmail
            },
            office_hours: {
                monday_to_friday: office_hours_Mon_Fri,
                saturday: office_hours_Sat,
                sunday: office_hours_Sun,
            },
            website,
            address_details: {
                landmark,
                city,
                state,
                pincode,
            }
        }

        const additionalInfo = {
            establishedYear: establishedYear ? Number(establishedYear) : undefined,
            founderName,
            missionStatement,
            visionStatement,
            coreValues,
            notableAlumni,
            tags,
            boardsAffiliated,
        }

        // ── update ──
        const [updatedInstitute] = await db
            .update(instituteProfileTable)
            .set({
                schoolName,
                affiliationNumber,
                address,
                medium,
                logoUrl,
                contactInfo,
                additionalInfo,
                updatedAt: new Date()
            })
            .where(eq(instituteProfileTable.slug, slug))
            .returning()

        if (!updatedInstitute) {
            return res.status(500).json({ status: 500, message: "Failed to update institute" })
        }

        return res.status(200).json({
            status: 200,
            message: "Institute updated successfully",
            data: updatedInstitute
        })

    } catch (error) {
        console.error("Error updating SchoolDetails: ", error);
        return res.status(500).json({ message: "Internal Server Error updating schoolDetails", status: 500 })
    }
}

export { createSchool, createSchoolAdmin, createSchoolClass, createClassSection, createSubject, createClassSubject, allocateTeacherToSubject, getAllSchools, updateUserStatus, getSchoolDetails, updateSchoolDetails }