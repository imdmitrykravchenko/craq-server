const messageByCode = {
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',

  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',

  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

type HttpMessageArgument = { message?: string };

class HttpException extends Error {
  public statusCode: number;
  public params: object = {};

  constructor(statusCode: number, { message }: HttpMessageArgument = {}) {
    super(message || messageByCode[statusCode]);

    this.statusCode = statusCode;

    Object.setPrototypeOf(this, HttpException.prototype);
  }

  addParameters(params: object) {
    Object.assign(this.params, params);
  }

  toJSON() {
    return {
      ...this.params,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

export class Redirect extends HttpException {
  public location: string;

  constructor(
    statusCode: number,
    { message, location }: HttpMessageArgument & { location: string },
  ) {
    super(statusCode, { message });

    Object.setPrototypeOf(this, Redirect.prototype);

    this.location = location;
  }
}

export class HttpError extends HttpException {
  constructor(statusCode: number, { message }: HttpMessageArgument) {
    super(statusCode, { message });

    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export class ServerError extends HttpError {
  constructor(statusCode: number, { message }: HttpMessageArgument) {
    super(statusCode, { message });

    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

export class ClientError extends HttpError {
  constructor(statusCode: number, { message }: HttpMessageArgument) {
    super(statusCode, { message });

    Object.setPrototypeOf(this, ClientError.prototype);
  }
}
