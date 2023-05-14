import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { UpdateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private dbService: DbService) {}

  async updateUser(userId: number, data: UpdateUserDto) {
    const user = await this.dbService.user.update({
      where: {
        id: userId,
      },
      data: {
        ...data,
      },
    });

    // remove password from the response
    // FIXME: use transformer instead
    delete user.password;

    return { user };
  }
}
