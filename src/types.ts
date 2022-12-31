import { ServiceContext, ActionContext, NavigateCraqActionPayload } from 'craq';
import { Head } from './createHead';

export type ServerServiceContext<T> = ServiceContext & {
  ctx: T;
};

export type ServerActionContext<T> = ActionContext<T> & {
  head: Head;
};

export type ServerNavigateCraqAction<T = {}> = (
  context: ServerActionContext<T>,
  payload: NavigateCraqActionPayload,
) => any;
