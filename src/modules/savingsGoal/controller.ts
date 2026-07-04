import type { RequestHandler } from 'express';
import * as service from './service.js';
import { sendResponse } from '../../utils/response.js';

export const create: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(res, 201, 'Savings goal created', await service.create(req.user!.id, req.body));
  } catch (error) {
    next(error);
  }
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(res, 200, 'Savings goals fetched', await service.list(req.user!.id));
  } catch (error) {
    next(error);
  }
};

export const contribute: RequestHandler = async (req, res, next) => {
  try {
    sendResponse(res, 200, 'Contribution added', await service.contribute(req.user!.id, req.params.id, req.body.amount));
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    await service.remove(req.user!.id, req.params.id);
    sendResponse(res, 200, 'Savings goal deleted');
  } catch (error) {
    next(error);
  }
};
