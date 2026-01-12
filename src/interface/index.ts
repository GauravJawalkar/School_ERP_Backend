import type { PromotionType } from "../services/promotion.service";

export interface ContactInfo {
    main_phone?: string;
    alternate_phones?: string[];
    emails?: {
        primary?: string;
        support?: string;
        accounts?: string;
        principal?: string;
    };
    office_hours?: {
        monday_to_friday?: string;
        saturday?: string;
        sunday?: string;
    };
    website?: string;
    address_details?: {
        landmark?: string;
        area?: string;
        city?: string;
        state?: string;
        pincode?: string;
    };
    map_location?: {
        latitude?: number;
        longitude?: number;
    };
    social_links?: {
        facebook?: string;
        instagram?: string;
        youtube?: string;
    };
}

export interface TokenUser {
    id: string;
    firstName: string;
    lastName?: string;
    email: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    instituteId: string | number;
    phone: string;
    isActive?: boolean;
    profileImage: string;
    permissions: string[];
    roles: string[]
}

export interface BankDetails {
    bankName: string;
    bankAccHolderName: string;
    bankAccNo: string;
    bankIFSC: string;
    bankBranchName?: string;
    bankAccType: "savings" | "current";
    upiId?: string;
}

export interface TemplateParams {
    studentName: string;
    temporaryPassword: string;
    schoolName: string;
    contactEmail: string;
    contactPhone: string;
    schoolAddress: string;
    loginUrl: string;
}

export interface PromoteStudentParams {
    studentId: number;
    targetAcademicYearId: number;
    targetClassId: number;
    targetSectionId?: number;
    promotionType?: PromotionType;
}