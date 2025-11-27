import Router from 'express'
import { createInstitute } from '../controllers/institute.controller';
import { upload } from '../middlewares/multer.middleware';
import { authenticateUser } from '../middlewares/authenticate.middleware';
import { checkUserPersmission } from '../middlewares/checkPermission.middleware';
import { checkUserRoles } from '../middlewares/checkRoles.middleware';

const router = Router();

router
    .route('/createInstitute')
    .post(
        authenticateUser,
        checkUserPersmission(['saas.institute.create']),
        checkUserRoles(['SUPER_ADMIN']),
        upload.fields([{ name: 'instituteLogo', maxCount: 1 }]),
        createInstitute);

export default router