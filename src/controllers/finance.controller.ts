import type { Request, Response } from "express";

const createFeeHead = async (req: Request, res: Response) => {
    try {

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error creating Fee Head",
            status: 500
        })
    }
}

export { createFeeHead }