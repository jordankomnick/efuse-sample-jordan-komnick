import app from '../app';
import supertest from 'supertest';
import {PostsRepository} from '../repositories/posts.repository';
import {createClient} from 'redis';

jest.mock('../repositories/posts.repository')
jest.mock('redis')

const now = new Date();
const mockComment = {
    id: 'comment1',
    content: 'test comment',
    created_time: now.toString(),
    updated_time: now.toString(),
    user_id: 'user456'
};

const mockPost = {
    _id: 'post123',
    content: 'test content',
    created_time: now.toString(),
    updated_time: now.toString(),
    user_id: 'user123',
    comments: [mockComment]
}

const mockCachedPost = {
    _id: 'cachedPost123',
    content: 'test content cached',
    created_time: now.toString(),
    updated_time: now.toString(),
    user_id: 'user123',
    comments: [mockComment]
}

describe('GET /posts', () => {
    test("returns 200 and posts when successful", async () => {
        // @ts-ignore
        PostsRepository.mockImplementation(() => {
            return {
                getAllPosts: jest.fn().mockResolvedValue([mockPost]),
            };
        });

        await supertest(app).get("/posts")
            .expect(200)
            .then((response) => {
                expect(response.body.length).toEqual(1);
                expect(response.body[0]).toEqual(mockPost);
            });
    });

    test("returns 500 and error message when repo throws error", async () => {
        // @ts-ignore
        PostsRepository.mockImplementation(() => {
            return {
                getAllPosts: jest.fn().mockImplementation(() => {
                    throw new Error('error message')
                }),
            };
        });

        await supertest(app).get("/posts")
            .expect(500)
            .then((response) => {
                expect(response.body.message).toEqual('error message');
            });
    });
})

describe('GET /posts/:id', () => {
    test("returns 200 and post from repo when successful and not cached", async () => {
        const mockSet = jest.fn();
        // @ts-ignore
        createClient.mockImplementation(() => {
            return {
                connect: jest.fn(),
                get: jest.fn().mockResolvedValue(null),
                set: mockSet
            }
        })

        // @ts-ignore
        PostsRepository.mockImplementation(() => {
            return {
                getPost: jest.fn().mockResolvedValue(mockPost),
            };
        });

        await supertest(app).get("/posts/123")
            .expect(200)
            .then((response) => {
                expect(response.body).toEqual(mockPost);
                expect(mockSet).toHaveBeenCalledWith('123', JSON.stringify(mockPost), {EX: 180, NX: true})
            });
    });

    test("returns 200 and post from cache", async () => {
        const mockSet = jest.fn();
        // @ts-ignore
        createClient.mockImplementation(() => {
            return {
                connect: jest.fn(),
                get: jest.fn().mockResolvedValue(JSON.stringify(mockCachedPost)),
                set: mockSet
            }
        })

        const mockGetPost = jest.fn();
        // @ts-ignore
        PostsRepository.mockImplementation(() => {
            return {
                getPost: mockGetPost
            };
        });

        await supertest(app).get("/posts/123")
            .expect(200)
            .then((response) => {
                expect(response.body).toEqual(mockCachedPost);
                expect(mockGetPost).not.toHaveBeenCalled()
            });
    });

    test("returns 404 and error message when no post found", async () => {
        const mockSet = jest.fn();
        // @ts-ignore
        createClient.mockImplementation(() => {
            return {
                connect: jest.fn(),
                get: jest.fn().mockResolvedValue(null),
                set: mockSet
            }
        })

        // @ts-ignore
        PostsRepository.mockImplementation(() => {
            return {
                getPost: jest.fn().mockResolvedValue(null)
            };
        });

        await supertest(app).get("/posts/123")
            .expect(404)
            .then((response) => {
                expect(response.body.message).toEqual('No post found with id 123');
                expect(mockSet).not.toHaveBeenCalled();
            });
    });

    test("returns 500 and error message when repo throws error", async () => {
        // @ts-ignore
        PostsRepository.mockImplementation(() => {
            return {
                getPost: jest.fn().mockImplementation(() => {
                    throw new Error('error message')
                }),
            };
        });

        await supertest(app).get("/posts/123")
            .expect(500)
            .then((response) => {
                expect(response.body.message).toEqual('error message');
            });
    });
})

