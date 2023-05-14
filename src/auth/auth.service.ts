import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { DbService } from 'src/db/db.service';
import { AuthDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private dbService: DbService,
    private jwt: JwtService,
  ) {}

  async login(data: AuthDto) {
    // Find user by email
    const user = await this.dbService.user.findUnique({
      where: {
        email: data.email,
      },
    });

    // If user not found, throw 404 exception
    if (!user) {
      throw new UnauthorizedException('Credentials incorrect');
    }

    // Compare password
    const passwordMatch = await argon.verify(user.password, data.password);

    // If password not match, throw 401 exception
    if (!passwordMatch) {
      throw new UnauthorizedException('Credentials incorrect');
    }

    // Return jwt token
    return this.signToken(user.id, user.email);
  }

  async signup(data: AuthDto) {
    // Check if a user already exist with email
    const userExist = await this.dbService.user.findUnique({
      where: {
        email: data.email,
      },
    });

    // If user already exist, throw 403 exception
    if (userExist) {
      throw new ForbiddenException('Credentials already exists');
    }

    // Generate Password Hash
    const passwordHash = await argon.hash(data.password);

    //  Save the user to the database
    const user = await this.dbService.user.create({
      data: {
        email: data.email,
        password: passwordHash,
      },
    });

    // Return jwt token
    return this.signToken(user.id, user.email);
  }

  private async signToken(
    userId: number,
    email: string,
  ): Promise<{
    access_token: string;
  }> {
    const payload = {
      sub: userId,
      email,
    };

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET'),
    });
    return {
      access_token: token,
    };
  }
}
