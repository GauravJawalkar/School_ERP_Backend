import Router from 'express'
import { createInstitute } from '../controllers/institute.controller';
import { upload } from '../middlewares/multer.middleware';

const router = Router();

router.route('/createInstitute').post(upload.fields([{ name: 'instituteLogo', maxCount: 1 }]), createInstitute);

export default router