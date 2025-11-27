import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";

const checkUserPersmission = (requiredPermissions: string[] = []) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required : Login"
                });
            }

            // If req.user can be a string (e.g., raw token), reject or handle accordingly
            if (typeof req.user === "string") {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token payload"
                });
            }

            // Narrow to JwtPayload-like object that may contain permissions
            const userPermissions = (req.user as JwtPayload & { permissions?: string[] }).permissions || [];

            // If no required permissions specified, allow
            const hasPermission = requiredPermissions.length === 0 || requiredPermissions.some(permission => userPermissions.includes(permission));

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You don't have the required permissions.",
                    required: requiredPermissions,
                    userHas: userPermissions
                });
            }

            next();

        } catch (error) {
            console.error("Error in check permission middleware : ", error);
            return res.status(500).json({ error: "Internal server error in check permission middleware" });
        }
    }
}

export { checkUserPersmission }