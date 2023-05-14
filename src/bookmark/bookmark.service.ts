import { ForbiddenException, Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { CreateBookmarkDto, UpdateBookmarkDto } from './dto';

@Injectable()
export class BookmarkService {
  constructor(private dbService: DbService) {}

  async getBookmarks(userId: number) {
    const bookmarks = await this.dbService.bookmark.findMany({
      where: { id: userId },
    });

    return { bookmarks };
  }

  async getBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.dbService.bookmark.findFirst({
      where: { id: bookmarkId, userId },
    });
    return {
      bookmark,
    };
  }

  async createBookmark(userId: number, data: CreateBookmarkDto) {
    const bookmark = await this.dbService.bookmark.create({
      data: {
        userId,
        ...data,
      },
    });

    return { bookmark };
  }

  async updateBookmarkById(
    userId: number,
    bookmarkId: number,
    data: UpdateBookmarkDto,
  ) {
    const bookmark = await this.dbService.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId,
      },
    });

    if (!bookmark) {
      throw new ForbiddenException('Access to resource denied');
    }

    const updatedBookmark = await this.dbService.bookmark.update({
      where: {
        id: bookmarkId,
      },
      data: {
        ...data,
      },
    });

    return {
      bookmark: updatedBookmark,
    };
  }

  async deleteBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.dbService.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId,
      },
    });

    if (!bookmark) {
      throw new ForbiddenException('Access to resource denied');
    }

    await this.dbService.bookmark.delete({
      where: {
        id: bookmarkId,
      },
    });
  }
}
