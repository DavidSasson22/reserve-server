import { Request } from 'express';

export interface GqlContext {
  req: Request & {
    user?: {
      id: string;
      username: string;
      role: string;
    };
  };
}
