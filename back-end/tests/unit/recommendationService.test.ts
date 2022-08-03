import { faker } from "@faker-js/faker";
import { jest } from "@jest/globals";

import { recommendationRepository } from "../../src/repositories/recommendationRepository.js";
import { recommendationService } from "../../src/services/recommendationsService.js";

beforeEach(() => {
    jest.clearAllMocks();
});

jest.mock("../../src/repositories/recommendationRepository.js");

const recommendation = {
    id: parseInt(faker.random.numeric()),
    name: faker.name.findName(),
    youtubeLink: "https://www.youtube.com/watch?v=KbNL9ZyB49c&list=RDMM&index=10",
    score: parseInt(faker.random.numeric()),
}

const video = {
    name: faker.name.findName(),
    youtubeLink: "https://www.youtube.com/watch?v=EG9t7Wsc9YU",
};

const allRecommendations = [
    recommendation,
    recommendation,
    recommendation,
];
console.log(allRecommendations);

describe("recommendation service", () => {
    describe("insert recommendation", () => {
        it("should create a recommendation", async () => {
            jest.spyOn(
                recommendationRepository,
                "findByName"
            ).mockResolvedValueOnce(null);
            jest.spyOn(
                recommendationRepository,
                "create"
            ).mockResolvedValueOnce(null);

            await recommendationService.insert(video);
            expect(recommendationRepository.findByName).toBeCalled();
            expect(recommendationRepository.create).toBeCalled();
        });

        it("should throw an error if the recommendation already exists", async () => {
            jest.spyOn(
                recommendationRepository,
                "findByName"
            ).mockResolvedValueOnce(true as any);

            await expect(recommendationService.insert(video)).rejects.toHaveProperty("type", "conflict");
        });
    });

    describe("get recommendations", () => {
        it("should get all recommendations", async () => {
            jest.spyOn(
                recommendationRepository,
                "findAll"
            ).mockResolvedValueOnce(allRecommendations);
            
            const result = await recommendationService.get();
            expect(recommendationRepository.findAll).toBeCalled();
            expect(result).toEqual(allRecommendations);
        });
    });

    describe("get random recommendation", () => {
        it("should get a random recommendation with score >= 10", async () => {
            jest.spyOn(
                Math,
                "random"
            ).mockImplementationOnce(() => 0.5); //FIXME random number between 0 and 1
            jest.spyOn(
                recommendationRepository,
                "findAll"
            ).mockResolvedValueOnce(allRecommendations);
            
            const result = await recommendationService.getRandom();
            expect(recommendationRepository.findAll).toBeCalled();
            expect(result).toEqual(allRecommendations[1]);
        });

        it("should get a random recommendation with -5 > score > 10", async () => {
            jest.spyOn(
                Math,
                "random"
            ).mockImplementationOnce(() => 0.5); //FIXME random number between 0 and 1
            jest.spyOn(
                recommendationRepository,
                "findAll"
            ).mockResolvedValueOnce(allRecommendations);
            
            const result = await recommendationService.getRandom();
            expect(recommendationRepository.findAll).toBeCalled();
            expect(result).toEqual(allRecommendations[1]);
        });

        // it("should not get a random recommendation if there are none", async () => {
        //     jest.spyOn(
        //         Math,
        //         "random"
        //     ).mockImplementation(() => 0.5); //FIXME random number between 0 and 1
        //     jest.spyOn(
        //         recommendationRepository,
        //         "findAll"
        //     ).mockResolvedValueOnce([]);

        //     const result = recommendationService.getRandom();
        //     console.log(result, "result");
        //     await expect(result).rejects.toHaveProperty("type", "not_found");
        // });
    });

    describe("get top recommendations", () => {
        it("should get the top recommendations", async () => {
            jest.spyOn(
                recommendationRepository,
                "getAmountByScore"
            ).mockResolvedValueOnce(allRecommendations);
            
            const result = await recommendationService.getTop(2);
            expect(recommendationRepository.getAmountByScore).toBeCalled();
            expect(result).toEqual(allRecommendations);
        });
    });

    describe("get recommendation by id", () => {
        it("should get a recommendation if id exists", async () => {
            jest.spyOn(
                recommendationRepository,
                "find"
            ).mockResolvedValueOnce(recommendation);
            
            const result = await recommendationService.getById(recommendation.id);
            expect(recommendationRepository.find).toBeCalled();
            expect(result).toEqual(recommendation);
        });

        it("should throw an error if id does not exist", async () => {
            jest.spyOn(
                recommendationRepository,
                "find"
            ).mockResolvedValueOnce(null);
            
            await expect(recommendationService.getById(recommendation.id)).rejects.toHaveProperty("type", "not_found");
        });
    });

    describe("upvote recommendation", () => {
        it("should upvote a recommendation that exists", async () => {
            jest.spyOn(
                recommendationRepository,
                "find"
            ).mockResolvedValueOnce(true as any);
            jest.spyOn(
                recommendationRepository,
                "updateScore"
            ).mockResolvedValueOnce(null);
            
            await recommendationService.upvote(recommendation.id);
            expect(recommendationRepository.find).toBeCalled();
            expect(recommendationRepository.updateScore).toBeCalled();
        });

        it("should throw an error if the recommendation does not exist", async () => {
            jest.spyOn(
                recommendationRepository,
                "find"
            ).mockResolvedValueOnce(false as any);
            
            await expect(recommendationService.upvote(recommendation.id)).rejects.toHaveProperty("type", "not_found");
        });
    });

    describe("downvote recommendation", () => {
        it("should downvote a recommendation that exists", async () => {
            jest.spyOn(
                recommendationRepository,
                "find"
            ).mockResolvedValueOnce(true as any);
            jest.spyOn(
                recommendationRepository,
                "updateScore"
            ).mockResolvedValueOnce(1 as any);
            jest.spyOn(
                recommendationRepository,
                "remove"
            ).mockResolvedValueOnce(null);
            
            await recommendationService.downvote(recommendation.id);
            expect(recommendationRepository.remove).not.toBeCalled();
            expect(recommendationRepository.find).toBeCalled();
            expect(recommendationRepository.updateScore).toBeCalled();
        });

        it("should throw an error if the recommendation does not exist", async () => {
            jest.spyOn(
                recommendationRepository,
                "find"
            ).mockResolvedValueOnce(false as any);
            
            await expect(recommendationService.downvote(recommendation.id)).rejects.toHaveProperty("type", "not_found");
        });

        it("should downvote and remove a recommendation", async () => {
            jest.spyOn(
                recommendationRepository,
                "find"
            ).mockResolvedValueOnce(true as any);
            jest.spyOn(
                recommendationRepository,
                "updateScore"
            ).mockResolvedValueOnce(-1 as any);
            jest.spyOn(
                recommendationRepository,
                "remove"
            ).mockResolvedValueOnce(0 as any);
            
            await recommendationService.downvote(recommendation.id);
            expect(recommendationRepository.find).toBeCalled();
            expect(recommendationRepository.updateScore).toBeCalled();
            //expect(recommendationRepository.remove).toBeCalled(); FIXME
        });
    });
})