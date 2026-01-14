import type { Request } from "express";
import type { TokenUser } from "../interface";
import { schoolAdmin, superAdmin } from "../constants/auth.constants";

export async function getLoggedInUserDetails(req: Request) {
    const loggedInUser = req?.user as TokenUser;
    const loggedInUserId = loggedInUser?.id;
    const instituteId = Number(loggedInUser?.instituteId);
    const roles = loggedInUser?.roles;
    const isloggedInUserActive = loggedInUser?.isActive
    const isSuperAdmin = roles.includes(superAdmin);
    const isSchoolAdmin = roles?.includes(schoolAdmin)
    return { instituteId, roles, loggedInUserId, isloggedInUserActive, isSuperAdmin, isSchoolAdmin }

}