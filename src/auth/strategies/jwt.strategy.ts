import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  status?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload) {
    // Madde 9: Token geçerli olsa bile kullanıcı suspend edilmişse erişimi engelle
    if (payload.status === 'suspend' || payload.status === 'SUSPENDED') {
      throw new UnauthorizedException(
        'Hesabınız askıya alınmıştır (suspended).',
      );
    }

    return {
      userId: payload.sub,
      email: payload.email,
      status: payload.status,
    };
  }
}
