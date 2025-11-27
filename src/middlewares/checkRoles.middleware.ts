import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";

const checkUserRoles = (requiredRoles: string[] = []) => {

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

            const userRoles = (req.user as JwtPayload & { permissions?: string[] }).roles || [];

            const hasRoles = requiredRoles.length > 0 || requiredRoles.some(role => userRoles.includes(role));

            if (!hasRoles) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You don't have the required role.",
                    required: requiredRoles,
                    userHas: userRoles
                });
            }

            next();

        } catch (error) {
            console.error("Error in check role middleware : ", error);
            return res.status(500).json({ error: "Internal server error in check role middleware" })
        }
    }

}

export { checkUserRoles }