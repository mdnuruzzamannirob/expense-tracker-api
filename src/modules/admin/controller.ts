import type { RequestHandler } from 'express';
import { sendResponse } from '../../utils/response.js';
import * as service from './service.js';

export const users: RequestHandler = async (_req, res, next) => {
  try {
    sendResponse(res, 200, 'Users fetched', await service.users());
  } catch (error) {
    next(error);
  }
};

export const updateStatus: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(
      res,
      200,
      'User status updated',
      await service.updateStatus(String(req.params.id), req.body.isActive),
    );
  } catch (error) {
    next(error);
  }
};

export const stats: RequestHandler = async (_req, res, next) => {
  try {
    sendResponse(res, 200, 'Platform stats fetched', await service.stats());
  } catch (error) {
    next(error);
  }
};
