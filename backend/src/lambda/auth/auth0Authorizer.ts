import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
// import Axios from 'axios'
// import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
// const jwksUrl = process.env.JWT_URL
// const cert = await Axios.get(jwksUrl).promise()

const cert = `-----BEGIN CERTIFICATE-----
MIIDBzCCAe+gAwIBAgIJVlFZ/BNQJMmVMA0GCSqGSIb3DQEBCwUAMCExHzAdBgNV
BAMTFmRldi0xa2JqYWV6dC5hdXRoMC5jb20wHhcNMTkxMTE2MTgxNDEyWhcNMzMw
NzI1MTgxNDEyWjAhMR8wHQYDVQQDExZkZXYtMWtiamFlenQuYXV0aDAuY29tMIIB
IjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3kGqIs9jcDHwrQlvUEciQodE
EXs93DQ/pfbcxwl1vFSpmBRs2lXcmZbiH/0fLArgr5xrTOlnr8+0pZooBhvueuXl
vXVa2j+hhHsf/ZgRbFis9Ma0abW4TpSWE9CCyeG8G+vlIf+reUYTLe/lKtSEynj4
iGZ1FuMLhzR8c4VgjlIitS33SlHy/lxW+mqLiIFoL3lTCL2ip9DblksUyT2aqkON
N3QifFyXBleS1emVLNZIu4wVmnUAcrXHe4ImcDruixBiEeUngtpnDhULT270oCFI
IVPbeiT4PcdIJGdHSDS0mfCFynjq9oBP4Ip9PcGRwGXfXqm7KvFQOn2xG3FgUwID
AQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBR15kb6h6mdHB9oejgn
k7lxEGpcDDAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBAKA07Kr9
YTL5Q12t+gxgJmrgpzDMmPEj17F97EqSb2V1Z5G4MPTiO/mkBA9gkmCcDXQo4zyG
3YpsoydIbCxkgJeUaBm6nZ6qhE9/zxjwz+AxYjEpPcM9C9g4iT3P8YJuCYEe6vGP
wtcq61aN5qVGUf4pT35Td9rDkXKJ49aS+at72I2dJI+RHu92MQXAj4xit4iMclSt
O+hCr9GyT+1MF0U7e2HJ/ouXVa21O1l6UuWlucR+z6C4tqSv7RKHUVDosHUpPbdR
6m93QCeMxkQglVkU4+9UJlJHBrO6LXuKiLBq4jZw0WpysRI4+YQ5aF+4Qd2W+8oM
xoBN17SIheGzHoU=
-----END CERTIFICATE-----`

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  // const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  return verify(token, cert, {algorithms: ['RS256']} ) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
