import Router from 'express'
import { createClassSection, createSchool, createSchoolAdmin, createSchoolClass } from '../controllers/institute.controller';
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
        createSchool);

router
    .route('/createSchoolAdmin')
    .post(
        authenticateUser,
        checkUserRoles(['SUPER_ADMIN']),
        checkUserPersmission(['user.assign_role', 'user.create']),
        createSchoolAdmin);

router
    .route('/createClass')
    .post(
        authenticateUser,
        checkUserPersmission(['class.create']),
        createSchoolClass);

router
    .route('/createSection')
    .post(
        authenticateUser,
        checkUserPersmission(['class.create']),
        createClassSection)

export default router