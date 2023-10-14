import createError, { HttpError } from 'http-errors';

const messageByCode = {
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',
};

class Redirect extends Error {
  public status: number;
  public statusCode: number;
  public location: string;
  constructor(code: number, location: string) {
    super(messageByCode[code]);

    this.status = this.statusCode = code;
    this.location = location;
  }
}

export const createRedirect = (code: number, location: string) =>
  new Redirect(code, location);

export const isRedirect = (error: any): error is Redirect =>
  error instanceof Error &&
  // @ts-ignore
  Boolean(messageByCode[error.statusCode]) &&
  // @ts-ignore
  typeof error.location === 'string';

export const createHttpError = (code: number, message: string) =>
  createError(code, message);

export const isHttpError = (error: any): error is HttpError =>
  createError.isHttpError(error);
