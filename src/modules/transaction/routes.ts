import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './controller.js';
import {
  createTransactionSchema,
  idParamSchema,
  listTransactionsSchema,
  updateTransactionSchema,
} from './validation.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.get('/', validate(listTransactionsSchema), controller.list);
router.post('/', validate(createTransactionSchema), controller.create);
router.post('/import', upload.single('file'), controller.importCsv);
router.patch('/:id', validate(updateTransactionSchema), controller.update);
router.delete('/:id', validate(idParamSchema), controller.remove);

export default router;
