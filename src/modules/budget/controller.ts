import type { RequestHandler } from 'express';
import * as service from './service.js';
import { sendResponse } from '../../utils/response.js';

export const create: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(res, 201, 'Budget created', await service.create(req.user!.id, req.body));
  } catch (error) {
    next(error);
  }
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(res, 200, 'Budgets fetched', await service.list(req.user!.id, req.query as never));
  } catch (error) {
    next(error);
  }
};

export const alerts: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(res, 200, 'Budget alerts fetched', await service.alerts(req.user!.id));
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(res, 200, 'Budget updated', await service.update(req.user!.id, req.params.id, req.body));
  } catch (error) {
    next(error);
  }
};
