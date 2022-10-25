import app from "../app";
import supertest from "supertest";
import {PostsRepository} from "../repositories/posts.repository";

jest.mock('../repositories/posts.repository')

test("GET /posts", async () => {
    const now = new Date();
    const mockPost = {
        _id: 'post123',
        content: 'test content',
        created_time: now.toString(),
        updated_time: now.toString(),
        user_id: 'user123',
        comments: [{
            id: 'comment123',
            content: 'test comment',
            created_time: now.toString(),
            updated_time: now.toString(),
            user_id: 'user456'
        }]
    }

    // @ts-ignore
    PostsRepository.mockImplementation(() => {
        return {
            getAllPosts: jest.fn().mockResolvedValue([mockPost]),
        };
    });

    await supertest(app).get("/posts")
        .expect(200)
        .then((response) => {
            // Check type and length
            expect(Array.isArray(response.body)).toBeTruthy();
            expect(response.body.length).toEqual(1);

            // Check data
            expect(response.body[0]).toEqual(mockPost);
        });
});