import { CraqService } from 'craq/src/types';
import format from 'craq/src/core/utils/cookie/format';
import { SetCookieServicePayload } from 'craq/src/core/services/cookie/types';

import ServerContext from '../../ServerContext';

const setCookieService: CraqService<SetCookieServicePayload> = (
  context: ServerContext<any>,
  payload,
) => {
  context.ctx.set('Set-Cookie', format(payload));

  return Promise.resolve();
};

export default setCookieService;
