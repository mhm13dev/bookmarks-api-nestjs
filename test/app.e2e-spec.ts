import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { AppModule } from 'src/app.module';
import { AuthDto } from 'src/auth/dto';
import { CreateBookmarkDto, UpdateBookmarkDto } from 'src/bookmark/dto';
import { DbService } from 'src/db/db.service';
import { UpdateUserDto } from 'src/user/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let dbService: DbService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // remove all the properties that are not part of the DTO
      }),
    );

    await app.init();
    await app.listen(5010);

    dbService = moduleRef.get(DbService);

    await dbService.cleanDb();

    pactum.request.setBaseUrl('http://localhost:5010');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const body: AuthDto = {
      email: 'abc@gmail.com',
      password: '123',
    };

    describe('POST /auth/signup', () => {
      it('should throw if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            ...body,
            email: '',
          })
          .expectStatus(400);
      });

      it('should throw if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            ...body,
            password: '',
          })
          .expectStatus(400);
      });

      it('should throw if no body', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });

      it('should register a new user', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(body)
          .expectStatus(201);
      });

      it('should throw if register a duplicate user', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(body)
          .expectStatus(403);
      });
    });

    describe('POST /auth/login', () => {
      it('should throw if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({
            ...body,
            email: '',
          })
          .expectStatus(400);
      });

      it('should throw if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({
            ...body,
            password: '',
          })
          .expectStatus(400);
      });

      it('should throw if no body', () => {
        return pactum.spec().post('/auth/login').expectStatus(400);
      });

      it('should login an existing user', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(body)
          .expectStatus(200)
          .stores('user_access_token', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('GET /users/me', () => {
      it('should return the current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .expectStatus(200);
      });
    });

    describe('PATCH /users/me', () => {
      const body: UpdateUserDto = {
        firstName: 'Mubashir',
        email: 'mhm13dev@gmail.com',
      };

      it('should update the current user', () => {
        return pactum
          .spec()
          .patch('/users/me')
          .withBody(body)
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .expectStatus(200)
          .expectBodyContains(body.firstName)
          .expectBodyContains(body.email);
      });
    });
  });

  describe('Bookmarks', () => {
    describe('GET /bookmarks', () => {
      it('should return empty bookmarks array - before create', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .expectStatus(200)
          .expectBody({ bookmarks: [] });
      });
    });

    const body: CreateBookmarkDto = {
      title: 'Google',
      url: 'https://www.google.com',
    };

    describe('POST /bookmarks', () => {
      it('should create a new bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withBody(body)
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .expectStatus(201)
          .expectJsonLike({
            bookmark: {
              title: body.title,
              url: body.url,
            },
          })
          .stores('bookmark_id', 'bookmark.id');
      });
    });

    describe('GET /bookmarks', () => {
      it('should return all the bookmarks - after create', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .expectStatus(200)
          .expectJsonLength('bookmarks', 1);
      });
    });

    describe('GET /bookmarks/:id', () => {
      it('should return a bookmark', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmark_id}')
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .expectStatus(200)
          .expectJsonLike({
            bookmark: {
              id: '$S{bookmark_id}',
              title: body.title,
              url: body.url,
            },
          });
      });
    });

    describe('PATCH /bookmarks/:id', () => {
      const body: UpdateBookmarkDto = {
        description: 'Google Search Page',
      };

      it('should update a bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmark_id}')
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .withBody(body)
          .expectStatus(200)
          .expectJsonLike({
            bookmark: {
              id: '$S{bookmark_id}',
              description: body.description,
            },
          });
      });
    });

    describe('DELETE /bookmarks/:id', () => {
      it('should delete a bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmark_id}')
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .expectStatus(204);
      });
    });

    describe('GET /bookmarks', () => {
      it('should return empty bookmarks array - after delete', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{user_access_token}',
          })
          .expectStatus(200)
          .expectBody({ bookmarks: [] });
      });
    });
  });
});
