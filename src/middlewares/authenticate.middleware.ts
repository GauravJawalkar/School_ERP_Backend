import type { NextFunction, Request, Response } from "express";
import jwt, { JsonWebTokenError, TokenExpiredError, type JwtPayload } from "jsonwebtoken";
import type { TokenUser } from "../interface";
import { generateAccessToken } from "../helpers/tokenGenerator";

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload | string;
        }
    }
}

const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
    try {
        // STEP 1: Extract Authorization header
        const tokenHeader = req.headers.authorization;

        if (!tokenHeader) {
            return res.status(401).json({
                message: "Unauthorized: Please Login",
                status: 401
            });
        }

        // STEP 2: Validate Bearer token format
        if (!tokenHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Invalid token format. Token must start with 'Bearer '",
                status: 401
            });
        }

        // STEP 3: Extract token from "Bearer <token>"
        const token = tokenHeader.split(" ")[1]?.trim();

        if (!token) {
            return res.status(401).json({
                message: "Token is missing",
                status: 401
            });
        }

        // STEP 4: Validate environment variables
        if (!process.env.ACCESS_TOKEN_SECRET) {
            return res.status(500).json({
                message: "ACCESS_TOKEN_SECRET is not configured",
                status: 500
            });
        }

        if (!process.env.REFRESH_TOKEN_SECRET) {
            return res.status(500).json({
                message: "REFRESH_TOKEN_SECRET is not configured",
                status: 500
            });
        }

        // STEP 5: Try to verify the access token
        try {
            const decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            req.user = decodedUser;

            // Token is valid, proceed to next middleware/route handler
            return next();

        } catch (error) {
            // STEP 6: Handle token verification errors

            // CASE A: Access token has expired - try to refresh it
            if (error instanceof TokenExpiredError) {
                console.log("Access token expired, attempting to refresh...");

                // STEP 6.1: Get refresh token from cookies
                const refreshToken = req.cookies?.refreshToken;

                if (!refreshToken) {
                    return res.status(401).json({
                        message: "Refresh token not found. Please login again.",
                        status: 401
                    });
                }

                // STEP 6.2: Try to verify and decode the refresh token
                try {
                    const user = jwt.verify(
                        refreshToken,
                        process.env.REFRESH_TOKEN_SECRET!
                    ) as TokenUser;

                    // STEP 6.3: Create payload for new access token
                    const payload: TokenUser = {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        gender: user.gender,
                        instituteId: user.instituteId, // Fixed: was user.id
                        phone: user.phone,
                        profileImage: user.profileImage || "",
                        permissions: user.permissions,
                        roles: user.roles
                    };

                    // STEP 6.4: Generate new access token
                    const newAccessToken = generateAccessToken(payload);

                    // STEP 6.5: Set new access token in response header
                    res.setHeader("Authorization", `Bearer ${newAccessToken}`);

                    // STEP 6.6: Attach user to request object
                    req.user = user;

                    console.log("Access token refreshed successfully");

                    // IMPORTANT: Proceed to next middleware/route handler
                    return next();

                } catch (refreshError) {
                    // STEP 6.7: Handle refresh token errors

                    if (refreshError instanceof TokenExpiredError) {
                        return res.status(401).json({
                            message: "Refresh token expired. Please login again.",
                            status: 401
                        });
                    }

                    if (refreshError instanceof JsonWebTokenError) {
                        return res.status(401).json({
                            message: "Invalid refresh token. Please login again.",
                            status: 401
                        });
                    }

                    // Unknown error with refresh token
                    console.error("Refresh token verification error:", refreshError);
                    return res.status(401).json({
                        message: "Authentication failed. Please login again.",
                        status: 401
                    });
                }
            }

            // CASE B: Access token is invalid (not expired, just invalid)
            if (error instanceof JsonWebTokenError) {
                return res.status(401).json({
                    message: "Invalid access token",
                    status: 401
                });
            }

            // CASE C: Unknown JWT error
            throw error;
        }

    } catch (error) {
        // STEP 7: Handle unexpected errors
        console.error("Authentication Middleware Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            status: 500
        });
    }
};

export { authenticateUser }