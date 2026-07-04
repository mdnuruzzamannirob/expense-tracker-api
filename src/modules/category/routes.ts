import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './controller.js';
import { createCategorySchema, idParamSchema, updateCategorySchema } from './validation.js';

const router = Router();

router.use(authenticate);
router.get('/', controller.list);
router.post('/', validate(createCategorySchema), controller.create);
router.patch('/:id', validate(updateCategorySchema), controller.update);
router.delete('/:id', validate(idParamSchema), controller.remove);

export default router;
