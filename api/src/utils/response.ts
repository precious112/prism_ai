import { Response } from "express";

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const sendSuccess = (
  res: Response,
  data: any,
  statusCode = 200,
  pagination?: Pagination
) => {
  const response: { success: boolean; data: any; pagination?: Pagination } = {
    success: true,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  code?: string
) => {
  const response = {
    success: false,
    error: {
      message,
      code,
    },
  };

  res.status(statusCode).json(response);
};
