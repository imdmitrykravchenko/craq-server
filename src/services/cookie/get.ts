import { CraqService } from 'craq/src/types';
import parse from 'craq/src/core/utils/cookie/parse';
import ServerContext from '../../ServerContext';

export type GetCookieServicePayload = {
  name: string;
  defaultValue?: string | number;
};

const getCookieService: CraqService<GetCookieServicePayload> = (
  context: ServerContext<any>,
  { name, defaultValue = null },
) => {
  const value = parse(context.ctx.get('Cookie') || '', name);

  return Promise.resolve(value === null ? defaultValue : value);
};

export default getCookieService;
