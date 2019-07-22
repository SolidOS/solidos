export interface SolidSession {
  authorization: SolidAuthorization;
  credentialType: string;
  idClaims: SolidClaim;
  idp: string;
  issuer: string;
  sessionKey: string;
  webId: string;
}

interface SolidAuthorization {
  access_token: string;
  client_id: string;
  id_token: string;
}

interface SolidClaim {
  at_hash: string;
  aud: string;
  azp: string;
  cnf: {
    jwk: string;
  };
  exp: number;
  iat: number;
  iss: string;
  jti: string;
  nonce: string;
  sub: string;
}