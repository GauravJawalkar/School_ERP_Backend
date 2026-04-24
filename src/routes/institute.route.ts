import Router from 'express'
import { allocateTeacherToSubject, createClassSection, createClassSubject, createSchool, createSchoolAdmin, createSchoolClass, createSubject, getAllSchools, getSchoolDetails, updateSchoolDetails, updateSchoolStatus, updateUserStatus } from '../controllers/institute.controller';
import { upload } from '../middlewares/multer.middleware';
import { authenticateUser } from '../middlewares/authenticate.middleware';
import { checkUserPersmission } from '../middlewares/checkPermission.middleware';
import { checkUserRoles } from '../middlewares/checkRoles.middleware';
import { schoolAdmin, superAdmin } from '../constants/auth.constants';

const router = Router();

router
    .route('/createInstitute')
    .post(
        authenticateUser,
        checkUserPersmission(['saas.institute.create']),
        checkUserRoles([superAdmin]),
        upload.fields([{ name: 'instituteLogo', maxCount: 1 }]),
        createSchool);

router
    .route('/createSchoolAdmin')
    .post(
        authenticateUser,
        checkUserRoles([superAdmin, schoolAdmin]),
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
        createClassSection);

router
    .route('/createSubject')
    .post(
        authenticateUser,
        checkUserPersmission(['subject.create']),
        createSubject
    );

router
    .route('/createClassSubject')
    .post(
        authenticateUser,
        checkUserPersmission(['subject.create']),
        createClassSubject
    );

router
    .route('/allocateTeacherToSubject')
    .post(
        authenticateUser,
        checkUserPersmission(['user.assign_role']),
        allocateTeacherToSubject
    );

router
    .route('/allSchools')
    .get(
        authenticateUser,
        checkUserRoles([superAdmin]),
        getAllSchools
    )

router
    .route('/updateUserStatus')
    .patch(
        authenticateUser,
        checkUserPersmission(['user.update']),
        checkUserRoles([superAdmin, schoolAdmin]),
        updateUserStatus
    )

router
    .route('/:slug')
    .get(
        authenticateUser,
        checkUserPersmission(['saas.institute.create', 'institute.view']),
        getSchoolDetails
    )

router
    .route('/update/:slug')
    .patch(
        authenticateUser,
        checkUserPersmission(['saas.subscription.manage', 'institute.update']),
        upload.fields([{ name: 'instituteLogo', maxCount: 1 }]),
        updateSchoolDetails
    )

router
    .route('/:slug/status')
    .patch(
        authenticateUser,
        checkUserRoles([superAdmin]),
        checkUserPersmission(['saas.subscription.manage', 'institute.update']),
        updateSchoolStatus
    )

export default router