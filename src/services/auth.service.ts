import type { Request } from "express";
import type { TokenUser } from "../interface";

export async function getLoggedInUserDetails(req: Request) {
    const loggedInUser = req?.user as TokenUser;
    const loggedInUserId = loggedInUser?.id;
    const instituteId = Number(loggedInUser?.instituteId);
    const roles = loggedInUser?.roles;
    const isloggedInUserActive = loggedInUser?.isActive

    return { instituteId, roles, loggedInUserId, isloggedInUserActive }

}