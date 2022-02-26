import { Base, StructureType, Type } from ".";

export interface Endpoint extends Base {
  method: string;
  path: string;
  params: EndpointParam[];
  query?: StructureType;

  request?: EndpointRequest | EndpointRequest[];
  response?: Type;
}

export interface EndpointParam {
  name: string;
  link: string;
}

export type EndpointRequest = Type & { json: boolean; form: boolean };