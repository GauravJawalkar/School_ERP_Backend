import type { Request, Response } from "express";

const createAddmission = async (req: Request, res: Response) => {
    try {
        const { } = req.body;
    } catch (error) {
        console.log("Error creating addmission: ", error);
        return res.status(500).json({
            message: "Internal Server Error creating addmission",
            status: 500,
        });
    }
}

const updateAddmission = async (req: Request, res: Response) => {
    try {

    } catch (error) {
        console.log("Error updating addmission: ", error);
        return res.status(500).json({
            message: "Internal Server Error updating addmission",
            status: 500,
        });
    }
}

const deleteAddmission = async (req: Request, res: Response) => {
    try {

    } catch (error) {
        console.log("Error deleting addmission: ", error);
        return res.status(500).json({
            message: "Internal Server Error deleting addmission",
            status: 500,
        });
    }
}

const getAllAddmissions = async (req: Request, res: Response) => {
    try {

    } catch (error) {
        console.log("Error getting all addmissions: ", error);
        return res.status(500).json({
            message: "Internal Server Error getting all addmissions",
            status: 500,
        });
    }
}

const getAddmission = async (req: Request, res: Response) => {
    try {

    } catch (error) {
        console.log("Error getting specific addmission: ", error);
        return res.status(500).json({
            message: "Internal Server Error getting specific addmission",
            status: 500,
        });
    }
}

export { createAddmission, updateAddmission, deleteAddmission, getAddmission, getAllAddmissions };