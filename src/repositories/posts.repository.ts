import {Collection, DeleteResult, MongoClient, ObjectId, UpdateResult} from "mongodb";

const MONGO_URI = "mongodb://localhost:27017";

export type Post = {
    _id: string;
    content: string;
    created_time: Date;
    updated_time: Date;
    user_id: string;
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
        } catch(e) {
            errorMessage = e.message;
        } finally {
            await this.client.close();
        }

        if(errorMessage) {
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
        } catch(e) {
            errorMessage = e.message;
        } finally {
            await this.client.close();
        }

        if(errorMessage) {
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

        } catch(e) {
            errorMessage = e.message;
        } finally {
            await this.client.close();
        }

        if(errorMessage) {
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
        } catch(e) {
            errorMessage = e.message;
        } finally {
            await this.client.close();
        }

        if(errorMessage) {
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
        } catch(e) {
            errorMessage = e.message;
        } finally {
            await this.client.close();
        }

        if(errorMessage) {
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

