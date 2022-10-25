import {Collection, DeleteResult, MongoClient, ObjectId, UpdateResult} from "mongodb";
import {v4 as uuidv4} from 'uuid';

const MONGO_URI = "mongodb://localhost:27017";

type Comment = {
    id: string;
    content: string;
    created_time: Date;
    updated_time: Date;
    user_id: string;
}

type Post = {
    _id: string;
    content: string;
    created_time: Date;
    updated_time: Date;
    user_id: string;
    comments: Comment[];
}

class PostsRepositoryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PostsRepositoryError";
    }
}

export class PostsRepository {
    private client: MongoClient;

    async getAllPosts(): Promise<Post[]> {
        const result: Post[] = [];
        let errorMessage;

        try {
            const postsCollection = await this.setup();
            const cursor = await postsCollection.find();
            await cursor.forEach((doc) => {
                result.push(doc as any as Post);
            })
        } catch (e) {
            errorMessage = e.message;
        } finally {
            await this.client.close();
        }

        if (errorMessage) {
            throw new PostsRepositoryError(errorMessage);
        }

        return result;
    }

    async getPost(id: string): Promise<Post> {
        let result;
        let errorMessage;

        try {
            const postsCollection = await this.setup();
            result = await postsCollection.findOne({'_id': new ObjectId(id)});
        } catch (e) {
            errorMessage = e.message;
        } finally {
            await this.client.close();
        }

        if (errorMessage) {
            throw new PostsRepositoryError(errorMessage);
        }

        return result as any as Post;
    }

    async createPost(params: Pick<Post, 'content' | 'user_id'>): Promise<ObjectId> {
        const postData = {
            content: params.content,
            created_time: new Date(),
            updated_time: new Date(),
            user_id: params.user_id
        }

        let result;
        let errorMessage;

        try {
            const postsCollection = await this.setup();
            result = await postsCollection.insertOne(postData);

        } catch (e) {
            errorMessage = e.message;
        } finally {
            await this.client.close();
        }

        if (errorMessage) {
            throw new PostsRepositoryError(errorMessage);
        }

        return result.insertedId;
    }

    async updatePost(id: string, params: Pick<Post, 'content' | 'user_id'>): Promise<UpdateResult> {
        const update = {
            $set: {
                content: params.content,
                user_id: params.user_id,
                updated_time: new Date()
            }
        }

        let result;
        let errorMessage;

        try {
            const postsCollection = await this.setup();
            result = await postsCollection.updateOne({'_id': new ObjectId(id)}, update);
        } catch (e) {
            errorMessage = e.message;
        } finally {
            await this.client.close();
        }

        if (errorMessage) {
            throw new PostsRepositoryError(errorMessage);
        }

        return result;
    }

    async deletePost(id: string): Promise<DeleteResult> {
        let result;
        let errorMessage;

        try {
            const postsCollection = await this.setup();
            result = await postsCollection.deleteOne({'_id': new ObjectId(id)});
        } catch (e) {
            errorMessage = e.message;
        } finally {
            await this.client.close();
        }

        if (errorMessage) {
            throw new PostsRepositoryError(errorMessage);
        }

        return result;
    }

    async createComment(postId: string, params: Pick<Comment, 'content' | 'user_id'>): Promise<string> {
        const idToInsert = uuidv4();
        const comment: Comment = {
            id: idToInsert,
            content: params.content,
            created_time: new Date(),
            updated_time: new Date(),
            user_id: params.user_id
        };

        let errorMessage;

        try {
            const postsCollection = await this.setup();
            await postsCollection.updateOne({'_id': new ObjectId(postId)}, {$push: {comments: comment}});
        } catch (e) {
            errorMessage = e.message;
        } finally {
            await this.client.close();
        }

        if (errorMessage) {
            throw new PostsRepositoryError(errorMessage);
        }

        return idToInsert;
    }

    async getComment(postId: string, commentId: string): Promise<Comment> {
        const post = await this.getPost(postId);
        // I tried to do this with MongoDB queries, but couldn't get it to work
        // it would always return the entire document, not just the comment I wanted
        return post.comments.find(comment => comment.id === commentId);
    }

    async updateComment(postId: string, commentId: string, params: Pick<Comment, 'content' | 'user_id'>): Promise<UpdateResult> {
        const query = {'_id': new ObjectId(postId), "comments.id": commentId};
        const update = {
            $set: {
                "comments.$.content": params.content,
                "comments.$.user_id": params.user_id,
                "comments.$.updated_time": new Date()
            }
        };

        let result;
        let errorMessage;

        try {
            const postsCollection = await this.setup();
            result = await postsCollection.updateOne(query, update);
        } catch (e) {
            errorMessage = e.message;
        } finally {
            await this.client.close();
        }

        if (errorMessage) {
            throw new PostsRepositoryError(errorMessage);
        }

        return result;
    }

    async deleteComment(postId: string, commentId: string): Promise<UpdateResult> {
        let result;
        let errorMessage;

        try {
            const postsCollection = await this.setup();
            result = await postsCollection.updateOne(
                {'_id': new ObjectId(postId)},
                {$pull: {comments: {id: commentId}}}
            );
        } catch (e) {
            errorMessage = e.message;
        } finally {
            await this.client.close();
        }

        if (errorMessage) {
            throw new PostsRepositoryError(errorMessage);
        }

        return result;
    }

    private async setup(): Promise<Collection> {
        this.client = new MongoClient(MONGO_URI);
        await this.client.connect();
        const db = this.client.db("local");
        return db.collection("posts");
    }
}

