import supertest from "supertest";

import app from "../../src/app.js";
import { recommendationFactory } from "../integration/factories/recommendationFactory.js";
import { deleteAllRecommendations, createRecommendation } from "../integration/factories/scenarioFactoroy.js";
import { prisma} from "../../src/database.js";

const request = supertest(app);

beforeEach(async () => {
    await deleteAllRecommendations();
});

describe("POST /recommendations", () => {
    it("should create a recommendation", async () => {
        const recommendation = await recommendationFactory();
        const response = await request.post("/recommendations").send(recommendation);
        expect(response.status).toBe(201);
        expect(response.body).toMatchObject(recommendation);
    }).timeout(10000);

    it("should throw an error if the recommendation already exists", async () => {
        const recommendation = await recommendationFactory();
        await prisma.recommendation.create({ data: recommendation });
        const response = await request.post("/recommendations").send(recommendation);
        expect(response.status).toBe(409);
    }).timeout(10000);
});