describe('POST /posts', () => {
    test("returns 201 and inserted id when successful", async () => {
        const mockCreatePost = jest.fn().mockResolvedValue('insertedid');
        // @ts-ignore
        PostsRepository.mockImplementation(() => {
            return {
                createPost: mockCreatePost,
            };
        });

        await supertest(app).post("/posts")
            .send({content: 'content', user_id: 'userid'})
            .expect(201)
            .then((response) => {
                expect(response.body.id).toEqual('insertedid');
                expect(mockCreatePost).toHaveBeenCalledWith({content: 'content', user_id: 'userid'})
            });
    });

    test("returns 500 and error message when repo throws error", async () => {
        // @ts-ignore
        PostsRepository.mockImplementation(() => {
            return {
                createPost: jest.fn().mockImplementation(() => {
                    throw new Error('error message')
                }),
            };
        });

        await supertest(app).post("/posts")
            .send({content: 'content', user_id: 'userid'})
            .expect(500)
            .then((response) => {
                expect(response.body.message).toEqual('error message');
            });
    });
})

describe('PUT /posts/:id', () => {
    test("returns 200 and updates post and cache", async () => {
        const mockSet = jest.fn();
        // @ts-ignore
        createClient.mockImplementation(() => {
            return {
                connect: jest.fn(),
                get: jest.fn().mockResolvedValue(null),
                set: mockSet
            }
        })

        const mockUpdatedPost = {...mockPost, content: 'updated'}

        const mockGetPost = jest.fn()
            .mockResolvedValueOnce(mockPost)
            .mockResolvedValue(mockUpdatedPost);
        // @ts-ignore
        PostsRepository.mockImplementation(() => {
            return {
                getPost: mockGetPost,
                updatePost: jest.fn()
            };
        });

        await supertest(app).put("/posts/123")
            .send({content: 'updated', user_id: 'userid'})
            .expect(200)
            .then((response) => {
                expect(response.body).toEqual(mockUpdatedPost);
                expect(mockSet).toHaveBeenCalledWith('123', JSON.stringify(mockUpdatedPost), {EX: 180, XX: true})
            });
    });

    test("returns 404 and error message when no post found", async () => {
        // @ts-ignore
        PostsRepository.mockImplementation(() => {
            return {
                getPost: jest.fn().mockResolvedValue(null)
            };
        });

        await supertest(app).put("/posts/123")
            .send({content: 'updated', user_id: 'userid'})
            .expect(404)
            .then((response) => {
                expect(response.body.message).toEqual('No post found with id 123');
            });
    });

    test("returns 500 and error message when repo throws error", async () => {
        // @ts-ignore
        PostsRepository.mockImplementation(() => {
            return {
                getPost: jest.fn().mockImplementation(() => {
                    throw new Error('error message')
                }),
            };
        });

        await supertest(app).get("/posts/123")
            .send({content: 'updated', user_id: 'userid'})
            .expect(500)
            .then((response) => {
                expect(response.body.message).toEqual('error message');
            });
    });
})

describe('DELETE /posts/:id', () => {
    test("returns 200 and deletes post from repo and cache", async () => {
        const mockDel = jest.fn();
        // @ts-ignore
        createClient.mockImplementation(() => {
            return {
                connect: jest.fn(),
                del: mockDel
            }
        })

        const mockDeletePost = jest.fn();
        // @ts-ignore
        PostsRepository.mockImplementation(() => {
            return {
                getPost: jest.fn().mockResolvedValue(mockPost),
                deletePost: mockDeletePost
            };
        });

        await supertest(app).delete("/posts/123")
            .expect(200)
            .then((response) => {
                expect(response.body).toEqual(mockPost);
                expect(mockDeletePost).toHaveBeenCalledWith('123');
                expect(mockDel).toHaveBeenCalledWith('123');
            });
    });

    test("returns 404 and error message when no post found", async () => {
        // @ts-ignore
        PostsRepository.mockImplementation(() => {
            return {
                getPost: jest.fn().mockResolvedValue(null)
            };
        });

        await supertest(app).delete("/posts/123")
            .expect(404)
            .then((response) => {
                expect(response.body.message).toEqual('No post found with id 123');
            });
    });

    test("returns 500 and error message when repo throws error", async () => {
        // @ts-ignore
        PostsRepository.mockImplementation(() => {
            return {
                getPost: jest.fn().mockImplementation(() => {
                    throw new Error('error message')
                }),
            };
        });

        await supertest(app).delete("/posts/123")
            .expect(500)
            .then((response) => {
                expect(response.body.message).toEqual('error message');
            });
    });
})
// describe('POST /posts/:id/comments', () => {
// })
// describe('GET /posts/:id/comments/:commentId', () => {
// })
// describe('GET /posts/:id/comments', () => {
// })
// describe('PUT /posts/:id/comments/:commentId', () => {
// })
// describe('DELETE /posts/:id/comments/:commentId', () => {
// })