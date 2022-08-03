import supertest from "supertest";

import app from "../../src/app.js";
import { recommendationFactory } from "../integration/factories/recommendationFactory.js";
import { createRecommendation } from "./factories/scenarioFactory.js";
import { prisma} from "../../src/database.js";

const request = supertest(app);

beforeEach(async () => {
    await prisma.$transaction([
        prisma.$executeRaw`TRUNCATE TABLE recommendations RESTART IDENTITY`
    ]);
});

describe("POST /recommendations", () => {
    it("should create a recommendation", async () => {
        const recommendation = recommendationFactory();
        const response = await request.post("/recommendations").send(recommendation);
        expect(response.status).toBe(201);
        
        const recommendations = await prisma.recommendation.findUnique({
            where: { name: recommendation.name },
        });
        expect(recommendations).toBeDefined();
    });

    it("should throw an error if the recommendation already exists", async () => {
        const recommendation = await createRecommendation();
        const { name, youtubeLink } = recommendation[0];
        const response = await request.post("/recommendations").send({ name, youtubeLink });
        expect(response.status).toBe(409);
    });

    it("should throw an error if the name is invalid", async () => {
        const recommendation = recommendationFactory();
        delete recommendation.name;

        const response = await request.post("/recommendations").send(recommendation);
        expect(response.status).toBe(422);

        const recommendations = await prisma.recommendation.findMany({
            where: { name: recommendation.name },
        });
        expect(recommendations).toHaveLength(0);
    });

    it("should throw an error if the youtubeLink is invalid", async () => {
        const recommendation = recommendationFactory();
        delete recommendation.youtubeLink;

        const response = await request.post("/recommendations").send(recommendation);
        expect(response.status).toBe(422);
    });

    it("should throw an error if data is undefined", async () => {
        const recommendation = undefined;
        const response = await request.post("/recommendations").send(recommendation);
        expect(response.status).toBe(422);
    });
});

describe("GET /recommendations", () => {
    it("should get 10 recommendations", async () => {
        await createRecommendation(15);
        const response = await request.get("/recommendations");
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(10);
    });

    describe("GET /recommendations by id", () => {
        it("should get a recommendation by id", async () => {
            const recommendation = await createRecommendation();
            const { id } = recommendation[0];
            const response = await request.get(`/recommendations/${id}`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(recommendation[0]);
        });

        it("should throw an error if the recommendation id does not exist", async () => {
            const response = await request.get("/recommendations/12345");
            expect(response.status).toBe(404);
        });
    });

    describe("GET /recommendations/random", () => {
        it("should get a random recommendation", async () => {
            const recommendation = await createRecommendation(1);
            const response = await request.get("/recommendations/random");
            expect(response.status).toBe(200);
            expect(response.body).toEqual(recommendation[0]);
        });

        it("should not get a random recommendation if there are no recommendations", async () => {
            const response = await request.get("/recommendations/random");
            expect(response.status).toBe(404);
        });
    });

    describe("GET /recommendations/top", () => {
        it("should get the top 10 recommendations", async () => {
            await createRecommendation(10, 50);
            const response = await request.get("/recommendations/top/10");
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(10);
        });

        it("should not get the top recommendations if there are no recommendations", async () => {
            const response = await request.get("/recommendations/top/10");
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(0);
        });
    });
});

describe("POST /upvote", () => {
    it("should upvote a recommendation", async () => {
        const recommendation = await createRecommendation();
        const { id } = recommendation[0];
        const response = await request.post(`/recommendations/${id}/upvote`);
        const upvotedRecommendation = await prisma.recommendation.findUnique({
            where: { id },
        });
        
        expect(response.status).toBe(200);
        expect(upvotedRecommendation.score).toBe(1);
    });

    it("should throw an error if the recommendation id does not exist", async () => {
        const response = await request.post("/recommendations/12345/upvote");
        expect(response.status).toBe(404);
    });
});

describe("POST /downvote", () => {
    it("should downvote a recommendation", async () => {
        const recommendation = await createRecommendation();
        const { id } = recommendation[0];
        const response = await request.post(`/recommendations/${id}/downvote`);
        const downvotedRecommendation = await prisma.recommendation.findUnique({
            where: { id },
        });

        expect(response.status).toBe(200);
        expect(downvotedRecommendation.score).toBe(-1);
    });

    it("should remove recommendations with a score less than -5", async () => {
        const recommendation = await createRecommendation(1, -6);
        const { id } = recommendation[0];
        const response = await request.post(`/recommendations/${id}/downvote`);
        const downvotedRecommendation = await prisma.recommendation.findUnique({
            where: { id },
        });

        expect(response.status).toBe(200);
        expect(downvotedRecommendation).toBeNull();
    });

    it("should throw an error if the recommendation id does not exist", async () => {
        const response = await request.post("/recommendations/12345/downvote");
        expect(response.status).toBe(404);
    });
});

afterAll(async () => await prisma.$disconnect());