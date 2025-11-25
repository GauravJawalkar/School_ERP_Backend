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
    instituteId: string;
    phone: string;
    profile: string;
    permissions: string[];
    roles: string[]
}