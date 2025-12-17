import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { invoicesTable } from "../models";

const generateInvoiceNumber = async (instituteId: number): Promise<string> => {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}`;

    // Get the last invoice number for this institute
    const [lastInvoice] = await db
        .select({ invoiceNo: invoicesTable.invoiceNo })
        .from(invoicesTable)
        .where(eq(invoicesTable.instituteId, instituteId))
        .orderBy(sql`${invoicesTable.id} DESC`)
        .limit(1);

    let nextNumber = 1;

    if (lastInvoice) {
        // Extract number from last invoice (e.g., "INV-2025-0042" → 42)
        const match = lastInvoice.invoiceNo.match(/\d+$/);
        if (match) {
            nextNumber = parseInt(match[0]) + 1;
        }
    }

    // Format: INV-2025-0001
    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
};

export { generateInvoiceNumber };
